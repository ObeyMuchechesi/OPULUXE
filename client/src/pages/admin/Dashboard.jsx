import { useCallback, useEffect, useState } from "react";
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

export default function Dashboard() {
  useSEO({ title: "Dashboard | OPULUXE Admin", noindex: true });
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ search: "", status: "all", date: "" });
  const [selected, setSelected] = useState(null);

  const loadStats = useCallback(() => {
    api.get("/bookings/stats").then((r) => setStats(r.data)).catch(() => {});
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

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total" value={stats?.total ?? "—"} />
        <StatCard label="Today" value={stats?.today ?? "—"} accent />
        <StatCard label="Pending" value={stats?.pending ?? "—"} />
        <StatCard label="Confirmed" value={stats?.confirmed ?? "—"} />
        <StatCard label="Completed" value={stats?.completed ?? "—"} />
        <StatCard label="Revenue" value={stats ? money(stats.revenue) : "—"} accent />
      </div>

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
                    <td className="px-6 py-4 font-mono text-xs text-gold-300">{b.reference}</td>
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
                href={`tel:${selected.phone}`}
                className="btn-ghost flex-1 !py-3 text-xs"
              >
                Call Customer
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
