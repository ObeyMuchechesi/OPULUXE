import express from "express";
import { protect } from "../middleware/auth.js";
import { computeKpis } from "../utils/kpis.js";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import WaConversation from "../models/WaConversation.js";
import { catDateStr, catNow, prettyDate, prettyTime } from "../utils/time.js";
import { computeSlots, OPENING_HOUR, CLOSING_HOUR } from "../utils/schedule.js";

const router = express.Router();

// GET /api/analytics/kpis (admin) — rich dashboard KPIs
router.get("/kpis", protect, async (req, res) => {
  try {
    const kpis = await computeKpis();
    res.json(kpis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/analytics/assistant (admin) — AI dashboard assistant.
// Rules-based NLU over live data (no external AI key needed): understands
// questions about revenue, bookings, customers, availability, top services,
// pending work and scheduling windows. Answers are grounded in the database.
router.post("/assistant", protect, async (req, res) => {
  try {
    const q = String(req.body?.question || "").trim();
    if (!q) return res.status(400).json({ message: "Question is required" });

    const t = q.toLowerCase();
    const today = catDateStr(0);

    // 1. Revenue questions
    if (/revenue|earn|income|money|sales|made/.test(t)) {
      const k = await computeKpis();
      if (/month|this month/.test(t)) {
        return res.json({
          answer:
            `Revenue from completed bookings this month is *K${k.revenueThisMonth.toLocaleString()}* ` +
            `(${k.bookingsThisMonth} booking${k.bookingsThisMonth === 1 ? "" : "s"}), ` +
            `vs K${k.revenueLastMonth.toLocaleString()} last month — a ${k.revenueDeltaPct >= 0 ? "+" : ""}${k.revenueDeltaPct}% change. ` +
            `Average ticket is K${k.avgTicket.toLocaleString()}.`,
        });
      }
      const top = k.topServices[0];
      const total6m = k.revenueSeries.reduce((a, s) => a + s.revenue, 0);
      return res.json({
        answer:
          `Total revenue from completed bookings is *K${total6m.toLocaleString()}* across the last 6 months. ` +
          `This month: K${k.revenueThisMonth.toLocaleString()} (${k.revenueDeltaPct >= 0 ? "+" : ""}${k.revenueDeltaPct}% vs last month). ` +
          (top ? `Top earner: *${top.name}* (K${top.revenue.toLocaleString()} from ${top.count} visits).` : ""),
      });
    }

    // 2. Pending / needs-action
    if (/pending|await|need.*(confirm|action)|todo|to-do|waiting/.test(t)) {
      const pend = await Booking.find({ status: "pending" }).sort({ date: 1 }).limit(5);
      return res.json({
        answer:
          `There ${pend.length === 1 ? "is" : "are"} *${pend.length}* pending booking${pend.length === 1 ? "" : "s"} awaiting confirmation.` +
          (pend.length
            ? "\n\n" + pend.map((b) => `• ${b.reference} — ${b.customerName}, ${b.serviceName}, ${prettyDate(b.date)} ${prettyTime(b.time)}`).join("\n") +
              "\n\nConfirm them from the Bookings tab to lock in the calendar."
            : "\n\nAll clear — nothing waiting on you 🎉"),
      });
    }

    // 3. Today / tomorrow schedule
    if (/today|tomorrow|schedule|agenda|day\b/.test(t)) {
      const target = /tomorrow/.test(t) ? catDateStr(1) : today;
      const list = await Booking.find({ date: target, status: { $ne: "cancelled" } }).sort({ time: 1 });
      const label = /tomorrow/.test(t) ? "Tomorrow" : "Today";
      return res.json({
        answer:
          list.length
            ? `${label} (${prettyDate(target)}) you have *${list.length} appointment${list.length === 1 ? "" : "s"}*:\n\n` +
              list.map((b) => `• ${prettyTime(b.time)} — ${b.customerName} (${b.serviceName}, ${b.status})`).join("\n")
            : `${label} (${prettyDate(target)}) is wide open — no appointments yet. Good day to promote slots!`,
      });
    }

    // 4. Free slots / availability
    if (/free|available|open slot|opening|vacan/.test(t)) {
      const target = /tomorrow/.test(t) ? catDateStr(1) : today;
      const slots = await computeSlots(target, 60);
      const free = slots.filter((s) => s.available).map((s) => s.time);
      return res.json({
        answer:
          free.length
            ? `For ${prettyDate(target)} there are *${free.length} open hourly slots*:\n${free.map((s) => prettyTime(s)).join(", ")}`
            : `No open slots on ${prettyDate(target)} — fully booked.`,
      });
    }

    // 5. Customers
    if (/customer|client|repeat|return|regular|loyal|how many people|how many customers/.test(t)) {
      const k = await computeKpis();
      return res.json({
        answer:
          `You've served *${k.totalCustomers} unique customers* so far. ` +
          `${k.repeatCustomers} of them ${k.repeatCustomers === 1 ? "is" : "are"} repeat visitors — that's a ` +
          `${k.totalCustomers ? Math.round((k.repeatCustomers / k.totalCustomers) * 100) : 0}% return rate. ` +
          `${k.upcoming7} appointment${k.upcoming7 === 1 ? " is" : "s are"} scheduled in the next 7 days.`,
      });
    }

    // 6. Top services
    if (/top|popular|best|most|favourite|favorite|service/.test(t)) {
      const k = await computeKpis();
      return res.json({
        answer: k.topServices.length
          ? `Your most-booked services (completed):\n\n` +
            k.topServices.map((s, i) => `${i + 1}. *${s.name}* — ${s.count}× (K${s.revenue.toLocaleString()})`).join("\n")
          : "No completed bookings yet, so no trends to report.",
      });
    }

    // 7. Cancelled / completion rate
    if (/cancel|completion|complete rate|how.*doing|performance|summary|overview/.test(t)) {
      const k = await computeKpis();
      return res.json({
        answer:
          `Business snapshot:\n\n• Completion rate: *${k.completionRate}%* (${k.completed} completed, ${k.cancelled} cancelled)\n` +
          `• Pending: ${k.pending}\n• Next 7 days: ${k.upcoming7} appointments\n` +
          `• This month: K${k.revenueThisMonth.toLocaleString()} from ${k.bookingsThisMonth} bookings (${k.revenueDeltaPct >= 0 ? "+" : ""}${k.revenueDeltaPct}%)\n` +
          `• Average ticket: K${k.avgTicket.toLocaleString()}`,
      });
    }

    // 8. Hours / practical questions
    if (/hour|open|close|when.*open/.test(t)) {
      return res.json({
        answer: `The studio runs 7:00 AM – 8:00 PM (last appointments finish by closing). Sundays are by appointment. The booking system generates 30-minute slots between those hours automatically.`,
      });
    }

    // Fallback: what the assistant can do
    return res.json({
      answer:
        "I can answer questions about your live data — try:\n\n• *How is revenue this month?*\n• *What's pending?*\n• *Who's booked today/tomorrow?*\n• *What slots are free tomorrow?*\n• *How many repeat customers?*\n• *Top services?*\n• *Give me a summary*",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
