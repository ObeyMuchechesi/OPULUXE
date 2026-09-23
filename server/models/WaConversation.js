import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ["customer", "agent"], required: true },
    text: { type: String, default: "" },
    ts: { type: Number, default: 0 },
  },
  { _id: false }
);

const waConversationSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    state: { type: String, default: "idle" },
    draft: { type: Object, default: {} },
    messages: { type: [messageSchema], default: [] },
    lastBookingRef: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("WaConversation", waConversationSchema);
