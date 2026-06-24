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
      reason={`Du hast das Free-Limit von ${FREE_LIMITS.bookmarks} Bookmarks erreicht. Upgrade für unbegrenzte Bookmarks.`}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111111] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-white">Bookmark speichern</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/40">URL *</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://..."
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/40">Titel (optional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Automatisch erkannt..."
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/40">Kategorie</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z.B. Design, Dev, Lesen..."
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20" />
          </div>
          <button type="submit" disabled={createBookmark.isPending}
            className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors disabled:opacity-60">
            {createBookmark.isPending ? "Speichern..." : "Bookmark speichern"}
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
    <div className="min-h-full p-6 lg:p-8">
      {addOpen && <AddBookmarkModal onClose={() => setAddOpen(false)} />}
      {upgradeOpen && (
        <UpgradeModal
          onClose={() => setUpgradeOpen(false)}
          reason={`Du hast das Free-Limit von ${FREE_LIMITS.bookmarks} Bookmarks erreicht. Upgrade für unbegrenzte Bookmarks.`}
        />
      )}

      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Bookmark Vault</h1>
            <p className="mt-1 text-sm text-white/40">
              {bookmarks.length} gespeichert
              {!isPremium && ` · ${FREE_LIMITS.bookmarks - bookmarks.length} verbleibend`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isPremium && (
              <div className="hidden sm:flex h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">
                <div className={cn("h-full rounded-full transition-all", atLimit ? "bg-yellow-400/60" : "bg-white/30")}
                  style={{ width: `${Math.min((bookmarks.length / FREE_LIMITS.bookmarks) * 100, 100)}%` }} />
              </div>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAdd}
              className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                atLimit
                  ? "border border-yellow-400/20 bg-yellow-400/5 text-yellow-400/70 hover:bg-yellow-400/10"
                  : "bg-white text-black hover:bg-white/90")}>
              {atLimit ? <><Crown className="h-4 w-4" /> Upgrade</> : <><Plus className="h-4 w-4" /> Hinzufügen</>}
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)}
                className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  filter === c ? "bg-white/[0.1] text-white" : "text-white/35 hover:text-white/60")}>
                {c === "all" ? "Alle" : c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen..."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white/70 outline-none placeholder:text-white/20" />
            </div>
            <button onClick={() => setView("grid")}
              className={cn("rounded-lg p-2 transition-colors", view === "grid" ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60")}>
              <Grid className="h-4 w-4" />
            </button>
            <button onClick={() => setView("list")}
              className={cn("rounded-lg p-2 transition-colors", view === "list" ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={cn("gap-4", view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3" : "space-y-2")}>
            {[...Array(6)].map((_, i) => <div key={i} className={cn("animate-pulse rounded-2xl bg-white/[0.03]", view === "grid" ? "h-40" : "h-16")} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Bookmark className="mb-3 h-8 w-8 text-white/10" />
            <p className="text-sm text-white/25">{search ? "Keine Ergebnisse" : "Noch keine Bookmarks"}</p>
            {!search && !atLimit && <button onClick={handleAdd} className="mt-3 text-xs text-white/40 hover:text-white/70 underline">Erstes Bookmark hinzufügen</button>}
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((b: any) => (
                <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative rounded-2xl border border-white/[0.07] bg-[#111111] p-5 hover:border-white/10 transition-all">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                      <Globe className="h-4 w-4 text-white/40" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => updateBookmark.mutate({ id: b.id, isFavorite: !b.isFavorite })}
                        className={cn("rounded-lg p-1 transition-colors", b.isFavorite ? "text-yellow-400/70" : "text-white/25 hover:text-white/60")}>
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteBookmark.mutate(b.id)}
                        className="rounded-lg p-1 text-white/25 hover:text-red-400/70 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="group/link block">
                    <p className="mb-1 truncate text-sm font-medium text-white/80 group-hover/link:text-white transition-colors">{b.title || b.url}</p>
                    <p className="truncate text-xs text-white/30">{b.siteName || b.url}</p>
                  </a>
                  {b.category && <span className="mt-3 inline-block rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/30">{b.category}</span>}
                  <p className="mt-2 text-[10px] text-white/20">{formatRelative(b.createdAt)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((b: any) => (
              <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-[#111111] px-4 py-3 hover:border-white/10 transition-all">
                <Globe className="h-4 w-4 shrink-0 text-white/30" />
                <div className="flex-1 overflow-hidden">
                  <a href={b.url} target="_blank" rel="noopener noreferrer"
                    className="truncate text-sm font-medium text-white/70 hover:text-white transition-colors">{b.title || b.url}</a>
                  <p className="truncate text-xs text-white/30">{b.siteName || b.url}</p>
                </div>
                {b.category && <span className="hidden shrink-0 rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/30 sm:block">{b.category}</span>}
                <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => updateBookmark.mutate({ id: b.id, isFavorite: !b.isFavorite })}
                    className={cn("rounded p-1", b.isFavorite ? "text-yellow-400/70" : "text-white/25 hover:text-white/60")}>
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-white/25 hover:text-white/60">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button onClick={() => deleteBookmark.mutate(b.id)} className="rounded p-1 text-white/25 hover:text-red-400/70">
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

