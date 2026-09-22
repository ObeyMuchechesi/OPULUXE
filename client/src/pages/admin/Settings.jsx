import { useEffect, useState } from "react";
import api from "../../api";

export default function Settings() {
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then((r) => setAdmin(r.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (form.newPassword.length < 6) {
      return setMsg({ type: "error", text: "New password must be at least 6 characters." });
    }
    if (form.newPassword !== form.confirm) {
      return setMsg({ type: "error", text: "New passwords do not match." });
    }

    setSaving(true);
    try {
      await api.put("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setMsg({ type: "ok", text: "Password updated successfully." });
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Could not update password.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">Account</p>
      <h1 className="mt-2 font-display text-3xl text-white">Settings</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-7">
          <h2 className="font-display text-xl text-gold-200">Account</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-white/35">Name</span>
              <span className="text-white/80">{admin?.name || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-white/35">Email</span>
              <span className="text-white/80">{admin?.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/35">Role</span>
              <span className="capitalize text-white/80">{admin?.role || "—"}</span>
            </div>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-white/30">
            Tip: to change your login email, update it directly in the database or re-run the seed
            script with new credentials.
          </p>
        </div>

        <div className="card p-7">
          <h2 className="font-display text-xl text-gold-200">Change Password</h2>

          <form onSubmit={submit} className="mt-5 space-y-5">
            <div>
              <label className="label">Current password</label>
              <input
                type="password"
                className="input"
                value={form.currentPassword}
                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              />
            </div>

            {msg.text && (
              <p
                className={`rounded-xl px-4 py-3 text-xs ${
                  msg.type === "ok"
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border border-rose-400/30 bg-rose-400/10 text-rose-300"
                }`}
              >
                {msg.text}
              </p>
            )}

            <button className="btn-gold w-full" disabled={saving}>
              {saving ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
