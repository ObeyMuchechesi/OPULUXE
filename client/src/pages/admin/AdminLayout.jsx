import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const nav = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("opuluxe_token");
    const stored = localStorage.getItem("opuluxe_admin");

    if (!token) {
      nav("/admin/login", { replace: true });
      return;
    }
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    setReady(true);
  }, [nav]);

  const logout = () => {
    localStorage.removeItem("opuluxe_token");
    localStorage.removeItem("opuluxe_admin");
    nav("/admin/login", { replace: true });
  };

  if (!ready) return <div className="min-h-screen bg-ink" />;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
      isActive
        ? "bg-gold-400/15 text-gold-200"
        : "text-white/55 hover:bg-white/[0.04] hover:text-white/85"
    }`;

  const links = (
    <>
      <NavLink to="/admin" end className={linkClass} onClick={() => setMenuOpen(false)}>
        <Dot /> Bookings
      </NavLink>
      <NavLink to="/admin/ai-inbox" className={linkClass} onClick={() => setMenuOpen(false)}>
        <Dot /> AI Inbox
      </NavLink>
      <NavLink to="/admin/services" className={linkClass} onClick={() => setMenuOpen(false)}>
        <Dot /> Services
      </NavLink>
      <NavLink to="/admin/settings" className={linkClass} onClick={() => setMenuOpen(false)}>
        <Dot /> Settings
      </NavLink>
    </>
  );

  return (
    <div className="min-h-screen bg-ink lg:flex">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-plum/40 p-6 lg:flex">
        <Link to="/" className="mb-10 block">
          <p className="font-display text-lg tracking-[0.22em] text-gold-300">OPULUXE</p>
          <p className="mt-1 text-[9px] tracking-[0.35em] text-white/35">BEAUTY STUDIO</p>
        </Link>

        <nav className="space-y-1">{links}</nav>

        <div className="mt-auto pt-8">
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="truncate text-sm text-white/80">{admin?.name || "Admin"}</p>
            <p className="truncate text-[11px] text-white/35">{admin?.email}</p>
          </div>
          <button onClick={logout} className="btn-ghost w-full !py-2.5 text-xs">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-ink/90 px-5 py-4 backdrop-blur-xl lg:hidden">
          <Link to="/" className="flex flex-col leading-none">
            <span className="font-display text-base tracking-[0.2em] text-gold-300">OPULUXE</span>
            <span className="text-[8px] tracking-[0.35em] text-white/35">BEAUTY STUDIO</span>
          </Link>
          <button
            onClick={() => setMenuOpen((m) => !m)}
            className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/70"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </header>

        {menuOpen && (
          <div className="border-b border-white/10 bg-plum/40 px-5 py-4 lg:hidden">
            <nav className="space-y-1">{links}</nav>
            <button onClick={logout} className="btn-ghost mt-4 w-full !py-2.5 text-xs">
              Sign Out
            </button>
          </div>
        )}

        <main className="px-5 py-8 sm:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-gold-400/70" />;
}
