import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    priceMax: { type: Number, default: null }, // for ranges e.g. K40 - K60
    duration: { type: Number, default: 60 }, // minutes
    category: { type: String, default: "Services" },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
