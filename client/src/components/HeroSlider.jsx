import { useCallback, useEffect, useRef, useState } from "react";

const IMAGES = Array.from({ length: 12 }, (_, i) => {
  const n = 8158 + i;
  return {
    src: `/gallery/img_${n}.jpg`,
    hero: `/gallery/img_${n}-hero.jpg`,
    thumb: `/gallery/img_${n}-thumb.jpg`,
    alt: `OPULUXE braids portfolio ${i + 1}`,
  };
});

const DURATION = 5000;

export default function HeroSlider({ className = "" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);

  const go = useCallback((i) => setIndex((i + IMAGES.length) % IMAGES.length), []);
  const next = useCallback(() => setIndex((i) => (i + 1) % IMAGES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + IMAGES.length) % IMAGES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, DURATION);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/10 shadow-soft ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        touchStart.current = null;
        setPaused(false);
      }}
    >
      {/* Slides */}
      <div className="relative aspect-[4/5] w-full sm:aspect-[3/3.4]">
        {IMAGES.map((img, i) => (
          <img
            key={img.src}
            src={i === 0 ? img.hero : img.src}
            srcSet={i === 0 ? `${img.thumb} 400w, ${img.src} 800w, ${img.hero} 1400w` : undefined}
            sizes="(max-width: 640px) 90vw, 560px"
            alt={img.alt}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            draggable="false"
          />
        ))}

        {/* Gold gradient veil */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

        {/* Arrows */}
        <button
          onClick={prev}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-ink/50 px-3 py-2 text-white/70 opacity-0 backdrop-blur transition hover:border-gold-400/60 hover:text-gold-300 focus:opacity-100 group-hover:opacity-100"
        >
          ‹
        </button>
        <button
          onClick={next}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-ink/50 px-3 py-2 text-white/70 opacity-0 backdrop-blur transition hover:border-gold-400/60 hover:text-gold-300 focus:opacity-100 group-hover:opacity-100"
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-gold-400" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
