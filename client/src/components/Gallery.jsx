import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// 12 studio photos with service labels for filtering
const PHOTOS = [
  { src: "/gallery/img_8158.jpg", tag: "Braids", label: "Knotless Braids" },
  { src: "/gallery/img_8159.jpg", tag: "Twists", label: "Spring Twists" },
  { src: "/gallery/img_8160.jpg", tag: "Cornrows", label: "Cornrow Curls" },
  { src: "/gallery/img_8161.jpg", tag: "Cornrows", label: "Fulani Cornrows" },
  { src: "/gallery/img_8162.jpg", tag: "Cornrows", label: "Heart Cornrows" },
  { src: "/gallery/img_8163.jpg", tag: "Twists", label: "Passion Twists" },
  { src: "/gallery/img_8164.jpg", tag: "Cornrows", label: "Braid & Curl" },
  { src: "/gallery/img_8165.jpg", tag: "Braids", label: "Boho Knotless" },
  { src: "/gallery/img_8166.jpg", tag: "Braids", label: "Knotless Bun" },
  { src: "/gallery/img_8167.jpg", tag: "Twists", label: "Senegalese Twists" },
  { src: "/gallery/img_8168.jpg", tag: "Braids", label: "Jumbo Knotless" },
  { src: "/gallery/img_8169.jpg", tag: "Braids", label: "Box Braids" },
];

const FILTERS = ["All", "Braids", "Twists", "Cornrows"];

export default function Gallery() {
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState(null); // index into visible list

  const visible = useMemo(
    () => (filter === "All" ? PHOTOS : PHOTOS.filter((p) => p.tag === filter)),
    [filter]
  );

  // Close lightbox with Escape, navigate with arrows
  useEffect(() => {
    if (lightbox == null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i + 1) % visible.length);
      if (e.key === "ArrowLeft") setLightbox((i) => (i - 1 + visible.length) % visible.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, visible.length]);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">Portfolio</p>
            <h2 className="section-title mt-3">Our Work Speaks</h2>
            <p className="mt-3 max-w-xl text-sm text-white/45">
              Real styles, real clients — every look crafted at OPULUXE.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-xs transition ${
                  filter === f
                    ? "bg-gold-400 font-medium text-ink"
                    : "border border-white/12 text-white/55 hover:border-gold-400/50 hover:text-gold-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Mosaic */}
        <div className="mt-12 columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
          {visible.map((p, i) => (
            <button
              key={p.src}
              onClick={() => setLightbox(i)}
              className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 transition hover:border-gold-400/50"
            >
              <img
                src={p.src}
                alt={p.label}
                loading="lazy"
                className="w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 text-left opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-sm font-medium text-white">{p.label}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300">{p.tag}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/book" className="btn-gold">
            Book Your Look
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox != null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-5 top-5 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:text-white"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            ✕
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-ink/50 px-3 py-2 text-xl text-white/70 hover:text-gold-300"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i - 1 + visible.length) % visible.length);
            }}
            aria-label="Previous"
          >
            ‹
          </button>
          <figure className="max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={visible[lightbox].src}
              alt={visible[lightbox].label}
              className="max-h-[78vh] w-auto rounded-2xl border border-white/10 object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/70">
              {visible[lightbox].label}
              <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-gold-300">
                {visible[lightbox].tag}
              </span>
            </figcaption>
          </figure>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-ink/50 px-3 py-2 text-xl text-white/70 hover:text-gold-300"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i + 1) % visible.length);
            }}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
