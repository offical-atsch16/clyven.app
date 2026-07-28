import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { api } from "../lib/api";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.adminLogin({ email, password });
      navigate("/admin/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#080808] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05]">
            <Shield className="h-6 w-6 text-white/60" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Access</h1>
          <p className="mt-1 text-xs text-white/30">Support dashboard login</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">{error}</p>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/40">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/40">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-white/90 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
