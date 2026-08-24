import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User, FileText, Lock, Loader2, Zap } from "lucide-react";
import { usePremium } from "../hooks/usePremium";
import { api } from "../lib/api";
import { cn } from "../lib/utils";

interface ClyvenAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeNoteContent?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function ClyvenAISidebar({ isOpen, onClose, activeNoteContent }: ClyvenAISidebarProps) {
  const { isPremium, openUpgrade } = usePremium();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hallo! Ich bin **CLYVEN AI**, dein persönlicher Notiz- & Produktivitäts-Assistent. Wie kann ich dir heute helfen?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [includeNoteContext, setIncludeNoteContext] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await api.aiChat({
        message: currentInput,
        messages,
        noteContext: includeNoteContext && activeNoteContent ? activeNoteContent : undefined,
      });

      if (res && res.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            role: "assistant",
            content: res.message.content,
            timestamp: res.message.timestamp || new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          content: `Entschuldigung, es gab ein Problem bei der Verarbeitung: ${err.message || "Unbekannter Fehler"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay for small screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          />

          {/* Right Sidebar Container */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full sm:w-96 max-w-full flex-col border-l border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl transform-gpu"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-zinc-950 font-bold shadow-md shadow-sky-500/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                    CLYVEN AI
                    <span className="rounded border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-sky-300">
                      PLUS
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-400">Shortcut: Cmd + Shift + A</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                aria-label="Close AI sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Paywall Banner for Free Plan */}
            {!isPremium ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400 shadow-xl shadow-yellow-500/10">
                  <Lock className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">CLYVEN AI Freischalten</h4>
                <p className="text-xs text-white/50 leading-relaxed mb-6">
                  Nutze CLYVEN AI mit dem Plus-Plan für intelligente Notiz-Zusammenfassungen, automatische Aufgabengenerierung und unbegrenzten KI Chat.
                </p>
                <button
                  onClick={openUpgrade}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="h-4 w-4" /> Auf PLUS upgraden
                </button>
              </div>
            ) : (
              <>
                {/* Active note context indicator toggle */}
                {activeNoteContent && (
                  <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <FileText className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="truncate max-w-[190px]">Aktuelle Notiz verfügbar</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-indigo-300">
                      <input
                        type="checkbox"
                        checked={includeNoteContext}
                        onChange={(e) => setIncludeNoteContext(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 accent-indigo-500"
                      />
                      Kontext mitsenden
                    </label>
                  </div>
                )}

                {/* Chat Message History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex items-start gap-2.5", m.role === "user" ? "flex-row-reverse" : "flex-row")}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          m.role === "assistant"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                        )}
                      >
                        {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>

                      <div
                        className={cn(
                          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs",
                          m.role === "assistant"
                            ? "border border-zinc-800 bg-zinc-950/90 text-zinc-200"
                            : "bg-sky-500 text-zinc-950 font-semibold"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2 text-xs text-white/40 italic">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                      <span>CLYVEN AI denkt nach...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <form onSubmit={handleSend} className="border-t border-white/10 p-3 bg-black/30">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Frage CLYVEN AI etwas..."
                      disabled={loading}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-2.5 pl-3.5 pr-10 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-500/50 transition-all disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="absolute right-1.5 rounded-lg bg-sky-500 p-1.5 text-zinc-950 hover:bg-sky-400 transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
