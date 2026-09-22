import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  const hashLink = (id) => (onHome ? `#${id}` : `/#${id}`);

  const links = (
    <>
      <a href={hashLink("services")} onClick={() => setOpen(false)} className="transition hover:text-gold-300">
        Price List
      </a>
      <a href={hashLink("about")} onClick={() => setOpen(false)} className="transition hover:text-gold-300">
        About
      </a>
      <a href={hashLink("contact")} onClick={() => setOpen(false)} className="transition hover:text-gold-300">
        Contact
      </a>
      <Link to="/track" onClick={() => setOpen(false)} className="transition hover:text-gold-300">
        Track Booking
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="font-display text-lg tracking-[0.22em] text-gold-300">OPULUXE</span>
          <span className="text-[9px] tracking-[0.4em] text-white/40">BEAUTY STUDIO</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          {links}
          <Link to="/book" className="btn-gold !px-5 !py-2">
            Book Now
          </Link>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span
              className={`block h-0.5 w-5 bg-gold-300 transition ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span className={`block h-0.5 w-5 bg-gold-300 transition ${open ? "opacity-0" : ""}`} />
            <span
              className={`block h-0.5 w-5 bg-gold-300 transition ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 px-6 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm text-white/80">
            {links}
            <Link to="/book" className="btn-gold mt-2" onClick={() => setOpen(false)}>
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
