import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer id="contact" className="scroll-mt-24 border-t border-white/10 bg-plum/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl tracking-[0.15em] text-gold-300">OPULUXE</h3>
          <p className="mt-1 text-[10px] tracking-[0.4em] text-white/40">BEAUTY STUDIO</p>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">
            Your Beauty Elevated. Expert braiding, styling and hair care — crafted with precision
            and love.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-[11px] uppercase tracking-[0.22em] text-white/40">Visit Us</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li>Plot 12, Great East Road</li>
            <li>Lusaka, Zambia</li>
            <li>Mon – Sat · 07:00 – 20:00</li>
            <li>Sunday · By appointment</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-[11px] uppercase tracking-[0.22em] text-white/40">Reach Us</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li>
              <a href="tel:+260970000000" className="transition hover:text-gold-300">
                +260 97 000 0000
              </a>
            </li>
            <li>
              <a href="mailto:hello@opuluxe.com" className="transition hover:text-gold-300">
                hello@opuluxe.com
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/260970000000"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-gold-300"
              >
                WhatsApp Us
              </a>
            </li>
          </ul>
          <div className="mt-6 flex gap-3">
            <Link to="/book" className="btn-gold !px-5 !py-2 text-xs">
              Book Appointment
            </Link>
            <Link to="/track" className="btn-ghost !px-5 !py-2 text-xs">
              Track Booking
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-white/35 sm:flex-row">
          <p>© {new Date().getFullYear()} OPULUXE BEAUTY STUDIO. All rights reserved.</p>
          <Link to="/admin/login" className="transition hover:text-gold-300/70">
            Studio Login
          </Link>
          <p className="tracking-[0.25em] text-gold-400/70">YOUR BEAUTY ELEVATED</p>
        </div>
      </div>
    </footer>
  );
}
