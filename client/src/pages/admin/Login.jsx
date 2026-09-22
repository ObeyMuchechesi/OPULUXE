import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import useSEO from "../../useSEO";

export default function Login() {
  useSEO({
    title: "Studio Login | OPULUXE Admin",
    noindex: true,
  });
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("opuluxe_token", data.token);
      localStorage.setItem("opuluxe_admin", JSON.stringify(data.admin));
      nav("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6">
      <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-gold-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[140px]" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 block text-center">
          <p className="font-display text-2xl tracking-[0.25em] text-gold-300">OPULUXE</p>
          <p className="mt-1 text-[10px] tracking-[0.4em] text-white/40">BEAUTY STUDIO</p>
        </Link>

        <div className="card p-8 shadow-soft">
          <h1 className="font-display text-2xl text-white">Studio Dashboard</h1>
          <p className="mt-2 text-xs text-white/40">Sign in to manage bookings.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="admin@opuluxe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">
                {error}
              </p>
            )}

            <button className="btn-gold w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-white/25">
            Default: admin@opuluxe.com / opuluxe123
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          <Link to="/" className="transition hover:text-gold-300">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
