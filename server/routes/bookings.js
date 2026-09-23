import express from "express";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import { protect } from "../middleware/auth.js";
import { computeSlots, OPENING_HOUR, CLOSING_HOUR, timeToMin, overlaps } from "../utils/schedule.js";
import { generateReference } from "../utils/refs.js";

const router = express.Router();

const pad2 = (n) => String(n).padStart(2, "0");
const OPEN_AT = `${pad2(OPENING_HOUR)}:00`;
const CLOSE_AT = `${pad2(CLOSING_HOUR)}:00`;

// GET /api/bookings/slots?date=YYYY-MM-DD&duration=90 — public slot availability
// Returns [{ time: "07:30", available: true }, ...] honouring each booking's duration.
router.get("/slots", async (req, res) => {
  try {
    const { date, duration } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Valid date (YYYY-MM-DD) is required" });
    }
    const slots = await computeSlots(date, duration);
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bookings — public booking creation
router.post("/", async (req, res) => {
  try {
    const { customerName, phone, email, serviceId, date, time, notes } = req.body;

    if (!customerName || !phone || !serviceId || !date || !time) {
      return res.status(400).json({ message: "Name, phone, service, date and time are required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Date must be in YYYY-MM-DD format" });
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ message: "Time must be in HH:mm format" });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.active) {
      return res.status(400).json({ message: "Selected service is not available" });
    }

    // Opening-hours + closing-time validation
    const duration = service.duration || 60;
    const newStart = timeToMin(time);
    const newEnd = newStart + duration;
    if (newStart < OPENING_HOUR * 60 || newEnd > CLOSING_HOUR * 60) {
      return res.status(409).json({
        message: `Appointments must run between ${OPEN_AT} and ${CLOSE_AT}. Please pick a time inside our opening hours.`,
      });
    }

    // Overlap protection: the new appointment must not collide with any
    // non-cancelled booking on the same date.
    const sameDay = await Booking.find({ date, status: { $ne: "cancelled" } }).select(
      "time duration -_id"
    );
    const clash = sameDay.some((b) => {
      const start = timeToMin(b.time);
      return overlaps(newStart, newEnd, start, start + (Number(b.duration) || 60));
    });
    if (clash) {
      return res.status(409).json({
        message: "That time slot has just been taken. Please pick another time.",
      });
    }

    // Unique reference with retry
    let reference = generateReference();
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await Booking.findOne({ reference });
      if (!exists) break;
      reference = generateReference();
    }

    const booking = await Booking.create({
      reference,
      customerName,
      phone,
      email: email || "",
      service: service._id,
      serviceName: service.name,
      price: service.price,
      priceMax: service.priceMax,
      duration,
      date,
      time,
      notes: notes || "",
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/track/:reference — public booking tracker
router.get("/track/:reference", async (req, res) => {
  try {
    const ref = req.params.reference.trim().toUpperCase();
    const booking = await Booking.findOne({ reference: ref });
    if (!booking) {
      return res.status(404).json({ message: "No booking found with that reference" });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings (admin) — filters: ?search=&status=&date=&q=
router.get("/", protect, async (req, res) => {
  try {
    const { status, date, search, q } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (date) filter.date = date;

    const term = (search || q || "").trim();
    if (term) {
      const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(esc, "i");
      filter.$or = [
        { customerName: rx },
        { phone: rx },
        { email: rx },
        { reference: new RegExp(`^${esc}`, "i") }, // prefix match so "OBS" / "OBS-5" find refs
        { serviceName: rx },
      ];
    }

    const bookings = await Booking.find(filter)
      .sort({ date: 1, time: 1 })
      .limit(500);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/stats (admin) — dashboard summary
router.get("/stats", protect, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [total, todayCount, pending, confirmed, completed, cancelled, revenueAgg] =
      await Promise.all([
        Booking.countDocuments({}),
        Booking.countDocuments({ date: today, status: { $ne: "cancelled" } }),
        Booking.countDocuments({ status: "pending" }),
        Booking.countDocuments({ status: "confirmed" }),
        Booking.countDocuments({ status: "completed" }),
        Booking.countDocuments({ status: "cancelled" }),
        Booking.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, revenue: { $sum: "$price" } } },
        ]),
      ]);

    res.json({
      total,
      today: todayCount,
      todays: todayCount, // legacy alias
      pending,
      confirmed,
      completed,
      cancelled,
      revenue: revenueAgg[0]?.revenue || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/status (admin)
router.patch("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/payment (admin)
router.patch("/:id/payment", protect, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!["unpaid", "deposit", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bookings/:id (admin) — generic update (status / paymentStatus)
router.put("/:id", protect, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/bookings/:id (admin)
router.delete("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
