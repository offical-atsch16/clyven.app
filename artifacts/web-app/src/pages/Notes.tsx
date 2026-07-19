import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, FileText, Star, Pin, Trash2, X, Save,
  Download, Zap, Crown,
} from "lucide-react";
import { api } from "../lib/api";
import { cn, countWords, formatRelative } from "../lib/utils";
import { usePremium, FREE_LIMITS } from "../hooks/usePremium";
import { UpgradeModal } from "../components/UpgradeModal";
import { useLocation } from "wouter";

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
      className={cn("h-4 w-4 rounded-full border transition-all", cls, selected ? "border-white/60 scale-110" : "border-white/20")} />
  );
}

export function Notes() {
  const qc = useQueryClient();
  const { isPremium, openUpgrade } = usePremium();
  const [, navigate] = useLocation();

  const { data: notes = [], isLoading } = useQuery({ queryKey: ["notes"], queryFn: api.getNotes, retry: 1 });
  const createNote = useMutation({
    mutationFn: api.createNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
    onError: (e: any) => {
      const body = JSON.parse(e.message || "{}");
      if (body?.error === "LIMIT_REACHED") setUpgradeOpen(true);
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

  const atLimit = !isPremium && notes.length >= FREE_LIMITS.notes;

  const selectNote = (note: any) => {
    setSelected(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color || "default");
  };

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
    if (atLimit) { setUpgradeOpen(true); return; }
    try {
      const note = await createNote.mutateAsync({ title: "New Note", content: "" });
      selectNote(note);
    } catch {}
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

  const filtered = notes.filter((n: any) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const colorCls = COLORS.find((c) => c.key === editColor)?.cls || "";

  return (
    <div className="flex h-full">
      {upgradeOpen && (
        <UpgradeModal
          onClose={() => setUpgradeOpen(false)}
          reason={`You've reached the free limit of ${FREE_LIMITS.notes} notes. Upgrade for unlimited notes.`}
        />
      )}

      {/* Note list */}
      <div className={cn("flex w-full flex-col border-r border-white/[0.06] lg:w-72 xl:w-80", selected && "hidden lg:flex")}>
        <div className="border-b border-white/[0.06] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-sm font-semibold text-white/80">Notes</h1>
            <div className="flex items-center gap-1.5">
              {isPremium && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportMarkdown}
                  title="Export as Markdown"
                  className="flex items-center gap-1 rounded-lg bg-yellow-400/10 border border-yellow-400/20 px-2 py-1.5 text-xs font-medium text-yellow-400/70 hover:bg-yellow-400/20 transition-all">
                  <Download className="h-3 w-3" />
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleNew}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  atLimit
                    ? "bg-yellow-400/10 border border-yellow-400/20 text-yellow-400/70 hover:bg-yellow-400/20"
                    : "bg-white/[0.07] text-white/70 hover:bg-white/10 hover:text-white")}>
                {atLimit ? <><Crown className="h-3.5 w-3.5" /> Limit</> : <><Plus className="h-3.5 w-3.5" /> New</>}
              </motion.button>
            </div>
          </div>

          {/* Limit bar */}
          {!isPremium && (
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-[10px] text-white/25">
                <span>{notes.length}/{FREE_LIMITS.notes} notes</span>
                {atLimit && (
                  <button onClick={() => setUpgradeOpen(true)} className="text-yellow-400/60 hover:text-yellow-400">
                    Upgrade →
                  </button>
                )}
              </div>
              <div className="h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className={cn("h-full rounded-full transition-all", atLimit ? "bg-yellow-400/60" : "bg-white/30")}
                  style={{ width: `${Math.min((notes.length / FREE_LIMITS.notes) * 100, 100)}%` }} />
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white/70 outline-none placeholder:text-white/20 focus:border-white/15 focus:bg-white/[0.05] transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-3 h-8 w-8 text-white/10" />
              <p className="text-sm text-white/25">{search ? "No results" : "No notes yet"}</p>
              {!search && !atLimit && <button onClick={handleNew} className="mt-3 text-xs text-white/40 hover:text-white/70 underline">Create your first note</button>}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((note: any) => (
                <motion.div key={note.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  onClick={() => selectNote(note)}
                  className={cn("group mb-1 cursor-pointer rounded-xl border border-transparent p-3 transition-all hover:border-white/[0.07]",
                    COLORS.find((c) => c.key === note.color)?.cls,
                    selected?.id === note.id && "border-white/[0.1] bg-white/[0.06]")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-white/80">{note.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-white/35 leading-relaxed">{note.content || "No content"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {note.isPinned && <Pin className="h-3 w-3 text-white/30" />}
                      {note.isFavorite && <Star className="h-3 w-3 text-yellow-400/40" />}
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-white/20">{formatRelative(note.updatedAt)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
            <button onClick={() => setSelected(null)} className="lg:hidden text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-1 items-center gap-2">
              {COLORS.map((c) => (
                <NoteColor key={c.key} cls={c.cls} selected={editColor === c.key} onClick={() => setEditColor(c.key)} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateNote.mutateAsync({ id: selected.id, isPinned: !selected.isPinned })}
                className={cn("rounded-lg p-1.5 transition-colors", selected.isPinned ? "text-white/70" : "text-white/25 hover:text-white/60")}>
                <Pin className="h-4 w-4" />
              </button>
              <button onClick={() => updateNote.mutateAsync({ id: selected.id, isFavorite: !selected.isFavorite })}
                className={cn("rounded-lg p-1.5 transition-colors", selected.isFavorite ? "text-yellow-400/70" : "text-white/25 hover:text-white/60")}>
                <Star className="h-4 w-4" />
              </button>
              {isPremium && (
                <button title="Export this note"
                  onClick={() => {
                    const md = `# ${editTitle}\n\n${editContent}`;
                    const blob = new Blob([md], { type: "text/markdown" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${editTitle}.md`; a.click();
                  }}
                  className="rounded-lg p-1.5 text-yellow-400/40 hover:text-yellow-400/80 transition-colors">
                  <Download className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => { if (confirm("Delete note?")) deleteNote.mutate(selected.id); }}
                className="rounded-lg p-1.5 text-white/25 hover:text-red-400/70 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 text-xs text-white/20">
                {saving ? <Save className="h-3.5 w-3.5 animate-pulse" /> : <span>✓</span>}
                {saving ? "Saving..." : "Saved"}
              </div>
            </div>
          </div>

          <div className={cn("flex flex-1 flex-col overflow-hidden p-6 lg:p-8", COLORS.find((c) => c.key === editColor)?.cls)}>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              className="mb-4 w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/20"
              placeholder="Title..." />
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 resize-none bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20 leading-relaxed"
              placeholder="Start writing..." />
            <div className="mt-4 flex items-center gap-4 text-xs text-white/20">
              <span>{countWords(editContent)} words</span>
              <span>{editContent.length} characters</span>
              <span>~{Math.ceil(countWords(editContent) / 200)} min read</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-white/10" />
            <p className="text-sm text-white/25">Select a note or create a new one</p>
            {!atLimit && (
              <button onClick={handleNew}
                className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white/50 hover:text-white mx-auto transition-colors">
                <Plus className="h-4 w-4" /> New Note
              </button>
            )}
            {atLimit && (
              <button onClick={() => setUpgradeOpen(true)}
                className="mt-4 flex items-center gap-2 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-2 text-sm text-yellow-400/70 hover:bg-yellow-400/10 mx-auto transition-colors">
                <Crown className="h-4 w-4" /> Upgrade for more notes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
