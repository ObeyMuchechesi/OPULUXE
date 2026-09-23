import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api";
import {
  money,
  prettyDate,
  prettyTime,
  statusStyles,
  paymentStyles,
  todayStr,
  durationLabel,
} from "../../utils";
import useSEO from "../../useSEO";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

/* ---------- KPI helpers ---------- */
const pctChip = (v) => ({
  text: `${v >= 0 ? "▲" : "▼"} ${Math.abs(v)}%`,
  cls:
    v > 0
      ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/25"
      : v < 0
      ? "text-rose-300 bg-rose-400/10 border-rose-400/25"
      : "text-white/40 bg-white/5 border-white/10",
});

const SPARK = { w: 120, h: 36 };

function Sparkline({ series, pick }) {
  const vals = series.map(pick);
  const max = Math.max(...vals, 1);
  const pts = vals
    .map((v, i) => `${(i / Math.max(vals.length - 1, 1)) * SPARK.w},${SPARK.h - (v / max) * (SPARK.h - 4) - 2}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${SPARK.w} ${SPARK.h}`} className="h-9 w-[120px]" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="rgb(252 211 77 / 0.9)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (ym) => {
  const [, m] = ym.split("-").map(Number);
  return MONTH_SHORT[m - 1] || ym;
};

/* ---------- AI Assistant ---------- */
const SUGGESTIONS = [
  "How is revenue this month?",
  "What's pending?",
  "Who's booked today?",
  "Free slots tomorrow?",
  "How many repeat customers?",
  "Give me a summary",
];

