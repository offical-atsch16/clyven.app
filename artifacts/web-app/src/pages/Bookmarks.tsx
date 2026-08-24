import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Bookmark, Star, Trash2, Grid, List, ExternalLink, X, Globe, Crown } from "lucide-react";
import { api } from "../lib/api";
import { cn, formatRelative } from "../lib/utils";
import { usePremium, FREE_LIMITS } from "../hooks/usePremium";
import { UpgradeModal } from "../components/UpgradeModal";

function AddBookmarkModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const createBookmark = useMutation({
    mutationFn: api.createBookmark,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookmarks"] }); onClose(); },
  });
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [limitError, setLimitError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let domain = url;
    try { domain = new URL(url).hostname; } catch {}
    try {
      await createBookmark.mutateAsync({ url, title: title || domain, siteName: domain, category });
    } catch (e: any) {
      try {
        const body = JSON.parse(e.message || "{}");
        if (body?.error === "LIMIT_REACHED") { setLimitError(true); return; }
      } catch {}
    }
  };

  if (limitError) return (
    <UpgradeModal
      onClose={onClose}
      reason={`You've reached the free limit of ${FREE_LIMITS.bookmarks} bookmarks. Upgrade for unlimited bookmarks.`}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-3xl glass-panel p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-zinc-100 uppercase tracking-wider text-xs">Save Bookmark</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">URL *</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://..."
              className="glass-input w-full rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Title (optional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Auto-detected..."
              className="glass-input w-full rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Design, Dev, Reading..."
              className="glass-input w-full rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500" />
          </div>
          <button type="submit" disabled={createBookmark.isPending}
            className="btn-liquid-primary w-full rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-60 shadow-md">
            {createBookmark.isPending ? "Saving..." : "Save Bookmark"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export function Bookmarks() {
  const qc = useQueryClient();
  const { isPremium } = usePremium();
  const { data: bookmarks = [], isLoading } = useQuery({ queryKey: ["bookmarks"], queryFn: api.getBookmarks, retry: 1 });
  const updateBookmark = useMutation({ mutationFn: ({ id, ...data }: any) => api.updateBookmark(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }) });
  const deleteBookmark = useMutation({ mutationFn: api.deleteBookmark, onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }) });

  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const atLimit = !isPremium && bookmarks.length >= FREE_LIMITS.bookmarks;
  const categories = ["all", ...Array.from(new Set((bookmarks as any[]).map((b: any) => b.category).filter(Boolean)))];
  const filtered = (bookmarks as any[]).filter((b: any) => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.url?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filter === "all" || b.category === filter;
    return matchSearch && matchCat;
  });

  const handleAdd = () => {
    if (atLimit) { setUpgradeOpen(true); return; }
    setAddOpen(true);
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {addOpen && <AddBookmarkModal onClose={() => setAddOpen(false)} />}
      {upgradeOpen && (
        <UpgradeModal
          onClose={() => setUpgradeOpen(false)}
          reason={`You've reached the free limit of ${FREE_LIMITS.bookmarks} bookmarks. Upgrade for unlimited bookmarks.`}
        />
      )}

      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Bookmark Vault</h1>
            <p className="mt-1 text-sm text-zinc-400 font-medium">
              {bookmarks.length} saved
              {!isPremium && ` · ${FREE_LIMITS.bookmarks - bookmarks.length} remaining`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isPremium && (
              <div className="hidden sm:flex h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.04]">
                <div className={cn("h-full rounded-full transition-all", atLimit ? "bg-amber-400" : "bg-gradient-to-r from-indigo-400 to-sky-400")}
                  style={{ width: `${Math.min((bookmarks.length / FREE_LIMITS.bookmarks) * 100, 100)}%` }} />
              </div>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleAdd}
              className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 shadow-md cursor-pointer",
                atLimit
                  ? "border border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                  : "btn-liquid-primary")}>
              {atLimit ? <><Crown className="h-4 w-4 text-amber-400" /> Upgrade</> : <><Plus className="h-4 w-4" /> Add</>}
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 overflow-x-auto">
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)}
                className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer active:scale-95",
                  filter === c ? "border-white/20 bg-white/10 text-zinc-100 shadow-xs" : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]")}>
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-500" />
            </div>
            <button onClick={() => setView("grid")}
              className={cn("rounded-xl p-2 border transition-all active:scale-95 cursor-pointer", view === "grid" ? "border-white/20 bg-white/10 text-zinc-100" : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-200")}>
              <Grid className="h-4 w-4" />
            </button>
            <button onClick={() => setView("list")}
              className={cn("rounded-xl p-2 border transition-all active:scale-95 cursor-pointer", view === "list" ? "border-white/20 bg-white/10 text-zinc-100" : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-200")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={cn("gap-4", view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3" : "space-y-2")}>
            {[...Array(6)].map((_, i) => <div key={i} className={cn("animate-pulse rounded-2xl bg-white/[0.03] border border-white/[0.04]", view === "grid" ? "h-40" : "h-16")} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Bookmark className="mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500 font-medium">{search ? "No results" : "No bookmarks yet"}</p>
            {!search && !atLimit && <button onClick={handleAdd} className="mt-3 text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer">Add your first bookmark</button>}
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((b: any) => (
                <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.01 }}
                  className="glass-panel-interactive group relative rounded-2xl p-5 shadow-xs">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10">
                      <Globe className="h-4 w-4 text-zinc-300" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => updateBookmark.mutate({ id: b.id, isFavorite: !b.isFavorite })}
                        className={cn("rounded-lg p-1.5 transition-colors cursor-pointer", b.isFavorite ? "text-amber-400" : "text-zinc-500 hover:text-zinc-200")}>
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteBookmark.mutate(b.id)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="group/link block">
                    <p className="mb-1 truncate text-sm font-semibold text-zinc-100 group-hover/link:text-indigo-300 transition-colors">{b.title || b.url}</p>
                    <p className="truncate text-xs text-zinc-400 font-mono">{b.siteName || b.url}</p>
                  </a>
                  {b.category && <span className="mt-3 inline-block status-pill text-[10px] text-zinc-300">{b.category}</span>}
                  <p className="mt-2 text-[10px] text-zinc-500 font-mono">{formatRelative(b.createdAt)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((b: any) => (
              <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel-interactive group flex items-center gap-4 rounded-2xl px-4 py-3">
                <Globe className="h-4 w-4 shrink-0 text-zinc-400" />
                <div className="flex-1 overflow-hidden">
                  <a href={b.url} target="_blank" rel="noopener noreferrer"
                    className="truncate text-sm font-semibold text-zinc-200 hover:text-indigo-300 transition-colors">{b.title || b.url}</a>
                  <p className="truncate text-xs text-zinc-400 font-mono">{b.siteName || b.url}</p>
                </div>
                {b.category && <span className="hidden shrink-0 status-pill text-[10px] text-zinc-300 sm:block">{b.category}</span>}
                <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => updateBookmark.mutate({ id: b.id, isFavorite: !b.isFavorite })}
                    className={cn("rounded-lg p-1.5 cursor-pointer", b.isFavorite ? "text-amber-400" : "text-zinc-500 hover:text-zinc-200")}>
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button onClick={() => deleteBookmark.mutate(b.id)} className="rounded-lg p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
