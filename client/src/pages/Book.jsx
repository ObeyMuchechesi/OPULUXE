import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { priceLabel, prettyDate, prettyTime, todayStr, durationLabel } from "../utils";
import { waLink, bookingMsg } from "../whatsapp";
import useSEO from "../useSEO";

export default function Book() {
  useSEO({
    title: "Book an Appointment | OPULUXE BEAUTY STUDIO",
    description:
      "Reserve your seat online — pick your service, date and time slot. Instant confirmation by reference, WhatsApp updates available.",
    path: "/book",
  });

  const [params] = useSearchParams();

  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    serviceId: params.get("service") || "",
    date: todayStr(),
    time: "",
    notes: "",
  });

  useEffect(() => {
    api
      .get("/services")
      .then((r) => setServices(r.data))
      .catch(() => setServices([]));
  }, []);

  const selected = useMemo(
    () => services.find((s) => s._id === form.serviceId),
    [services, form.serviceId]
  );

  // Load slots whenever service or date changes
  useEffect(() => {
    if (!form.date || !selected) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setForm((f) => ({ ...f, time: "" }));

    api
      .get("/bookings/slots", {
        params: { date: form.date, duration: selected.duration || 60 },
      })
      .then((r) => {
        if (!cancelled) setSlots(r.data);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, form.serviceId, selected?._id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.customerName.trim()) return setError("Please enter your full name.");
    if (!form.phone.trim()) return setError("Please enter your phone number.");
    if (!form.serviceId) return setError("Please choose a service.");
    if (!form.time) return setError("Please choose an available time slot.");

    setSubmitting(true);
    try {
      const { data } = await api.post("/bookings", form);
      setDone(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- SUCCESS SCREEN ---------- */
  if (done) {
    return (
      <div className="min-h-screen bg-ink">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="card animate-fadeUp p-8 text-center sm:p-12">
            <img
              src="/logo.png"
              alt="OPULUXE Beauty Studio logo"
              className="mx-auto h-20 w-20 rounded-full shadow-glow ring-1 ring-gold-400/40"
            />
            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-3xl">
              ✓
            </div>
            <h1 className="mt-6 font-display text-3xl text-white">Booking Confirmed!</h1>
            <p className="mt-3 text-sm text-white/50">
              Thank you, {done.customerName.split(" ")[0]}. Your appointment request has been
              received. Our team will confirm shortly.
            </p>

            <div className="mt-8 rounded-2xl border border-gold-400/25 bg-gold-400/5 p-6 text-left">
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400/80">
                Your Reference
              </p>
              <p className="mt-2 font-display text-3xl tracking-wider text-gold-300">
                {done.reference}
              </p>
              <p className="mt-2 text-xs text-white/40">
                Save this reference — use it to track your booking.
              </p>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left text-sm">
              <Row label="Service" value={done.serviceName} />
              <Row label="Date" value={prettyDate(done.date)} />
              <Row label="Time" value={prettyTime(done.time)} />
              <Row label="Duration" value={durationLabel(done.duration)} />
              <Row
                label="Price"
                value={priceLabel({ price: done.price, priceMax: done.priceMax })}
              />
              <Row label="Status" value="Pending confirmation" />
            </div>

            <a
              href={done ? waLink(bookingMsg(done)) : "#"}
              target="_blank"
              rel="noreferrer"
              className="btn-gold w-full !bg-[#25D366] !text-ink hover:!bg-[#1fb857]"
            >
              Send via WhatsApp — Get Instant Confirmation
            </a>
            <p className="mt-2 text-center text-xs text-white/35">
              Opens WhatsApp with your booking details pre-filled. Fastest way to reach the studio.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/" className="btn-ghost">
                Back to Home
              </Link>
              <Link to="/track" className="btn-gold">
                Track Booking
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ---------- BOOKING FORM ---------- */
  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">Appointments</p>
        <h1 className="mt-3 font-display text-3xl text-white sm:text-4xl">Book Your Seat</h1>
        <p className="mt-3 max-w-xl text-sm text-white/45">
          Choose your service, pick a date and an available time. We&apos;ll take it from there.
        </p>

        <form onSubmit={submit} className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-xl text-gold-200">1. Choose your service</h2>
              <div className="mt-5">
                <label className="label">Service</label>
                <select className="input" value={form.serviceId} onChange={set("serviceId")}>
                  <option value="">Select a service…</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id} className="bg-ink">
                      {s.name} — {priceLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              {selected && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gold-400/20 bg-gold-400/5 px-4 py-3 text-xs text-white/60">
                  <span className="text-gold-300">{priceLabel(selected)}</span>
                  <span className="text-white/20">•</span>
                  <span>≈ {durationLabel(selected.duration)}</span>
                  <span className="text-white/20">•</span>
                  <span>{selected.category}</span>
                </div>
              )}
            </div>

            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-xl text-gold-200">2. Pick a date & time</h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input"
                    min={todayStr()}
                    value={form.date}
                    onChange={set("date")}
                  />
                </div>
                <div>
                  <label className="label">Duration</label>
                  <div className="input flex items-center text-white/40">
                    {selected ? durationLabel(selected.duration) : "Select a service first"}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <label className="label !mb-0">Available time slots</label>
                  {selected && !loadingSlots && (
                    <span className="text-[11px] text-white/35">
                      {availableCount} slot{availableCount === 1 ? "" : "s"} available
                    </span>
                  )}
                </div>

                {!selected ? (
                  <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-white/35">
                    Select a service to see available times.
                  </p>
                ) : loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded-xl bg-white/[0.04]" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-white/35">
                    No slots for this date. Try another day.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((s) => {
                      const active = form.time === s.time;
                      return (
                        <button
                          key={s.time}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setForm((f) => ({ ...f, time: s.time }))}
                          className={`rounded-xl border px-2 py-2.5 text-xs transition ${
                            active
                              ? "border-gold-400 bg-gold-400 text-ink"
                              : s.available
                              ? "border-white/12 bg-white/[0.03] text-white/70 hover:border-gold-400/60 hover:text-gold-200"
                              : "cursor-not-allowed border-white/5 bg-white/[0.01] text-white/15 line-through"
                          }`}
                        >
                          {prettyTime(s.time)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-xl text-gold-200">3. Your details</h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Full name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Chanda Mwale"
                    value={form.customerName}
                    onChange={set("customerName")}
                  />
                </div>
                <div>
                  <label className="label">Phone number *</label>
                  <input
                    className="input"
                    placeholder="+260 97 000 0000"
                    value={form.phone}
                    onChange={set("phone")}
                  />
                </div>
                <div>
                  <label className="label">Email (optional)</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={set("email")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Notes (optional)</label>
                  <textarea
                    rows={3}
                    className="input resize-none"
                    placeholder="Hair length, size preference, allergies…"
                    value={form.notes}
                    onChange={set("notes")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — SUMMARY */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-xl text-gold-200">Booking Summary</h2>

              <div className="mt-6 space-y-4 text-sm">
                <SummaryRow label="Service" value={selected ? selected.name : "—"} />
                <SummaryRow label="Date" value={form.date ? prettyDate(form.date) : "—"} />
                <SummaryRow label="Time" value={form.time ? prettyTime(form.time) : "—"} />
                <SummaryRow
                  label="Duration"
                  value={selected ? durationLabel(selected.duration) : "—"}
                />
                <SummaryRow label="Name" value={form.customerName || "—"} />
                <SummaryRow label="Phone" value={form.phone || "—"} />
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                <span className="text-xs uppercase tracking-[0.2em] text-white/40">Total</span>
                <span className="font-display text-3xl text-gold-300">
                  {selected ? priceLabel(selected) : "—"}
                </span>
              </div>

              {error && (
                <p className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-gold mt-6 w-full">
                {submitting ? "Booking…" : "Confirm Booking"}
              </button>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-white/30">
                By booking you agree to arrive on time. Please give at least 12 hours notice for
                cancellations.
              </p>
            </div>
          </aside>
        </form>

        {/* Inspiration strip */}
        <div className="mt-16">
          <p className="text-center text-[11px] uppercase tracking-[0.3em] text-gold-400/80">
            Fresh from our chair
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {["/gallery/img_8165.jpg", "/gallery/img_8162.jpg", "/gallery/img_8167.jpg", "/gallery/img_8158.jpg"].map(
              (src, i) => (
                <img
                  key={src}
                  src={src}
                  alt="Styles by OPULUXE"
                  loading="lazy"
                  className={`h-36 w-28 rounded-2xl border border-white/10 object-cover transition hover:-translate-y-1.5 hover:border-gold-400/50 sm:h-44 sm:w-36 ${
                    i % 2 ? "sm:translate-y-4" : ""
                  }`}
                />
              )
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
      <span className="text-xs uppercase tracking-[0.15em] text-white/35">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs uppercase tracking-[0.15em] text-white/35">{label}</span>
      <span className="text-right text-sm text-white/80">{value}</span>
    </div>
  );
}
