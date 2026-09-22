import express from "express";
import Service from "../models/Service.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/services  (public — active only; ?all=true for admin)
router.get("/", async (req, res) => {
  try {
    const filter = req.query.all === "true" ? {} : { active: true };
    const services = await Service.find(filter).sort({ order: 1, price: 1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/services (admin)
router.post("/", protect, async (req, res) => {
  try {
    const { name, price, priceMax, duration, category, description, order, active } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: "Name and price are required" });
    }
    const service = await Service.create({
      name,
      price,
      priceMax: priceMax ?? null,
      duration: duration ?? 60,
      category: category || "Services",
      description: description || "",
      order: order ?? 0,
      active: active ?? true,
    });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/services/:id (admin)
router.put("/:id", protect, async (req, res) => {
  try {
    const updates = (({ name, price, priceMax, duration, category, description, order, active }) => ({
      name,
      price,
      priceMax,
      duration,
      category,
      description,
      order,
      active,
    }))(req.body);

    // Remove undefined keys so PATCH-style updates don't wipe fields
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const service = await Service.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/services/:id (admin)
router.delete("/:id", protect, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
