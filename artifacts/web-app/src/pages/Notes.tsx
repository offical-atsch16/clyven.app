import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, FileText, Star, Pin, Trash2, X, Save,
  Download, Zap, Crown, Copy, Check, Tag, Sparkles, Link as LinkIcon, ArrowUpRight, Wand2
} from "lucide-react";
import { api } from "../lib/api";
import { cn, countWords, formatRelative } from "../lib/utils";
import { usePremium, FREE_LIMITS } from "../hooks/usePremium";
import { UpgradeModal } from "../components/UpgradeModal";
import { NoteFileUpload } from "../components/NoteFileUpload";
import { useLocation, useSearch } from "wouter";

const COLORS = [
  { key: "default", cls: "bg-white/[0.03]" },
  { key: "red", cls: "bg-red-950/30" },
  { key: "blue", cls: "bg-blue-950/30" },
  { key: "green", cls: "bg-green-950/30" },
  { key: "yellow", cls: "bg-yellow-950/30" },
  { key: "purple", cls: "bg-purple-950/30" },
];

function NoteColor({ selected, cls, onClick }: any) {
  return (
    <button onClick={onClick}
      className={cn("h-4 w-4 rounded-full border transition-all cursor-pointer", cls, selected ? "border-white/60 scale-110" : "border-white/20")} />
  );
}

