import express from "express";
import Booking from "../models/Booking.js";
import WaConversation from "../models/WaConversation.js";
import { handleIncoming, confirmationMessage } from "../utils/agent.js";
import { catDateStr, prettyDate, prettyTime } from "../utils/time.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/wa/webhook — inbound messages.
// Works as-is for testing, and mirrors the Meta WhatsApp Cloud API payload shape
// ({ entry: [ { changes: [ { value: { messages: [...] } ] } ] } }) so going live
// is just pointing the callback URL here.
router.post("/webhook", async (req, res) => {
  try {
    const body = req.body || {};

    // Meta WhatsApp Cloud API shape
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    let phone = null;
    let text = null;
    let name = "";

    if (value?.messages?.length) {
      const m = value.messages[0];
      phone = m.from; // digits only
      name = value.contacts?.[0]?.profile?.name || "";
      text = m.text?.body || "";
    } else if (body.from && (body.text || body.message)) {
      // simple shape used by most providers (Twilio-style and our simulator)
      phone = body.from;
      text = body.text || body.message;
      name = body.name || "";
    }

    if (!phone || !text) return res.json({ ok: true, ignored: true });

    const { reply } = await handleIncoming(phone, text, name);

    // Meta Cloud API also sends status webhooks — respond 200 fast.
    res.json({ ok: true, reply });
  } catch (err) {
    console.error("WA webhook error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/wa/webhook — Meta verification handshake
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token && token === (process.env.WHATSAPP_VERIFY_TOKEN || "opuluxe-verify")) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// GET /api/wa/conversations (admin) — inbox with unread-style preview
router.get("/conversations", protect, async (req, res) => {
  try {
    const convs = await WaConversation.find({})
      .sort({ updatedAt: -1 })
      .limit(100)
      .select("phone name state lastBookingRef messages updatedAt");

    const active = catDateStr(0);
    const items = convs.map((c) => {
      const last = c.messages[c.messages.length - 1];
      // a conversation needs attention when the last message is from the customer
      const needsReply = !last || last.from === "customer";
      return {
        id: c._id,
        phone: c.phone,
        name: c.name || `+${c.phone}`,
        state: c.state,
        lastBookingRef: c.lastBookingRef,
        updatedAt: c.updatedAt,
        needsReply,
        lastMessage: last ? last.text.slice(0, 140) : "",
        lastFrom: last?.from || "",
        messageCount: c.messages.length,
      };
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/wa/conversations/:id (admin) — full transcript
router.get("/conversations/:id", protect, async (req, res) => {
  try {
    const conv = await WaConversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/wa/conversations/:id/reply (admin) — manual operator send (logged into thread)
router.post("/conversations/:id/reply", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Message text is required" });
    const conv = await WaConversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    conv.messages.push({ from: "agent", text: text.trim(), ts: Date.now() });
    conv.state = "idle";
    await conv.save();
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/wa/conversations/:id/reset (admin) — clear stuck agent state
router.post("/conversations/:id/reset", protect, async (req, res) => {
  try {
    const conv = await WaConversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    conv.state = "idle";
    conv.draft = {};
    await conv.save();
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/wa/simulate (admin) — test the agent from the inbox UI
router.post("/simulate", protect, async (req, res) => {
  try {
    const { from, text, name } = req.body;
    if (!from || !text) return res.status(400).json({ message: "from and text are required" });
    const { reply, conversation, booking } = await handleIncoming(String(from), text, name || "");
    res.json({ reply, conversation, booking: booking || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/wa/reminders/run — called by Vercel cron (protected by CRON_SECRET)
// Sends: day-before reminder, 2-hour reminder, and review message after appointment.
router.post("/reminders/run", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const expected = process.env.CRON_SECRET || "";
    if (!expected || auth !== `Bearer ${expected}`) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const today = catDateStr(0);
    const tomorrow = catDateStr(1);

    const due = await Booking.find({
      status: { $ne: "cancelled" },
      date: { $in: [today, tomorrow] },
    });

    const sent = [];
    const nowLusaka = new Date(Date.now() + 2 * 3600 * 1000);
    const nowMin = nowLusaka.getUTCHours() * 60 + nowLusaka.getUTCMinutes();

    for (const b of due) {
      const kinds = b.waReminders || [];
      const startMin = Number(b.time.slice(0, 2)) * 60 + Number(b.time.slice(3, 5));

      // Day-before reminder (for tomorrow's bookings, sent when cron runs)
      if (b.date === tomorrow && !kinds.includes("day_before")) {
        kinds.push("day_before");
        sent.push({
          phone: b.phone,
          booking: b.reference,
          kind: "day_before",
          message:
            `⏰ Reminder from *OPULUXE Beauty Studio*\n\nHi ${b.customerName.split(" ")[0]}! Your *${b.serviceName}* is tomorrow, ${prettyDate(b.date)} at ${prettyTime(b.time)}.\n\nReference: *${b.reference}*\n\nSee you soon 💛 Reply to reschedule if you need to.`,
        });
      }

      // 2-hour-before reminder (for today's bookings still ahead)
      if (b.date === today && startMin - nowMin <= 120 && startMin - nowMin > -60 && !kinds.includes("2h_before")) {
        kinds.push("2h_before");
        sent.push({
          phone: b.phone,
          booking: b.reference,
          kind: "2h_before",
          message:
            `💇‍♀️ See you soon, ${b.customerName.split(" ")[0]}!\n\nYour *${b.serviceName}* at *OPULUXE* starts in about 2 hours — ${prettyTime(b.time)}.\n\nRunning late? Just reply here and let us know 💛`,
        });
      }

      b.waReminders = kinds;
      // eslint-disable-next-line no-await-in-loop
      await b.save();
    }

    res.json({ ok: true, sent, count: sent.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
