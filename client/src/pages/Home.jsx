import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { priceLabel, durationLabel } from "../utils";

const HIGHLIGHTS = [
  { title: "Expert Stylists", text: "Years of hands-on braiding & hair care experience." },
  { title: "Premium Products", text: "Only quality hair, tools and treatments touch your crown." },
  { title: "Easy Booking", text: "Reserve your slot online in under a minute — no calls needed." },
  { title: "Relaxing Space", text: "A calm, clean and welcoming studio built for you." },
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/services")
      .then((r) => setServices(r.data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    return services.reduce((acc, s) => {
      const key = s.category || "Services";
      (acc[key] = acc[key] || []).push(s);
      return acc;
    }, {});
  }, [services]);

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-gold-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[140px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 md:py-28 lg:grid-cols-2">
          <div className="animate-fadeUp">
            <span className="pill border border-gold-400/30 bg-gold-400/10 text-gold-300">
              Lusaka&apos;s Home of Crown Care
            </span>

            <h1 className="mt-6 font-display text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl">
              OPULUXE
              <span className="block text-gold-300">BEAUTY STUDIO</span>
            </h1>

            <p className="mt-5 text-lg tracking-[0.12em] text-white/55">
              YOUR BEAUTY ELEVATED
            </p>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/50">
              From flawless knotless braids to silky bone straight and bouncy Spanish curls — we
              transform your hair with precision, patience and premium care. Book your seat and let
              us elevate your look.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/book" className="btn-gold">
                Book an Appointment
              </Link>
              <a href="#services" className="btn-ghost">
                View Price List
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-10">
              <div>
                <p className="font-display text-3xl text-gold-300">23+</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Services</p>
              </div>
              <div>
                <p className="font-display text-3xl text-gold-300">7AM–8PM</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Open Daily</p>
              </div>
              <div>
                <p className="font-display text-3xl text-gold-300">100%</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Satisfaction</p>
              </div>
            </div>
          </div>

          <div className="relative animate-fadeUp">
            <div className="card overflow-hidden p-8 shadow-soft">
              <div className="rounded-2xl bg-gradient-to-br from-gold-400/20 via-fuchsia-500/10 to-transparent p-8">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold-300/80">
                  Signature Looks
                </p>
                <ul className="mt-6 space-y-4 text-sm">
                  {[
                    ["Bone Straight", "K1,000"],
                    ["Spanish Curl", "K850"],
                    ["Knotless Small Bum Length", "K750"],
                    ["Goddess Braids Bum Length", "K650"],
                    ["Passion Twist Selfie", "K500"],
                  ].map(([name, price]) => (
                    <li
                      key={name}
                      className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0"
                    >
                      <span className="text-white/75">{name}</span>
                      <span className="font-medium text-gold-300">{price}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/book"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white/10 py-3 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:bg-gold-400 hover:text-ink"
                >
                  Reserve Your Seat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-24 border-y border-white/10 bg-plum/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">Why Opuluxe</p>
            <h2 className="section-title mt-3">Where your crown gets the royal treatment</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              We are a boutique beauty studio dedicated to protective styling and healthy hair.
              Every appointment is personal — we listen, advise and deliver a finish that turns
              heads.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h, i) => (
              <div key={h.title} className="card p-6 transition hover:border-gold-400/40">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gold-400/15 font-display text-gold-300">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-base font-medium text-white">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES / PRICE LIST */}
      <section id="services" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">Price List</p>
              <h2 className="section-title mt-3">Our Services</h2>
              <p className="mt-3 max-w-xl text-sm text-white/45">
                Transparent pricing. No hidden costs. Prices may vary slightly with hair length and
                size.
              </p>
            </div>
            <Link to="/book" className="btn-gold shrink-0">
              Book a Service
            </Link>
          </div>

          {loading ? (
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card h-40 animate-pulse bg-white/[0.02]" />
              ))}
            </div>
          ) : (
            <div className="mt-14 space-y-14">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="mb-6 flex items-center gap-4">
                    <h3 className="font-display text-xl text-gold-200">{category}</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-gold-400/40 to-transparent" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((s) => (
                      <div
                        key={s._id}
                        className="card group flex flex-col justify-between p-6 transition hover:border-gold-400/40 hover:bg-white/[0.05]"
                      >
                        <div>
                          <h4 className="text-base font-medium text-white group-hover:text-gold-200">
                            {s.name}
                          </h4>
                          {s.description ? (
                            <p className="mt-2 text-xs leading-relaxed text-white/40">
                              {s.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-6 flex items-end justify-between">
                          <div>
                            <p className="font-display text-2xl text-gold-300">
                              {priceLabel(s)}
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/30">
                              ≈ {durationLabel(s.duration)}
                            </p>
                          </div>
                          <Link
                            to={`/book?service=${s._id}`}
                            className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:border-gold-400 hover:text-gold-300"
                          >
                            Book
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-white/10 bg-gradient-to-r from-gold-500/10 via-transparent to-fuchsia-500/10 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl text-white sm:text-4xl">
            Ready to elevate your look?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/50">
            Pick your style, choose your slot, and we&apos;ll handle the rest. Your seat is waiting.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/book" className="btn-gold">
              Book Now
            </Link>
            <Link to="/track" className="btn-ghost">
              Track My Booking
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