export function Notes() {
  const qc = useQueryClient();
  const { isPremium } = usePremium();
  const searchParams = useSearch();

  const { data: notes = [], isLoading } = useQuery({ queryKey: ["notes"], queryFn: api.getNotes, retry: 1 });
  const createNote = useMutation({
    mutationFn: api.createNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
    onError: (e: any) => {
      try {
        const body = JSON.parse(e.message || "{}");
        if (body?.error === "LIMIT_REACHED") setUpgradeOpen(true);
      } catch {
        setUpgradeOpen(true);
      }
    },
  });
  const updateNote = useMutation({ mutationFn: ({ id, ...data }: any) => api.updateNote(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }) });
  const deleteNote = useMutation({ mutationFn: api.deleteNote, onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); setSelected(null); } });

  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState("default");
  const [saving, setSaving] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | undefined>(undefined);
  const [noteCopied, setNoteCopied] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [aiLoading, setAiLoading] = useState(false);

  const atLimit = !isPremium && notes.length >= FREE_LIMITS.notes;

  const selectNote = (note: any) => {
    setSelected(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color || "default");
  };

  // Handle URL search params e.g. /notes?id=xxx or ?new=1
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const noteId = params.get("id");
    if (noteId && notes.length > 0) {
      const found = notes.find((n: any) => n.id === noteId);
      if (found) selectNote(found);
    }
  }, [searchParams, notes]);

  const save = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    await updateNote.mutateAsync({ id: selected.id, title: editTitle || "Untitled", content: editContent, color: editColor });
    setSaving(false);
  }, [selected, editTitle, editContent, editColor, updateNote]);

  useEffect(() => {
    if (!selected) return;
    const t = setTimeout(save, 1200);
    return () => clearTimeout(t);
  }, [editTitle, editContent, editColor]);

  const handleNew = async () => {
    if (atLimit) {
      setUpgradeReason(`Du hast das Free-Limit von ${FREE_LIMITS.notes} Notizen erreicht. Upgrade für unbegrenzte Notizen.`);
      setUpgradeOpen(true);
      return;
    }
    try {
      const note = await createNote.mutateAsync({ title: "New Note", content: "" });
      selectNote(note);
    } catch {}
  };

  // AI Assistant Action Handlers
  const handleAiAction = async (action: "fix_spelling" | "summarize" | "todo_list") => {
    if (!isPremium) {
      setUpgradeReason("Schalte CLYVEN AI mit CLYVEN PLUS frei, um automatische Korrekturen, Zusammenfassungen und To-Do-Listen zu generieren.");
      setUpgradeOpen(true);
      return;
    }

    if (!editContent.trim()) return;

    try {
      setAiLoading(true);
      const res = await api.getNotesAIAssistant({ action, text: editContent });
      if (res.result) {
        if (action === "fix_spelling") {
          setEditContent(res.result);
        } else {
          setEditContent((prev) => prev + "\n\n" + res.result);
        }
      }
    } catch (err: any) {
      if (err.message?.includes("PREMIUM_REQUIRED")) {
        setUpgradeReason("Schalte CLYVEN AI mit CLYVEN PLUS frei, um automatische Korrekturen, Zusammenfassungen und To-Do-Listen zu generieren.");
        setUpgradeOpen(true);
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Bidirectional Backlinks logic
  const backlinks = useMemo(() => {
    if (!selected) return [];
    const currentTitle = selected.title.trim().toLowerCase();
    if (!currentTitle) return [];

    return notes.filter((n: any) => {
      if (n.id === selected.id) return false;
      const content = (n.content || "").toLowerCase();
      return content.includes(`[[${currentTitle}]]`);
    });
  }, [selected, notes]);

  const renderContentWithWikiLinks = (content: string) => {
    const parts = content.split(/(\[\[.*?\]\])/g);
    return parts.map((part, index) => {
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const title = part.slice(2, -2).trim();
        const targetNote = notes.find((n: any) => n.title.toLowerCase().trim() === title.toLowerCase());
        return (
          <span
            key={index}
            onClick={() => targetNote && selectNote(targetNote)}
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium cursor-pointer transition-colors border",
              targetNote
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                : "border-white/10 bg-white/5 text-white/40 hover:text-white/60"
            )}
            title={targetNote ? `Zur Notiz: "${targetNote.title}"` : `Notiz "${title}" existiert noch nicht`}
          >
            <LinkIcon className="h-3 w-3" />
            {title}
          </span>
        );
      }
      return part;
    });
  };

  const exportMarkdown = () => {
    const md = (notes as any[]).map((n: any) =>
      `# ${n.title}\n\n${n.content}\n\n---\n`
    ).join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clyven-notes.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = ["all", ...Array.from(new Set((notes as any[]).map((n: any) => n.category).filter(Boolean)))];

  const filtered = (notes as any[]).filter((n: any) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || n.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex h-full">
      {upgradeOpen && (
        <UpgradeModal
          onClose={() => setUpgradeOpen(false)}
          reason={upgradeReason || `Du hast das Free-Limit von ${FREE_LIMITS.notes} Notizen erreicht. Upgrade für unbegrenzte Notizen.`}
        />
      )}

      {/* Note list */}
      <div className={cn("flex w-full flex-col border-r border-white/[0.06] bg-zinc-950/40 backdrop-blur-md lg:w-72 xl:w-80", selected && "hidden lg:flex")}>
        <div className="border-b border-white/[0.06] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-sm font-bold text-zinc-100">Notes</h1>
            <div className="flex items-center gap-1.5">
              {isPremium && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportMarkdown}
                  title="Export as Markdown"
                  className="flex items-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer">
                  <Download className="h-3 w-3" />
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleNew}
                className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm",
                  atLimit
                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                    : "btn-liquid-primary")}>
                {atLimit ? <><Crown className="h-3.5 w-3.5 text-amber-400" /> Limit</> : <><Plus className="h-3.5 w-3.5" /> New</>}
              </motion.button>
            </div>
          </div>

          {/* Limit bar */}
          {!isPremium && (
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>{notes.length}/{FREE_LIMITS.notes} notes</span>
                {atLimit && (
                  <button onClick={() => { setUpgradeReason(`Du hast das Free-Limit von ${FREE_LIMITS.notes} Notizen erreicht. Upgrade für unbegrenzte Notizen.`); setUpgradeOpen(true); }} className="text-amber-400 hover:underline cursor-pointer font-semibold">
                    Upgrade →
                  </button>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.04]">
                <div className={cn("h-full rounded-full transition-all", atLimit ? "bg-amber-400" : "bg-gradient-to-r from-indigo-400 to-sky-400")}
                  style={{ width: `${Math.min((notes.length / FREE_LIMITS.notes) * 100, 100)}%` }} />
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-500 transition-all" />
          </div>

          {categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto mt-3 pb-1 max-w-full">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer active:scale-95 border",
                    categoryFilter === c
                      ? "bg-white/10 text-zinc-100 border-white/20 shadow-xs"
                      : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
                  )}
                >
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.03] border border-white/[0.04]" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-500 font-medium">{search ? "No results" : "No notes yet"}</p>
              {!search && !atLimit && <button onClick={handleNew} className="mt-3 text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer">Create your first note</button>}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((note: any) => (
                <motion.div key={note.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => selectNote(note)}
                  className={cn("glass-panel-interactive group mb-1 cursor-pointer rounded-2xl p-3 shadow-xs",
                    COLORS.find((c) => c.key === note.color)?.cls,
                    selected?.id === note.id && "border-white/20 bg-zinc-800/60 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.12)]")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-zinc-100">{note.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400 leading-relaxed font-sans">{note.content || "No content"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {note.isPinned && <Pin className="h-3 w-3 text-zinc-400" />}
                      {note.isFavorite && <Star className="h-3 w-3 text-amber-400" />}
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-zinc-500 font-mono">{formatRelative(note.updatedAt)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="lg:hidden text-white/40 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <NoteColor key={c.key} cls={c.cls} selected={editColor === c.key} onClick={() => setEditColor(c.key)} />
                ))}
              </div>
            </div>

            {/* AI Action Toolbar */}
            <div className="flex items-center gap-1.5 border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md rounded-xl p-1 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-300 px-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-sky-400" /> AI
              </span>
              <button
                onClick={() => handleAiAction("fix_spelling")}
                disabled={aiLoading}
                className="px-2.5 py-1 text-[11px] font-medium text-indigo-200 hover:text-white hover:bg-indigo-500/20 rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                Korrektur
              </button>
              <button
                onClick={() => handleAiAction("summarize")}
                disabled={aiLoading}
                className="px-2.5 py-1 text-[11px] font-medium text-indigo-200 hover:text-white hover:bg-indigo-500/20 rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                Zusammenfassen
              </button>
              <button
                onClick={() => handleAiAction("todo_list")}
                disabled={aiLoading}
                className="px-2.5 py-1 text-[11px] font-medium text-indigo-200 hover:text-white hover:bg-indigo-500/20 rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                + To-Dos
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => updateNote.mutateAsync({ id: selected.id, isPinned: !selected.isPinned })}
                className={cn("rounded-lg p-1.5 transition-colors cursor-pointer", selected.isPinned ? "text-white/70" : "text-white/25 hover:text-white/60")}>
                <Pin className="h-4 w-4" />
              </button>
              <button onClick={() => updateNote.mutateAsync({ id: selected.id, isFavorite: !selected.isFavorite })}
                className={cn("rounded-lg p-1.5 transition-colors cursor-pointer", selected.isFavorite ? "text-yellow-400/70" : "text-white/25 hover:text-white/60")}>
                <Star className="h-4 w-4" />
              </button>
              {isPremium && (
                <button title="Export this note"
                  onClick={() => {
                    const md = `# ${editTitle}\n\n${editContent}`;
                    const blob = new Blob([md], { type: "text/markdown" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${editTitle}.md`; a.click();
                  }}
                  className="rounded-lg p-1.5 text-yellow-400/40 hover:text-yellow-400/80 transition-colors cursor-pointer">
                  <Download className="h-4 w-4" />
                </button>
              )}
              <button title="Copy note as Markdown"
                onClick={() => {
                  const md = `# ${editTitle}\n\n${editContent}`;
                  navigator.clipboard.writeText(md);
                  setNoteCopied(true);
                  setTimeout(() => setNoteCopied(false), 2000);
                }}
                className="rounded-lg p-1.5 text-white/25 hover:text-white/60 transition-colors cursor-pointer">
                {noteCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <button onClick={() => { if (confirm("Delete note?")) deleteNote.mutate(selected.id); }}
                className="rounded-lg p-1.5 text-white/25 hover:text-red-400/70 transition-colors cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 text-xs text-white/20">
                {saving ? <Save className="h-3.5 w-3.5 animate-pulse" /> : <span>✓</span>}
                {saving ? "Saving..." : "Saved"}
              </div>
            </div>
          </div>

          <div className={cn("flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8", COLORS.find((c) => c.key === editColor)?.cls)}>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              className="mb-4 w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/20"
              placeholder="Title..." />

            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[220px] flex-1 resize-none bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20 leading-relaxed font-mono"
              placeholder="Schreibe deinen Text... Tippe [[Notiz-Titel]], um andere Notizen bidirektional zu verknüpfen." />

            {/* Backlinks display panel */}
            {backlinks.length > 0 && (
              <div className="mt-6 border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                  <LinkIcon className="h-3.5 w-3.5 text-sky-400" />
                  Backlinks ({backlinks.length}) — Verknüpfte Notizen
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {backlinks.map((b: any) => (
                    <div
                      key={b.id}
                      onClick={() => selectNote(b)}
                      className="glass-panel-interactive flex items-center justify-between rounded-xl p-3 cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-zinc-200 truncate">{b.title}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 text-xs text-white/20">
              <span>{countWords(editContent)} words</span>
              <span>{editContent.length} characters</span>
              <span>~{Math.ceil(countWords(editContent) / 200)} min read</span>
            </div>

            {/* Note Attachments Component */}
            <NoteFileUpload noteId={selected.id} />
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-white/10" />
            <p className="text-sm text-white/25">Select a note or create a new one</p>
            {!atLimit && (
              <button onClick={handleNew}
                className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white/50 hover:text-white mx-auto transition-colors cursor-pointer">
                <Plus className="h-4 w-4" /> New Note
              </button>
            )}
            {atLimit && (
              <button onClick={() => { setUpgradeReason(`Du hast das Free-Limit von ${FREE_LIMITS.notes} Notizen erreicht. Upgrade für unbegrenzte Notizen.`); setUpgradeOpen(true); }}
                className="mt-4 flex items-center gap-2 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-2 text-sm text-yellow-400/70 hover:bg-yellow-400/10 mx-auto transition-colors cursor-pointer">
                <Crown className="h-4 w-4" /> Upgrade for more notes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