function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm your studio assistant 🤖 Ask me anything about your live data — revenue, bookings, customers, availability." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const ask = async (question) => {
    const q = (question ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "you", text: q }]);
    setBusy(true);
    try {
      const { data } = await api.post("/analytics/assistant", { question: q });
      setMessages((m) => [...m, { role: "ai", text: data.answer }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Sorry — something went wrong fetching that. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/40 bg-plum shadow-soft transition hover:border-gold-300 hover:scale-105"
        title="Ask the AI assistant"
      >
        {open ? <span className="text-lg text-white/70">✕</span> : <span className="text-xl">🤖</span>}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex max-h-[70vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-gold-400/25 bg-plum shadow-soft">
          <div className="border-b border-white/10 bg-gold-400/[0.07] px-4 py-3">
            <p className="font-display text-sm tracking-[0.15em] text-gold-300">STUDIO ASSISTANT</p>
            <p className="text-[10px] text-white/40">Answers from your live booking data</p>
          </div>

          <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === "you"
                    ? "ml-auto bg-gold-400/15 text-gold-100"
                    : "bg-white/[0.05] text-white/80"
                }`}
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="flex gap-1 px-2">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-300/70" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-300/70 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-300/70 [animation-delay:240ms]" />
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-3 pb-3 pt-2">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="shrink-0 rounded-full border border-white/12 px-3 py-1.5 text-[10px] text-white/55 transition hover:border-gold-400/50 hover:text-gold-200"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input !py-2.5 text-xs"
                placeholder="Ask about your business…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
              />
              <button onClick={() => ask()} disabled={busy} className="btn-gold !px-4 !py-2.5 text-xs">
                Ask
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Page ---------- */
export default function Dashboard() {
  useSEO({ title: "Dashboard | OPULUXE Admin", noindex: true });
  const [stats, setStats] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ search: "", status: "all", date: "" });
  const [selected, setSelected] = useState(null);

  const loadStats = useCallback(() => {
    api.get("/bookings/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/analytics/kpis").then((r) => setKpis(r.data)).catch(() => {});
  }, []);

  const loadBookings = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status !== "all") params.status = filters.status;
    if (filters.date) params.date = filters.date;

    api
      .get("/bookings", { params })
      .then((r) => setBookings(r.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const t = setTimeout(loadBookings, 250);
    return () => clearTimeout(t);
  }, [loadBookings]);

  const refresh = () => {
    loadStats();
    loadBookings();
  };

  const changeStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/bookings/${id}/status`, { status });
      setBookings((prev) => prev.map((b) => (b._id === id ? data : b)));
      if (selected?._id === id) setSelected(data);
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || "Could not update status");
    }
  };

  const changePayment = async (id, paymentStatus) => {
    try {
      const { data } = await api.patch(`/bookings/${id}/payment`, { paymentStatus });
      setBookings((prev) => prev.map((b) => (b._id === id ? data : b)));
      if (selected?._id === id) setSelected(data);
    } catch (err) {
      alert(err.response?.data?.message || "Could not update payment");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this booking permanently?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      setBookings((prev) => prev.filter((b) => b._id !== id));
      setSelected(null);
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete booking");
    }
  };

  const revDelta = kpis ? pctChip(kpis.revenueDeltaPct) : null;
  const bkDelta = kpis ? pctChip(kpis.bookingsDeltaPct) : null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">Overview</p>
          <h1 className="mt-2 font-display text-3xl text-white">Bookings</h1>
        </div>
        <button onClick={refresh} className="btn-ghost !py-2.5 text-xs">
          Refresh
        </button>
      </div>

      {/* Core stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total" value={stats?.total ?? "—"} />
        <StatCard label="Today" value={stats?.today ?? "—"} accent />
        <StatCard label="Pending" value={stats?.pending ?? "—"} />
        <StatCard label="Confirmed" value={stats?.confirmed ?? "—"} />
        <StatCard label="Completed" value={stats?.completed ?? "—"} />
        <StatCard label="Revenue" value={stats ? money(stats.revenue) : "—"} accent />
      </div>

      {/* KPI band */}
      {kpis && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Revenue · this month</p>
                <p className="mt-2 font-display text-3xl text-gold-300">{money(kpis.revenueThisMonth)}</p>
              </div>
              {revDelta && (
                <span className={`rounded-full border px-2.5 py-1 text-[10px] ${revDelta.cls}`}>{revDelta.text}</span>
              )}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-[11px] text-white/40">
                Last month {money(kpis.revenueLastMonth)} · avg ticket {money(kpis.avgTicket)}
              </p>
              <Sparkline series={kpis.revenueSeries} pick={(s) => s.revenue} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Bookings · this month</p>
                <p className="mt-2 font-display text-3xl text-white">{kpis.bookingsThisMonth}</p>
              </div>
              {bkDelta && (
                <span className={`rounded-full border px-2.5 py-1 text-[10px] ${bkDelta.cls}`}>{bkDelta.text}</span>
              )}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-[11px] text-white/40">
                {kpis.bookingsLastMonth} last month · completion {kpis.completionRate}%
              </p>
              <Sparkline series={kpis.revenueSeries} pick={(s) => s.bookings} />
            </div>
          </div>

          <div className="card p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Customers</p>
            <div className="mt-2 flex items-baseline gap-3">
              <p className="font-display text-3xl text-white">{kpis.totalCustomers}</p>
              <p className="text-[11px] text-gold-300/80">
                {kpis.repeatCustomers} repeat ({kpis.totalCustomers ? Math.round((kpis.repeatCustomers / kpis.totalCustomers) * 100) : 0}%)
              </p>
            </div>
            <p className="mt-3 text-[11px] text-white/40">
              {kpis.upcoming7} appointments in the next 7 days · {kpis.pending} pending now
            </p>
          </div>
        </div>
      )}

      {/* Top services + 6-month trend */}
      {kpis && (kpis.topServices.length > 0 || kpis.revenueSeries.some((s) => s.bookings > 0)) && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Top services (completed)</p>
            <div className="mt-4 space-y-3">
              {kpis.topServices.length === 0 && <p className="text-xs text-white/30">No completed bookings yet.</p>}
              {kpis.topServices.map((s, i) => {
                const max = kpis.topServices[0]?.count || 1;
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/75">
                        {i + 1}. {s.name}
                      </span>
                      <span className="text-white/40">
                        {s.count}× · <span className="text-gold-300/90">{money(s.revenue)}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-400/80 to-gold-300/40"
                        style={{ width: `${Math.max((s.count / max) * 100, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Last 6 months</p>
            <div className="mt-5 flex h-32 items-end gap-3">
              {kpis.revenueSeries.map((s) => {
                const max = Math.max(...kpis.revenueSeries.map((x) => x.revenue), 1);
                return (
                  <div key={s.month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-gold-500/50 to-gold-300/80 transition-all"
                        style={{ height: `${Math.max((s.revenue / max) * 100, s.revenue > 0 ? 6 : 2)}%` }}
                        title={`${monthLabel(s.month)}: ${money(s.revenue)} (${s.bookings} bookings)`}
                      />
                    </div>
                    <p className="text-[10px] text-white/35">{monthLabel(s.month)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mt-8 p-5">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
          <div>
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Name, phone, reference, service…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="all" className="bg-ink">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-ink capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={filters.date}
              onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => setFilters({ search: "", status: "all", date: todayStr() })}
              className="btn-ghost !py-3 text-xs"
            >
              Today
            </button>
            <button
              onClick={() => setFilters({ search: "", status: "all", date: "" })}
              className="btn-ghost !py-3 text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card mt-6 overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-display text-xl text-white/60">No bookings found</p>
            <p className="mt-2 text-xs text-white/30">
              Try changing your filters or wait for new appointments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.15em] text-white/35">
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">When</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b._id}
                    className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-gold-300">{b.reference}</p>
                      {b.agentSource && (
                        <span className="mt-1 inline-block rounded-full border border-purple-400/25 bg-purple-400/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-purple-300">
                          AI booking
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/85">{b.customerName}</p>
                      <p className="text-[11px] text-white/35">{b.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {b.serviceName}
                      <span className="ml-2 text-[11px] text-white/25">
                        {durationLabel(b.duration)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/75">{prettyDate(b.date)}</p>
                      <p className="text-[11px] text-gold-300/80">{prettyTime(b.time)}</p>
                    </td>
                    <td className="px-6 py-4 text-white/70">{money(b.price)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={b.status}
                        onChange={(e) => changeStatus(b._id, e.target.value)}
                        className={`pill cursor-pointer appearance-none border-0 bg-transparent pr-4 outline-none ${
                          statusStyles[b.status]
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-ink capitalize">
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelected(b)}
                          className="rounded-lg border border-white/12 px-3 py-1.5 text-[11px] text-white/60 transition hover:border-gold-400/60 hover:text-gold-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => remove(b._id)}
                          className="rounded-lg border border-rose-400/25 px-3 py-1.5 text-[11px] text-rose-300/80 transition hover:bg-rose-400/10 hover:text-rose-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-plum p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-white/35">Reference</p>
                <p className="font-display text-2xl tracking-wider text-gold-300">
                  {selected.reference}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-8 space-y-4 text-sm">
              <Detail label="Customer" value={selected.customerName} />
              <Detail label="Phone" value={selected.phone} />
              <Detail label="Email" value={selected.email || "—"} />
              <Detail label="Service" value={selected.serviceName} />
              <Detail label="Date" value={prettyDate(selected.date)} />
              <Detail label="Time" value={prettyTime(selected.time)} />
              <Detail label="Duration" value={durationLabel(selected.duration)} />
              <Detail label="Price" value={money(selected.price)} />
              <Detail
                label="Booked via"
                value={selected.agentSource ? "WhatsApp AI agent" : "Website"}
              />
              <Detail
                label="Booked on"
                value={new Date(selected.createdAt).toLocaleString("en-GB")}
              />
            </div>

            {selected.notes && (
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Notes</p>
                <p className="mt-2 text-sm text-white/70">{selected.notes}</p>
              </div>
            )}

            <div className="mt-8">
              <p className="label">Booking status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(selected._id, s)}
                    className={`rounded-full px-4 py-2 text-xs capitalize transition ${
                      selected.status === s
                        ? statusStyles[s]
                        : "border border-white/12 text-white/50 hover:text-white/80"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="label">Payment</p>
              <div className="flex flex-wrap gap-2">
                {["unpaid", "deposit", "paid"].map((p) => (
                  <button
                    key={p}
                    onClick={() => changePayment(selected._id, p)}
                    className={`rounded-full px-4 py-2 text-xs capitalize transition ${
                      selected.paymentStatus === p
                        ? paymentStyles[p]
                        : "border border-white/12 text-white/50 hover:text-white/80"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <a
                href={`https://wa.me/${selected.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hello ${selected.customerName.split(" ")[0]}, this is OPULUXE Beauty Studio regarding your booking ${selected.reference} (${selected.serviceName} on ${prettyDate(selected.date)} at ${prettyTime(selected.time)}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost flex-1 !py-3 text-xs"
              >
                WhatsApp Customer
              </a>
              <button
                onClick={() => remove(selected._id)}
                className="flex-1 rounded-full border border-rose-400/30 py-3 text-xs text-rose-300 transition hover:bg-rose-400/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Assistant />
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`card p-5 ${accent ? "border-gold-400/25 bg-gold-400/[0.06]" : ""}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p
        className={`mt-3 font-display text-2xl ${
          accent ? "text-gold-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0">
      <span className="text-[11px] uppercase tracking-[0.15em] text-white/35">{label}</span>
      <span className="text-right text-white/80">{value}</span>
    </div>
  );
}
