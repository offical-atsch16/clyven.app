import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { CheckCircle2, AlertCircle, Mail, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Unsubscribe() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await api.unsubscribeNewsletter(email);
      setStatus({ type: "success", message: `Your email (${email}) has been unsubscribed from the Clyven newsletter.` });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Failed to unsubscribe. Please try again or contact support." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialEmail && initialEmail.includes("@")) {
      api.unsubscribeNewsletter(initialEmail)
        .then(() => {
          setStatus({ type: "success", message: `Your email (${initialEmail}) has been unsubscribed from the Clyven newsletter.` });
        })
        .catch((err) => {
          setStatus({ type: "error", message: err.message || "Failed to unsubscribe. Please try again below." });
        });
    }
  }, [initialEmail]);

  return (
    <div className="min-h-screen w-full bg-[#090A0F] text-[#FAFAFA] font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12141D]/70 p-8 shadow-2xl backdrop-blur-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <Mail className="h-6 w-6" />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Unsubscribe</h1>
        <p className="text-xs text-white/50 mb-6 leading-relaxed">
          Manage your email newsletter subscription for Clyven updates.
        </p>

        {status?.type === "success" ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center text-xs text-emerald-200 mb-6 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="font-semibold text-sm text-emerald-300">Unsubscribed</p>
            <p className="text-white/70">{status.message}</p>
          </div>
        ) : (
          <form onSubmit={handleUnsubscribe} className="space-y-4 mb-6">
            <div className="text-left">
              <label className="text-xs font-medium text-white/70 block mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            {status?.type === "error" && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 text-left">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{status.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-red-500/30 bg-red-950/20 py-3 text-xs font-semibold text-red-300 hover:bg-red-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Processing..." : "Unsubscribe from Newsletter"}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-white/10 flex justify-center">
          <Link href="/">
            <span className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Homepage
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
