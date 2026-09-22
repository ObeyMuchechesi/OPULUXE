import { useCallback, useEffect, useState } from "react";
import api from "../../api";
import { money } from "../../utils";

const EMPTY = {
  name: "",
  price: "",
  priceMax: "",
  duration: 60,
  category: "Braids",
  description: "",
  order: 0,
  active: true,
};

export default function ServicesAdmin() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | {mode, data}
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/services", { params: { all: true } })
      .then((r) => setServices(r.data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setError("");
    setModal({ mode: "create", data: { ...EMPTY, order: services.length + 1 } });
  };

  const openEdit = (s) => {
    setError("");
    setModal({
      mode: "edit",
      data: {
        ...s,
        price: String(s.price),
        priceMax: s.priceMax ? String(s.priceMax) : "",
      },
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");

    const d = modal.data;
    if (!d.name.trim()) return setError("Service name is required.");
    if (d.price === "" || Number(d.price) < 0) return setError("A valid price is required.");
    if (d.priceMax !== "" && Number(d.priceMax) < Number(d.price)) {
      return setError("Maximum price cannot be less than the base price.");
    }

    const payload = {
      name: d.name.trim(),
      price: Number(d.price),
      priceMax: d.priceMax === "" ? null : Number(d.priceMax),
      duration: Number(d.duration) || 60,
      category: d.category.trim() || "Services",
      description: d.description.trim(),
      order: Number(d.order) || 0,
      active: !!d.active,
    };

    setSaving(true);
    try {
      if (modal.mode === "create") {
        const { data } = await api.post("/services", payload);
        setServices((prev) => [...prev, data].sort(sorter));
      } else {
        const { data } = await api.put(`/services/${d._id}`, payload);
        setServices((prev) => prev.map((s) => (s._id === d._id ? data : s)).sort(sorter));
      }
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the service.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      const { data } = await api.put(`/services/${s._id}`, { active: !s.active });
      setServices((prev) => prev.map((x) => (x._id === s._id ? data : x)));
    } catch (err) {
      alert(err.response?.data?.message || "Could not update service");
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/services/${s._id}`);
      setServices((prev) => prev.filter((x) => x._id !== s._id));
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete service");
    }
  };

  const set = (key) => (e) =>
    setModal((m) => ({
      ...m,
      data: {
        ...m.data,
        [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
      },
    }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">Catalogue</p>
          <h1 className="mt-2 font-display text-3xl text-white">Services & Prices</h1>
        </div>
        <button onClick={openNew} className="btn-gold !py-2.5 text-xs">
          + Add Service
        </button>
      </div>

      <div className="card mt-8 overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-display text-xl text-white/60">No services yet</p>
            <p className="mt-2 text-xs text-white/30">Add your first service to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.15em] text-white/35">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr
                    key={s._id}
                    className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4 text-white/35">{s.order}</td>
                    <td className="px-6 py-4">
                      <p className="text-white/85">{s.name}</p>
                      {s.description ? (
                        <p className="text-[11px] text-white/30">{s.description}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-white/55">{s.category}</td>
                    <td className="px-6 py-4 text-gold-300">
                      {s.priceMax && s.priceMax > s.price
                        ? `${money(s.price)} – ${money(s.priceMax)}`
                        : money(s.price)}
                    </td>
                    <td className="px-6 py-4 text-white/55">{s.duration} min</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(s)}
                        className={`pill ${
                          s.active
                            ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/25"
                            : "bg-white/5 text-white/40 border border-white/10"
                        }`}
                      >
                        {s.active ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg border border-white/12 px-3 py-1.5 text-[11px] text-white/60 transition hover:border-gold-400/60 hover:text-gold-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(s)}
                          className="rounded-lg border border-rose-400/25 px-3 py-1.5 text-[11px] text-rose-300/80 transition hover:bg-rose-400/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-plum p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl text-white">
              {modal.mode === "create" ? "Add Service" : "Edit Service"}
            </h2>

            <form onSubmit={save} className="mt-6 space-y-5">
              <div>
                <label className="label">Service name *</label>
                <input
                  className="input"
                  value={modal.data.name}
                  onChange={set("name")}
                  placeholder="e.g. Knotless Braids Normal Length"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className="label">Price (K) *</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={modal.data.price}
                    onChange={set("price")}
                    placeholder="450"
                  />
                </div>
                <div>
                  <label className="label">Max price (opt.)</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={modal.data.priceMax}
                    onChange={set("priceMax")}
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    className="input"
                    value={modal.data.duration}
                    onChange={set("duration")}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label">Category</label>
                  <input
                    className="input"
                    value={modal.data.category}
                    onChange={set("category")}
                    placeholder="Knotless Braids"
                  />
                </div>
                <div>
                  <label className="label">Display order</label>
                  <input
                    type="number"
                    className="input"
                    value={modal.data.order}
                    onChange={set("order")}
                  />
                </div>
              </div>

              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  rows={2}
                  className="input resize-none"
                  value={modal.data.description}
                  onChange={set("description")}
                  placeholder="Short note shown on the website"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={!!modal.data.active}
                  onChange={set("active")}
                  className="h-4 w-4 accent-gold-400"
                />
                Show this service on the website
              </label>

              {error && (
                <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="btn-ghost flex-1 !py-3 text-xs"
                >
                  Cancel
                </button>
                <button className="btn-gold flex-1" disabled={saving}>
                  {saving ? "Saving…" : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const sorter = (a, b) => (a.order || 0) - (b.order || 0) || a.price - b.price;
