import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { prettyDate, prettyTime, priceLabel, statusStyles } from "../utils";
import { waLink } from "../whatsapp";
import useSEO from "../useSEO";

export default function Track() {
  useSEO({
    title: "Track Your Booking | OPULUXE BEAUTY STUDIO",
    description:
      "Check the status of your OPULUXE appointment with your booking reference — requested, confirmed or completed.",
    path: "/track",
  });

  const [reference, setReference] = useState("");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    setError("");
    setBooking(null);
    if (!reference.trim()) return setError("Please enter your booking reference.");

    setLoading(true);
    try {
      const { data } = await api.get(`/bookings/track/${reference.trim().toUpperCase()}`);
      setBooking(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not find that booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 py-20">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">Self Service</p>
        <h1 className="mt-3 font-display text-3xl text-white sm:text-4xl">Track Your Booking</h1>
        <p className="mt-3 text-sm text-white/45">
          Enter the reference you received when you booked (e.g. OBS-A1B2C3).
        </p>

        <form onSubmit={search} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            className="input flex-1 uppercase tracking-widest"
            placeholder="OBS-XXXXXX"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <button className="btn-gold shrink-0" disabled={loading}>
            {loading ? "Searching…" : "Track"}
          </button>
        </form>

        {error && (
          <p className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">
            {error}
          </p>
        )}

        {booking && (
          <div className="card mt-8 animate-fadeUp p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-white/35">Reference</p>
                <p className="font-display text-2xl tracking-wider text-gold-300">
                  {booking.reference}
                </p>
              </div>
              <span className={`pill ${statusStyles[booking.status]}`}>{booking.status}</span>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <Line label="Service" value={booking.serviceName} />
              <Line label="Date" value={prettyDate(booking.date)} />
              <Line label="Time" value={prettyTime(booking.time)} />
              <Line
                label="Price"
                value={priceLabel({ price: booking.price, priceMax: booking.priceMax })}
              />
            </div>

            <a
              href={waLink(
                `Hello OPULUXE! I'd like to ask about my booking ${booking.reference} (${booking.serviceName} on ${booking.date}).`
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-3 text-sm text-[#4be382] transition hover:bg-[#25D366]/20"
            >
              Ask about this booking on WhatsApp
            </a>

            <p className="mt-4 text-xs text-white/35">
              Need to change something? Call us on +260 97 000 0000.
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/book" className="btn-ghost">
            Make a New Booking
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
      <span className="text-xs uppercase tracking-[0.15em] text-white/35">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}
