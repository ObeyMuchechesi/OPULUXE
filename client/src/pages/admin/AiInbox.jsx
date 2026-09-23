import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api";
import { prettyDate, prettyTime } from "../../utils";
import useSEO from "../../useSEO";

export default function AiInbox() {
  useSEO({ title: "AI Inbox | OPULUXE Admin", noindex: true });
  const [convs, setConvs] = useState([]);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [simPhone, setSimPhone] = useState("260970000001");
  const [simText, setSimText] = useState("Hi, I want knotless braids on Saturday");
  const [simLog, setSimLog] = useState([]);
  const threadRef = useRef(null);

  const loadConvs = useCallback(() => {
    api
      .get("/wa/conversations")
      .then((r) => {
        setConvs(r.data);
        setActive((a) => r.data.find((c) => c.id === (a?.id || "")) || r.data[0] || null);
      })
      .catch(() => setConvs([]));
  }, []);

  useEffect(() => {
    loadConvs();
    const t = setInterval(loadConvs, 15000); // light polling
    return () => clearInterval(t);
  }, [loadConvs]);

  const openConv = async (id) => {
    try {
      const { data } = await api.get(`/wa/conversations/${id}`);
      setActive((a) => ({ ...(a || {}), ...data, id: data._id }));
    } catch {
      /* keep list item */
    }
  };

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [active]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !active) return;
    setSending(true);
    try {
      await api.post(`/wa/conversations/${active.id}/reply`, { text });
      setReply("");
      await openConv(active.id);
      loadConvs();
    } catch (err) {
      alert(err.response?.data?.message || "Could not send reply");
    } finally {
      setSending(false);
    }
  };

  const resetAgent = async () => {
    if (!active) return;
    try {
      await api.post(`/wa/conversations/${active.id}/reset`);
      await openConv(active.id);
      loadConvs();
    } catch {
      /* noop */
    }
  };

  const runSim = async (text) => {
    const t = (text ?? simText).trim();
    if (!t) return;
    setSimLog((l) => [...l, { role: "you", text: t }]);
    setSimText("");
    try {
      const { data } = await api.post("/wa/simulate", { from: simPhone, text: t, name: "Test Customer" });
      setSimLog((l) => [...l, { role: "agent", text: data.reply }]);
      loadConvs();
    } catch (err) {
      setSimLog((l) => [...l, { role: "agent", text: `Error: ${err.response?.data?.message || "failed"}` }]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80">WhatsApp Agent</p>
          <h1 className="mt-2 font-display text-3xl text-white">AI Inbox</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={loadConvs} className="btn-ghost !py-2.5 text-xs">
            Refresh
          </button>
          <a
            href="https://wa.me/260970000000"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost !py-2.5 text-xs"
          >
            Open WhatsApp
          </a>
        </div>
      </div>

      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/40">
        Lux, your AI appointment agent, chats with customers on WhatsApp — finds free slots, books
        them straight into the calendar, sends confirmations and reminders, and handles reschedules.
        Every conversation lands here. Connect the Meta WhatsApp Cloud API webhook
        (<span className="text-gold-300/80">POST /api/wa/webhook</span>) to go live; use the
        simulator below to try the flow now.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Conversation list */}
        <div className="card max-h-[560px] overflow-y-auto p-2">
          {convs.length === 0 && (
            <p className="px-4 py-10 text-center text-xs text-white/35">
              No conversations yet. Use the simulator to create one.
            </p>
          )}
          {convs.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActive(c);
                openConv(c.id);
              }}
              className={`mb-1 w-full rounded-xl px-4 py-3 text-left transition ${
                active?.id === c.id ? "bg-gold-400/10" : "hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm text-white/85">{c.name}</p>
                {c.needsReply && <span className="h-2 w-2 shrink-0 rounded-full bg-gold-300" />}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-white/40">{c.lastMessage || "—"}</p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/30">
                <span className="capitalize">{c.state === "idle" ? "chatting" : c.state.replace("await_", "choosing ")}</span>
                <span>·</span>
                <span>{new Date(c.updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="card flex max-h-[560px] flex-col overflow-hidden">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-xs text-white/30">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div>
                  <p className="text-sm text-white/85">{active.name}</p>
                  <p className="text-[10px] text-white/35">
                    +{active.phone} · agent state: <span className="text-gold-300/80">{active.state || "idle"}</span>
                    {active.lastBookingRef ? ` · last ref ${active.lastBookingRef}` : ""}
                  </p>
                </div>
                <button
                  onClick={resetAgent}
                  className="rounded-lg border border-white/12 px-3 py-1.5 text-[10px] text-white/50 hover:text-white"
                  title="Clear any stuck booking flow"
                >
                  Reset agent
                </button>
              </div>

              <div ref={threadRef} className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
                {(active.messages || []).map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      m.from === "customer"
                        ? "mr-auto bg-white/[0.06] text-white/85"
                        : "ml-auto bg-gold-400/15 text-gold-100"
                    }`}
                  >
                    {m.text}
                    <span className="mt-1 block text-right text-[9px] text-white/25">
                      {m.ts ? new Date(m.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 border-t border-white/10 px-5 py-3">
                <input
                  className="input !py-2.5 text-xs"
                  placeholder="Reply manually (overrides the agent for this turn)…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                />
                <button onClick={sendReply} disabled={sending} className="btn-gold !px-4 !py-2.5 text-xs">
                  {sending ? "…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Simulator */}
      <div className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Agent simulator</p>
            <p className="mt-1 text-xs text-white/45">
              Chat with Lux exactly like a customer would. Bookings made here appear in the dashboard.
            </p>
          </div>
          <input
            className="input !w-48 !py-2 text-xs"
            value={simPhone}
            onChange={(e) => setSimPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="Customer phone"
          />
        </div>

        <div className="mt-4 flex h-64 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {simLog.length === 0 && (
              <p className="py-8 text-center text-[11px] text-white/25">
                Say hello — e.g. "Hi, I want knotless braids on Saturday at 10am"
              </p>
            )}
            {simLog.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                  m.role === "customer" || m.role === "you"
                    ? "mr-auto bg-white/[0.06] text-white/85"
                    : "ml-auto bg-gold-400/15 text-gold-100"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-white/10 px-4 py-3">
            <input
              className="input !py-2.5 text-xs"
              placeholder="Type as the customer…"
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSim()}
            />
            <button onClick={() => runSim()} className="btn-gold !px-4 !py-2.5 text-xs">
              Send
            </button>
            <button
              onClick={() => setSimLog([])}
              className="btn-ghost !px-4 !py-2.5 text-xs"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Hi",
            "I want knotless braids on Saturday",
            "10am",
            "Chanda Mwale",
            "yes",
            "What's on the price list?",
          ].map((s) => (
            <button
              key={s}
              onClick={() => runSim(s)}
              className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] text-white/55 transition hover:border-gold-400/50 hover:text-gold-200"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
