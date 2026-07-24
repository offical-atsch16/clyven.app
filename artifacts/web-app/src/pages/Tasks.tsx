import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, CheckCircle, Calendar, Trash2, X, Edit2,
  ArrowRight, ArrowLeft, Tag, AlertCircle, Sparkles, Filter, Crown
} from "lucide-react";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { usePremium, FREE_LIMITS } from "../hooks/usePremium";
import { UpgradeModal } from "../components/UpgradeModal";

const COLUMNS = [
  { id: "TODO", title: "To Do", color: "border-blue-500/10 bg-blue-500/[0.01]", text: "text-blue-400" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-yellow-500/10 bg-yellow-500/[0.01]", text: "text-yellow-400" },
  { id: "DONE", title: "Completed", color: "border-green-500/10 bg-green-500/[0.01]", text: "text-green-400" }
];

const PRIORITIES = {
  LOW: { label: "Low", color: "bg-blue-400/10 text-blue-400 border-blue-400/15" },
  MEDIUM: { label: "Medium", color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/15" },
  HIGH: { label: "High", color: "bg-red-400/10 text-red-400 border-red-400/15" }
};

export function Tasks() {
  const qc = useQueryClient();
  const { isPremium, openUpgrade } = usePremium();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: api.getTasks,
    retry: 1
  });

  const createTask = useMutation({
    mutationFn: api.createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: any) => {
      try {
        const body = JSON.parse(e.message || "{}");
        if (body?.error === "LIMIT_REACHED") setUpgradeOpen(true);
      } catch {
        setUpgradeOpen(true);
      }
    }
  });

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }: any) => api.updateTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] })
  });

  const deleteTask = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] })
  });

  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const atLimit = !isPremium && tasks.length >= FREE_LIMITS.tasks;

  const handleOpenCreate = () => {
    if (atLimit) {
      setUpgradeOpen(true);
      return;
    }
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setTags([]);
    setTagInput("");
    setFormOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority || "MEDIUM");
    setTags(task.tags || []);
    setTagInput("");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      await updateTask.mutateAsync({
        id: editingTask.id,
        title,
        description,
        priority,
        tags
      });
    } else {
      await createTask.mutateAsync({
        title,
        description,
        status: "TODO",
        priority,
        tags
      });
    }
    setFormOpen(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handleMoveStatus = (id: string, newStatus: string) => {
    updateTask.mutate({ id, status: newStatus });
  };

  // HTML5 drag handlers
  const handleDragStart = (e: any, id: string) => {
    e.dataTransfer?.setData("text/plain", id);
  };

  const handleDrop = (e: any, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer?.getData("text/plain");
    if (id) {
      handleMoveStatus(id, status);
    }
  };

  const filteredTasks = tasks.filter((t: any) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesPriority = filterPriority === "ALL" || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="flex h-full flex-col bg-[#080808] text-white">
      {upgradeOpen && (
        <UpgradeModal
          onClose={() => setUpgradeOpen(false)}
          reason={`You've reached the free limit of ${FREE_LIMITS.tasks} tasks. Upgrade for unlimited tasks.`}
        />
      )}

      {/* Header Panel */}
      <div className="border-b border-white/[0.06] bg-[#0c0c0c]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <h1 className="text-xl font-bold tracking-tight">Kanban-Board</h1>
            </div>
            <p className="text-xs text-white/30 mt-0.5">Planen und organisieren Sie Ihre täglichen Aufgaben per Drag & Drop</p>
          </div>

          <div className="flex items-center gap-3">
            {!isPremium && (
              <div className="mr-2 text-right">
                <div className="text-[10px] text-white/25">
                  {tasks.length}/{FREE_LIMITS.tasks} Aufgaben
                </div>
                <div className="h-1 w-24 overflow-hidden rounded-full bg-white/[0.06] mt-1">
                  <div className={cn("h-full rounded-full transition-all", atLimit ? "bg-yellow-400" : "bg-blue-400")}
                    style={{ width: `${Math.min((tasks.length / FREE_LIMITS.tasks) * 100, 100)}%` }} />
                </div>
              </div>
            )}

            <button onClick={handleOpenCreate}
              className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                atLimit
                  ? "bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/15"
                  : "bg-white text-black hover:bg-white/90"
              )}>
              {atLimit ? <><Crown className="h-3.5 w-3.5" /> Upgrade</> : <><Plus className="h-3.5 w-3.5" /> Neue Aufgabe</>}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Aufgaben durchsuchen..."
              className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] py-2.5 pl-9 pr-4 text-xs text-white/80 outline-none placeholder:text-white/20 focus:border-white/15 focus:bg-white/[0.04] transition-all" />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-white/30 shrink-0" />
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-xs text-white/60 outline-none focus:border-white/15 focus:bg-white/[0.04] cursor-pointer">
              <option value="ALL" className="bg-[#0c0c0c]">Alle Prioritäten</option>
              <option value="LOW" className="bg-[#0c0c0c]">Priorität: Niedrig</option>
              <option value="MEDIUM" className="bg-[#0c0c0c]">Priorität: Mittel</option>
              <option value="HIGH" className="bg-[#0c0c0c]">Priorität: Hoch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="grid h-full min-w-[768px] grid-cols-3 gap-6">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t: any) => t.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.id)}
                className={cn("flex flex-col rounded-2xl border p-4 transition-all", col.color)}
              >
                {/* Column Header */}
                <div className="mb-4 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full",
                      col.id === "TODO" ? "bg-blue-400" : col.id === "IN_PROGRESS" ? "bg-yellow-400" : "bg-green-400"
                    )} />
                    <h2 className="text-sm font-semibold text-white/80">{col.title}</h2>
                  </div>
                  <span className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/40">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task List */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((x) => (
                        <div key={x} className="h-28 animate-pulse rounded-xl bg-white/[0.02] border border-white/[0.04]" />
                      ))}
                    </div>
                  ) : columnTasks.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.05] bg-white/[0.005] p-4 text-center">
                      <p className="text-xs text-white/15">Keine Aufgaben</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {columnTasks.map((task: any) => {
                        const prio = PRIORITIES[task.priority as keyof typeof PRIORITIES] || PRIORITIES.MEDIUM;
                        return (
                          <motion.div
                            key={task.id}
                            layout
                            draggable
                            onDragStart={(e: any) => handleDragStart(e, task.id)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="group relative cursor-grab rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4 shadow-sm hover:border-white/15 hover:bg-[#111111] transition-all active:cursor-grabbing"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-xs font-semibold text-white/90 leading-snug">{task.title}</h3>
                              <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEdit(task)} className="p-1 rounded hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors cursor-pointer">
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button onClick={() => { if (confirm("Aufgabe löschen?")) deleteTask.mutate(task.id); }} className="p-1 rounded hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors cursor-pointer">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {task.description && (
                              <p className="mt-1.5 text-[11px] text-white/40 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            {/* Tags & Meta row */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.04] pt-3">
                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 max-w-[70%]">
                                {task.tags && task.tags.slice(0, 2).map((t: string) => (
                                  <span key={t} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-white/40 flex items-center gap-0.5">
                                    <Tag className="h-2 w-2 text-white/20" /> {t}
                                  </span>
                                ))}
                                {task.tags && task.tags.length > 2 && (
                                  <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-white/25">
                                    +{task.tags.length - 2}
                                  </span>
                                )}
                              </div>

                              {/* Priority Badge */}
                              <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider", prio.color)}>
                                {prio.label}
                              </span>
                            </div>

                            {/* Easy/Accessible column swappers for mobile/tablet */}
                            <div className="mt-3 flex gap-1 items-center justify-end md:hidden">
                              {col.id !== "TODO" && (
                                <button onClick={() => handleMoveStatus(task.id, col.id === "DONE" ? "IN_PROGRESS" : "TODO")}
                                  className="p-1 rounded bg-white/[0.03] text-white/30 hover:bg-white/[0.06] cursor-pointer">
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                              )}
                              {col.id !== "DONE" && (
                                <button onClick={() => handleMoveStatus(task.id, col.id === "TODO" ? "IN_PROGRESS" : "DONE")}
                                  className="p-1 rounded bg-white/[0.03] text-white/30 hover:bg-white/[0.06] cursor-pointer">
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Dialog/Modal Overlay */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0c0c] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">
                {editingTask ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}
              </h2>
              <button onClick={() => setFormOpen(false)} className="rounded-lg p-1 hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/40">Titel</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="z. B. Design System entwerfen"
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/15" />
              </div>

              <div>
                <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/40">Beschreibung</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Zusätzliche Details hinzufügen..." rows={3}
                  className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/15" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/40">Priorität</label>
                  <select value={priority} onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-white/15 cursor-pointer">
                    <option value="LOW" className="bg-[#0c0c0c]">Niedrig</option>
                    <option value="MEDIUM" className="bg-[#0c0c0c]">Mittel</option>
                    <option value="HIGH" className="bg-[#0c0c0c]">Hoch</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/40">Tags hinzufügen</label>
                  <div className="flex gap-1">
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Marketing..."
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                      className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/15" />
                    <button type="button" onClick={handleAddTag} className="rounded-xl bg-white/[0.06] px-3 py-2.5 text-xs hover:bg-white/[0.1] cursor-pointer">
                      +
                    </button>
                  </div>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 border-t border-white/[0.04] pt-3">
                  {tags.map((t) => (
                    <span key={t} className="rounded bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-white/50 flex items-center gap-1 border border-white/[0.03]">
                      {t}
                      <button type="button" onClick={() => handleRemoveTag(t)} className="text-white/20 hover:text-red-400">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <button type="submit"
                className="w-full rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-white/90 transition-all cursor-pointer">
                {editingTask ? "Aufgabe aktualisieren" : "Aufgabe erstellen"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
