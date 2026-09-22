import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HeroSlider from "../components/HeroSlider";
import Gallery from "../components/Gallery";
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

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 max-lg:px-6 max-lg:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-20">
          <div className="animate-fadeUp max-lg:pb-2 lg:pl-6">
            <span className="pill border border-gold-400/30 bg-gold-400/10 text-gold-300">
              Lusaka&apos;s Home of Crown Care
            </span>

            <h1 className="mt-5 font-display text-3xl leading-[1.1] text-white sm:text-5xl sm:leading-[1.08] lg:text-6xl">
              OPULUXE
              <span className="block text-gold-300">BEAUTY STUDIO</span>
            </h1>

            <p className="mt-4 text-base tracking-[0.12em] text-white/55 sm:text-lg">
              YOUR BEAUTY ELEVATED
            </p>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/50">
              From flawless knotless braids to silky bone straight and bouncy Spanish curls — we
              transform your hair with precision, patience and premium care. Book your seat and let
              us elevate your look.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/book" className="btn-gold">
                Book an Appointment
              </Link>
              <a href="#services" className="btn-ghost">
                View Price List
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 sm:gap-10">
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

          {/* HERO SLIDESHOW — framed, slightly inset on desktop; fixed height on mobile */}
          <div className="relative mx-auto w-full max-w-md animate-fadeUp sm:max-w-lg lg:h-[600px] lg:max-w-none">
            <HeroSlider className="h-[340px] rounded-3xl border border-white/10 sm:h-[440px] lg:h-full" />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-24 border-y border-white/10 bg-plum/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">Why Opuluxe</p>
              <h2 className="section-title mt-3">Where your crown gets the royal treatment</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                We are a boutique beauty studio dedicated to protective styling and healthy hair.
                Every appointment is personal — we listen, advise and deliver a finish that turns
                heads.
              </p>

              <div className="mt-12 grid gap-6 sm:grid-cols-2">
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

            {/* Side photo collage */}
            <div className="relative mx-auto grid w-full max-w-sm grid-cols-2 gap-4">
              <img
                src="/gallery/img_8159.jpg"
                alt="Spring twists styled at OPULUXE"
                loading="lazy"
                className="mt-10 aspect-[3/4] w-full rounded-2xl border border-white/10 object-cover"
              />
              <img
                src="/gallery/img_8163.jpg"
                alt="Passion twists at OPULUXE"
                loading="lazy"
                className="aspect-[3/4] w-full rounded-2xl border border-white/10 object-cover"
              />
              <img
                src="/gallery/img_8161.jpg"
                alt="Fulani cornrows at OPULUXE"
                loading="lazy"
                className="col-span-2 aspect-[16/10] w-full rounded-2xl border border-white/10 object-cover"
              />
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gold-400/5 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <Gallery />

      {/* SERVICES / PRICE LIST */}
      <section id="services" className="scroll-mt-24 border-t border-white/10 bg-plum/20 py-20">
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

      {/* CTA with photo strip */}
      <section className="border-y border-white/10 bg-gradient-to-r from-gold-500/10 via-transparent to-fuchsia-500/10 py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-display text-3xl text-white sm:text-4xl">
            Ready to elevate your look?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/50">
            Pick your style, choose your slot, and we&apos;ll handle the rest. Your seat is waiting.
          </p>

          {/* Floating photo strip */}
          <div className="mx-auto mt-12 flex max-w-3xl justify-center gap-4">
            {["/gallery/img_8166.jpg", "/gallery/img_8160.jpg", "/gallery/img_8168.jpg"].map(
              (src, i) => (
                <img
                  key={src}
                  src={src}
                  alt="OPULUXE styles"
                  loading="lazy"
                  className={`w-24 rounded-2xl border border-white/10 object-cover shadow-soft transition hover:-translate-y-2 hover:border-gold-400/50 sm:w-32 ${
                    i % 2 ? "mt-6" : ""
                  }`}
                />
              )
            )}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
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
