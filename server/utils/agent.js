import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import WaConversation from "../models/WaConversation.js";
import { computeSlots, OPENING_HOUR, CLOSING_HOUR } from "./schedule.js";
import { generateReference } from "./refs.js";
import { catDateStr, catNow, prettyDate, prettyTime } from "./time.js";

const MAX_DAYS_AHEAD = 30;
const REF_PREFIX = "OBS-";

const normPhone = (p) => String(p || "").replace(/[^\d]/g, "");
const matchesRef = (t) => /OBS[-\s]?[A-Z0-9]{4,8}/i.test(t);
const extractRef = (t) => {
  const m = t.toUpperCase().match(/OBS-?[A-Z0-9]{4,8}/);
  return m ? m[0].replace(/^-/, "-").startsWith("OBS-") ? m[0].replace(/\s/g, "") : `OBS-${m[0].slice(3).replace(/-/g, "")}` : null;
};

const daysOfWeek = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

// Parse a user's free-text date into YYYY-MM-DD (Lusaka today = day 0)
const parseDateText = (text) => {
  const t = text.toLowerCase();
  const today = catDateStr(0);

  if (/\btoday\b|\bnow\b|\basap\b/.test(t)) return today;
  if (/\btomorrow\b|\btmrw\b/.test(t)) return catDateStr(1);

  // "in 3 days" / "in two weeks"
  const inMatch = t.match(/\bin\s+(a|\d+|one|two|three|four|five|six)\s+(day|week)s?\b/);
  if (inMatch) {
    const words = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    const n = words[inMatch[1]] ?? Number(inMatch[1]);
    return catDateStr(n * (inMatch[2] === "week" ? 7 : 1));
  }

  // weekday name → next occurrence
  for (const [word, dow] of Object.entries(daysOfWeek)) {
    if (new RegExp(`\\b(next\\s+)?${word}\\b`).test(t)) {
      const now = catNow();
      const delta = (dow - now.getUTCDay() + 7) % 7 || 7; // always future
      return catDateStr(delta);
    }
  }

  // 2026-09-22 or 22/09/2026 or 22-09
  const iso = t.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  }
  const dmy = t.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (dmy) {
    let year = dmy[3] ? Number(dmy[3]) : catNow().getUTCFullYear();
    if (year < 100) year += 2000;
    return `${year}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  }

  // "22 September", "Sep 22"
  const MONTHS = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  };
  const dm = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)/);
  const md = t.match(/\b(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  const mm = dm || md;
  if (mm) {
    const day = dm ? Number(mm[1]) : Number(mm[2]);
    const mon = MONTHS[(dm ? mm[2] : mm[1]).slice(0, 3)];
    let year = catNow().getUTCFullYear();
    const cand = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (cand < today) year += 1; // passed this year → next year
    return `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
};

// "7pm", "10:30am", "14:00", "9" → "19:00" / "10:30" / "14:00" / "09:00"
const parseTimeText = (text) => {
  const t = text.toLowerCase();
  const m =
    t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ||
    t.match(/\b(\d{1,2}):(\d{2})\b/) ||
    t.match(/\bat\s+(\d{1,2})\b/) ||
    t.match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/);

  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = m[3] || (t.includes("pm") ? "pm" : t.includes("am") ? "am" : "");

  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (!ap && h < 7) h += 12; // "3" alone → 3 PM (studio opens 7 AM)
  if (h > 23 || min > 59) return null;

  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

