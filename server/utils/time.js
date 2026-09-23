export const pad2 = (n) => String(n).padStart(2, "0");

// Lusaka is UTC+2 year-round (no DST)
export const CAT_OFFSET_MS = 2 * 60 * 60 * 1000;
export const catNow = () => new Date(Date.now() + CAT_OFFSET_MS);

// Today's date in Lusaka as YYYY-MM-DD, optionally offset by N days
export const catDateStr = (offsetDays = 0) => {
  const d = new Date(Date.now() + CAT_OFFSET_MS + offsetDays * 86400000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "2026-09-22" → "Tue, 22 Sep 2026"
export const prettyDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAY_SHORT[dt.getUTCDay()]}, ${d} ${MONTHS_SHORT[m - 1]} ${y}`;
};

// "19:30" → "7:30 PM"
export const prettyTime = (t24) => {
  if (!t24 || !/^\d{2}:\d{2}$/.test(t24)) return "";
  const [h, m] = t24.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad2(m)} ${ap}`;
};
