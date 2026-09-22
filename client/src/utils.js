export const money = (n) => `K${Number(n || 0).toLocaleString()}`;

export const priceLabel = (s) =>
  s?.priceMax && s.priceMax > s.price
    ? `${money(s.price)} – ${money(s.priceMax)}`
    : money(s?.price);

export const prettyDate = (d) => {
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const prettyTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
};

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export const durationLabel = (mins) => {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

export const statusStyles = {
  pending: "bg-amber-400/15 text-amber-300 border border-amber-400/25",
  confirmed: "bg-sky-400/15 text-sky-300 border border-sky-400/25",
  completed: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/25",
  cancelled: "bg-rose-400/15 text-rose-300 border border-rose-400/25",
};

export const paymentStyles = {
  unpaid: "bg-white/5 text-white/50 border border-white/10",
  deposit: "bg-purple-400/15 text-purple-300 border border-purple-400/25",
  paid: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/25",
};