const findService = async (text) => {
  const t = text.toLowerCase();
  const services = await Service.find({ active: true });
  // exact-ish name match first (longest name wins)
  const named = services
    .filter((s) => t.includes(s.name.toLowerCase().split(" ").slice(0, 3).join(" ")))
    .sort((a, b) => b.name.length - a.name.length);
  if (named.length) return named[0];
  // keyword match
  const KEYWORDS = {
    "knotless": /knotless/,
    "box braids": /box braid/,
    "goddess": /goddess/,
    "cornrows": /cornrow|straight.?back/,
    "passion twist": /passion/,
    "spring twist": /spring/,
    "senegalese twist": /senegal/,
    "spanish curl": /spanish/,
    "bone straight": /bone\s*straight|bs\b/,
    "silk press": /silk\s*press/,
    "blow out": /blow/,
    "trim": /trim|scalp/,
    "deep condition": /deep\s*cond|treatment|stea/,
    "locs": /loc|sisterlock|dread/,
    "fulani": /fulani/,
    "boho": /boho/,
    "bob": /\bbob\b/,
  };
  for (const [needle, rx] of Object.entries(KEYWORDS)) {
    if (rx.test(t)) {
      const hit =
        services.find((s) => s.name.toLowerCase().includes(needle)) ||
        services.find((s) => s.category.toLowerCase().includes(needle.split(" ")[0]));
      if (hit) return hit;
    }
  }
  return null;
};

const GREETING = `Hi and welcome to *OPULUXE Beauty Studio* 💫 Your Beauty Elevated.

I'm Lux, the studio's booking assistant. I can help you:
1️⃣ *Book* an appointment
2️⃣ *Check* or change an existing booking
3️⃣ *See* our services & prices

How can I help you today? (You can also just tell me what you'd like — e.g. "I want knotless braids on Saturday")`;

const summarize = (d) =>
  `*${d.serviceName}* — ${prettyDate(d.date)} at ${prettyTime(d.time)}${d.price ? ` (K${Number(d.price).toLocaleString()})` : ""}`;

const resetDraft = () => ({});

