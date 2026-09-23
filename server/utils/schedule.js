import Booking from "../models/Booking.js";

// Studio opening hours (24h). Last slot starts so it ends by CLOSING_HOUR.
export const OPENING_HOUR = 7; // 07:00
export const CLOSING_HOUR = 20; // 20:00 (Mon–Sat 07:00–20:00)
export const SLOT_STEP_MIN = 30;

export const timeToMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const minToTime = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

// Returns [{ time: "07:30", available: true }, ...] honouring each booking's duration
export async function computeSlots(date, duration) {
  const need = Math.max(15, Number(duration) || 60);
  const dayStart = OPENING_HOUR * 60;
  const dayEnd = CLOSING_HOUR * 60;

  const candidates = [];
  for (let t = dayStart; t + need <= dayEnd; t += SLOT_STEP_MIN) {
    candidates.push(minToTime(t));
  }

  const booked = await Booking.find({ date, status: { $ne: "cancelled" } }).select(
    "time duration -_id"
  );
  const blocks = booked.map((b) => {
    const start = timeToMin(b.time);
    return [start, start + (Number(b.duration) || 60)];
  });

  return candidates.map((time) => {
    const start = timeToMin(time);
    const end = start + need;
    const available = !blocks.some(([bs, be]) => overlaps(start, end, bs, be));
    return { time, available };
  });
}