export async function handleIncoming(phone, text, nameHint = "") {
  const t = (text || "").trim();
  const lower = t.toLowerCase();

  let conv = await WaConversation.findOne({ phone });
  if (!conv) conv = await WaConversation.create({ phone });
  if (nameHint && !conv.name) conv.name = nameHint;
  conv.messages.push({ from: "customer", text: t, ts: Date.now() });

  const log = (out) => {
    conv.messages.push({ from: "agent", text: out, ts: Date.now() });
  };

  const save = async () => {
    conv.markModified("draft");
    await conv.save();
  };

  // ---------- GLOBAL INTENTS (work in any state) ----------
  if (matchesRef(t)) {
    const ref = extractRef(t);
    const booking = await Booking.findOne({ reference: ref });
    if (booking) {
      conv.lastBookingRef = booking.reference;
      const lines = [
        `Here's your booking *${booking.reference}* 🔖`,
        `• Service: ${booking.serviceName}`,
        `• When: ${prettyDate(booking.date)} at ${prettyTime(booking.time)}`,
        `• Status: *${booking.status}* · Payment: *${booking.paymentStatus}*`,
      ];
      if (booking.status === "cancelled") lines.push("\nThis one was cancelled — would you like me to book a new appointment? Just tell me the service and day.");
      else if (booking.date >= catDateStr(0)) lines.push("\nWant to reschedule? Tell me a new day and time and I'll move it for you.");
      log(lines.join("\n"));
      conv.state = "idle";
      conv.draft = resetDraft();
      await save();
      return { reply: lines.join("\n"), conversation: conv };
    }
    log(`I couldn't find a booking with reference *${ref}*. Double-check it and send it again, or type *menu*.`);
    await save();
    return { reply: `I couldn't find a booking with reference *${ref}*. Double-check it and send it again, or type *menu*.`, conversation: conv };
  }

  if (/^(menu|hi|hello|hey|start|good\s?(morning|afternoon|evening)|muli shani|shani)\b/i.test(lower) && conv.state !== "await_time_confirm" && conv.state !== "await_name") {
    log(GREETING);
    conv.state = "menu";
    conv.draft = resetDraft();
    await save();
    return { reply: GREETING, conversation: conv };
  }

  if (/\b(cancel|stop|nevermind|never mind|forget it)\b/.test(lower) && conv.state !== "await_time_confirm") {
    conv.state = "idle";
    conv.draft = resetDraft();
    const out = "No problem — I've cleared that. Type *book* whenever you're ready, or send a booking reference (e.g. OBS-5RXARB) to check an existing one.";
    log(out);
    await save();
    return { reply: out, conversation: conv };
  }

  if (/\b(price|prices|how much|cost|rate)s?\b/.test(lower) && conv.state !== "await_time_confirm") {
    const services = await Service.find({ active: true }).sort({ order: 1 });
    const byCat = {};
    for (const s of services) (byCat[s.category] = byCat[s.category] || []).push(s);
    const out =
      "*Our Price List* 💇‍♀️\n\n" +
      Object.entries(byCat)
        .map(
          ([cat, items]) =>
            `*${cat}*\n` +
            items.map((s) => `• ${s.name} — K${s.priceMax && s.priceMax > s.price ? `${s.price.toLocaleString()}–${s.priceMax.toLocaleString()}` : s.price.toLocaleString()}`).join("\n")
        )
        .join("\n\n") +
      "\n\nWant to book one? Just tell me the service and your preferred day 💛";
    log(out);
    conv.state = "idle";
    await save();
    return { reply: out, conversation: conv };
  }

  if (/\b(book|appointment|available|availability|slot|schedule|i want|i'd like|i would like|i need|can i get|can i book)\b/.test(lower) && !conv.state.startsWith("await") && conv.state !== "await_time_confirm") {
    // fast path: "book knotless saturday at 10"
    const svc = await findService(t);
    const date = parseDateText(t);
    const time = parseTimeText(t);
    if (svc) {
      conv.draft = { ...conv.draft, serviceId: String(svc._id), serviceName: svc.name, duration: svc.duration || 60, price: svc.price };
      if (date) conv.draft.date = date;
      if (time) conv.draft.time = time;
    }
    return askNextMissing(conv, log, save, true);
  }

  // ---------- FLOW STATE MACHINE ----------
  switch (conv.state) {
    case "await_service": {
      const svc = await findService(t);
      if (!svc) {
        const services = await Service.find({ active: true }).sort({ order: 1 }).limit(12);
        const out =
          `I didn't catch the service name 🤔 We're famous for:\n` +
          services.map((s) => `• ${s.name} (K${s.price.toLocaleString()})`).join("\n") +
          `\n\nWhich one would you like?`;
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      conv.draft = { ...conv.draft, serviceId: String(svc._id), serviceName: svc.name, duration: svc.duration || 60, price: svc.price };
      return askNextMissing(conv, log, save, true);
    }

    case "await_date": {
      const date = parseDateText(t);
      if (!date) {
        const out = "Which day works for you? You can say things like *tomorrow*, *Saturday*, *in 3 days*, or a date like *25/09*.";
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      if (date < catDateStr(0)) {
        const out = "That day has already passed 😊 Pick a day from today onwards — what suits you?";
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      if (date > catDateStr(MAX_DAYS_AHEAD)) {
        const out = `I can only book up to ${MAX_DAYS_AHEAD} days ahead. Please pick a day within the next month.`;
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      conv.draft.date = date;
      return askNextMissing(conv, log, save, true);
    }

    case "await_time": {
      const time = parseTimeText(t);
      const { duration } = conv.draft;
      if (!time) {
        const free = await firstFreeSlots(conv.draft.date, duration);
        const out =
          `What time suits you? We open ${prettyTime(`${String(OPENING_HOUR).padStart(2, "0")}:00`)} and last appointments finish by ${prettyTime(`${String(CLOSING_HOUR).padStart(2, "0")}:00`)}.\n\n` +
          `Free slots on ${prettyDate(conv.draft.date)}: ${free.map((s) => prettyTime(s)).join(", ")}`;
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      const slots = await computeSlots(conv.draft.date, duration);
      const slot = slots.find((s) => s.time === time);
      if (time < `${String(OPENING_HOUR).padStart(2, "0")}:00` || time > `${String(CLOSING_HOUR).padStart(2, "0")}:00`) {
        const free = await firstFreeSlots(conv.draft.date, duration);
        const out = `That's outside our hours 😊 We're open 7 AM – 8 PM. Free slots that day: ${free.map((s) => prettyTime(s)).join(", ")}`;
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      if (!slot || !slot.available) {
        const free = slots.filter((s) => s.available).map((s) => s.time);
        const out = free.length
          ? `${prettyTime(time)} is already taken for ${prettyDate(conv.draft.date)} 😔\n\nNearest free slots: ${free.slice(0, 8).map((s) => prettyTime(s)).join(", ")}\n\nWhich one works?`
          : `That day is fully booked, I'm afraid. Want to try another day?`;
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      conv.draft.time = time;
      return askNextMissing(conv, log, save, true);
    }

    case "await_name": {
      const nm = t.replace(/^(my name is|i am|i'm|it's|its|this is)\s*/i, "").trim();
      if (nm.length < 2) {
        const out = "Sorry, I didn't catch your name — could you type it for me?";
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      conv.name = nm.slice(0, 60);
      conv.draft.customerName = conv.name;
      return askNextMissing(conv, log, save, true);
    }

    case "await_time_confirm": {
      const yes = /\b(yes|yep|yeah|sure|ok|okay|confirm|correct|please do|go ahead|do it)\b/.test(lower);
      const no = /\b(no|nope|change|wrong|different|another|not really)\b/.test(lower);
      if (yes) {
        const b = await createBooking(conv);
        if (b.error) {
          const out = `Oh no — that slot was just snapped up by someone else 😔 Let me find another: ${b.alternatives}`;
          conv.state = "await_time";
          log(out);
          await save();
          return { reply: out, conversation: conv };
        }
        conv.state = "idle";
        conv.draft = resetDraft();
        conv.lastBookingRef = b.booking.reference;
        const out = confirmationMessage(b.booking);
        log(out);
        await save();
        return { reply: out, conversation: conv, booking: b.booking };
      }
      if (no) {
        conv.state = "await_time";
        const free = await firstFreeSlots(conv.draft.date, conv.draft.duration);
        const out = `Sure — here are the free times on ${prettyDate(conv.draft.date)}: ${free.map((s) => prettyTime(s)).join(", ")}\n\nWhich would you like?`;
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      // otherwise re-ask
      return askNextMissing(conv, log, save, false);
    }

    default: {
      // idle: maybe they're rescheduling / cancelling an existing booking, or chit-chat
      if (/\breschedul|move|change.*time|change.*date\b/.test(lower)) {
        const booking = conv.lastBookingRef ? await Booking.findOne({ reference: conv.lastBookingRef }) : null;
        conv.state = "await_date";
        const out = booking
          ? `Sure — let's move *${booking.reference}* (${booking.serviceName}). Which new day would you like?`
          : `Sure, I can reschedule. First — what's your booking reference? (e.g. OBS-5RXARB) Or if you'd like a brand-new appointment, just tell me the service and day.`;
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      if (/\bcancel my|cancel booking|cancel appointment\b/.test(lower)) {
        const booking = conv.lastBookingRef ? await Booking.findOne({ reference: conv.lastBookingRef }) : null;
        if (booking && booking.status !== "cancelled") {
          booking.status = "cancelled";
          await booking.save();
          const out = `Done — *${booking.reference}* (${booking.serviceName} on ${prettyDate(booking.date)}) is cancelled. We hope to see you another time 💛 Want to book a new day?`;
          log(out);
          conv.state = "idle";
          await save();
          return { reply: out, conversation: conv };
        }
        const out = "Sure — send me the booking reference (e.g. OBS-5RXARB) of the appointment you'd like to cancel.";
        log(out);
        await save();
        return { reply: out, conversation: conv };
      }
      const svc = await findService(t);
      if (svc) {
        conv.draft = { ...conv.draft, serviceId: String(svc._id), serviceName: svc.name, duration: svc.duration || 60, price: svc.price };
        const date = parseDateText(t);
        if (date) conv.draft.date = date;
        const time = parseTimeText(t);
        if (time) conv.draft.time = time;
        return askNextMissing(conv, log, save, true);
      }
      const out = GREETING;
      log(out);
      conv.state = "menu";
      await save();
      return { reply: out, conversation: conv };
    }
  }
}

// Moves the flow forward by asking for the next missing piece of the booking
async function askNextMissing(conv, log, save, advancing) {
  const d = conv.draft;

  if (!d.serviceId) {
    conv.state = "await_service";
    const services = await Service.find({ active: true }).sort({ order: 1 }).limit(12);
    const out =
      `Lovely choice — let's get you booked! ✨ Which service would you like?\n` +
      services.map((s) => `• ${s.name} (K${s.price.toLocaleString()})`).join("\n") +
      `\n\n(Or describe it — e.g. "knotless, bum length")`;
    log(out);
    await save();
    return { reply: out, conversation: conv };
  }

  if (!d.date) {
    conv.state = "await_date";
    const out = `*${d.serviceName}* it is — K${Number(d.price || 0).toLocaleString()}, about ${d.duration >= 60 ? `${Math.floor(d.duration / 60)}h${d.duration % 60 ? ` ${d.duration % 60}m` : ""}` : `${d.duration}m`}.\n\nWhich day would you like it? (e.g. *tomorrow*, *Saturday*, *25/09*)`;
    log(out);
    await save();
    return { reply: out, conversation: conv };
  }

  if (!d.time) {
    const slots = await computeSlots(d.date, d.duration);
    const free = slots.filter((s) => s.available).map((s) => s.time);
    if (!free.length) {
      conv.state = "await_date";
      const out = `${prettyDate(d.date)} is fully booked for *${d.serviceName}* 😔 Could you pick another day?`;
      log(out);
      await save();
      return { reply: out, conversation: conv };
    }
    conv.state = "await_time";
    const out =
      `Here are the open times for ${prettyDate(d.date)}:\n` +
      free.map((s) => `• ${prettyTime(s)}`).join("\n") +
      `\n\nWhich time works best for you?`;
    log(out);
    await save();
    return { reply: out, conversation: conv };
  }

  // All details present except name? Ask for it in its own state
  if (!d.customerName && !conv.name) {
    conv.state = "await_name";
    const out = "Almost there! Please confirm your *full name* for the booking.";
    log(out);
    await save();
    return { reply: out, conversation: conv };
  }

  // Everything present → confirm
  if (!d.customerName) d.customerName = conv.name;
  conv.state = "await_time_confirm";
  const out =
    `Please confirm your appointment:\n\n${summarize(d)}\nFor: *${d.customerName}*\n\nShall I lock this in? (yes / no)`;
  log(out);
  await save();
  return { reply: out, conversation: conv };
}

// Smallest first-free slot finder, used in error-recovery messages
async function firstFreeSlots(date, duration) {
  const slots = await computeSlots(date, duration);
  return slots.filter((s) => s.available).map((s) => s.time).slice(0, 10);
}

async function createBooking(conv) {
  const d = conv.draft;
  try {
    const svc = await Service.findById(d.serviceId);
    if (!svc || !svc.active) return { error: true, alternatives: "which service would you like?" };

    const clash = await Booking.findOne({
      date: d.date,
      time: d.time,
      status: { $ne: "cancelled" },
    });
    if (clash) {
      const free = await firstFreeSlots(d.date, d.duration);
      return { error: true, alternatives: free.map((s) => prettyTime(s)).join(", ") || "no free slots that day — try another date" };
    }

    let reference = generateReference();
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await Booking.findOne({ reference });
      if (!exists) break;
      reference = generateReference();
    }

    const booking = await Booking.create({
      reference,
      customerName: d.customerName || conv.name || `WhatsApp ${conv.phone.slice(-4)}`,
      phone: conv.phone,
      service: svc._id,
      serviceName: svc.name,
      price: svc.price,
      priceMax: svc.priceMax,
      duration: svc.duration || 60,
      date: d.date,
      time: d.time,
      notes: "Booked via WhatsApp AI assistant",
      agentSource: true,
    });
    return { booking };
  } catch (err) {
    return { error: true, alternatives: "something went wrong on our side — please try again" };
  }
}

export function confirmationMessage(b) {
  return (
    `🎉 *You're booked, ${b.customerName.split(" ")[0]}!*\n\n` +
    `Reference: *${b.reference}*\n` +
    `${summarize(b)}\n\n` +
    `We'll confirm shortly and send you a reminder before your appointment. Save your reference to track or make changes.\n\n` +
    `Track anytime: https://opuluxe-iota.vercel.app/track`
  );
}

export { REF_PREFIX };
