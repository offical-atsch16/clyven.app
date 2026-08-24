import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, CheckCircle, Calendar, Trash2, X, Edit2,
  ArrowRight, ArrowLeft, Tag, Sparkles, Filter, Crown, Play, Pause,
  Clock, ListTodo, LayoutGrid, BarChart2, CheckSquare, Square,
  Lock, PlusCircle, AlignLeft, ShieldAlert
} from "lucide-react";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { usePremium, FREE_LIMITS } from "../hooks/usePremium";
import { UpgradeModal } from "../components/UpgradeModal";
import { PlanBadge } from "../components/PlanBadge";

const COLUMNS = [
  { id: "TODO", title: "To Do", color: "border-blue-500/20 bg-blue-500/[0.03] backdrop-blur-md", text: "text-blue-400", dot: "glow-dot-blue" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-amber-500/20 bg-amber-500/[0.03] backdrop-blur-md", text: "text-amber-400", dot: "glow-dot-amber" },
  { id: "DONE", title: "Completed", color: "border-emerald-500/20 bg-emerald-500/[0.03] backdrop-blur-md", text: "text-emerald-400", dot: "glow-dot-emerald" }
];

const PRIORITIES = {
  LOW: { label: "Niedrig", color: "bg-blue-400/10 text-blue-300 border-blue-400/20", dot: "glow-dot-blue" },
  MEDIUM: { label: "Mittel", color: "bg-amber-400/10 text-amber-300 border-amber-400/20", dot: "glow-dot-amber" },
  HIGH: { label: "Hoch", color: "bg-rose-400/10 text-rose-300 border-rose-400/20", dot: "glow-dot-rose" }
};

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "dropdown";
  value: string;
  options?: string[];
}

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

export function Tasks() {
  const qc = useQueryClient();
  const { isPremium, planTier, openUpgrade } = usePremium();

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

  const [view, setView] = useState<"list" | "kanban" | "gantt">("list");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [status, setStatus] = useState<string>("TODO");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Business Fields
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "date" | "dropdown">("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Active Timer Ref
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const atLimit = !isPremium && tasks.length >= FREE_LIMITS.tasks;

  const triggerUpgrade = (reasonMessage: string) => {
    setUpgradeReason(reasonMessage);
    setUpgradeOpen(true);
  };

  const handleSwitchView = (targetView: "list" | "kanban" | "gantt") => {
    if (targetView !== "list" && !isPremium) {
      triggerUpgrade(
        targetView === "kanban"
          ? "Das Kanban-Board ist exklusiv im CLYVEN PLUS Tarif verfügbar."
          : "Das Gantt-Diagramm ist exklusiv im CLYVEN PLUS Tarif verfügbar."
      );
      return;
    }
    setView(targetView);
  };

  const handleOpenCreate = () => {
    if (atLimit) {
      triggerUpgrade(`Du hast das Free-Limit von ${FREE_LIMITS.tasks} Aufgaben erreicht.`);
      return;
    }
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setStatus("TODO");
    setTags([]);
    setTagInput("");
    setSubtasks([]);
    setTimeSpent(0);
    setIsTimerRunning(false);
    setCustomFields([]);
    setStartDate("");
    setDueDate("");
    setFormOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority || "MEDIUM");
    setStatus(task.status || "TODO");
    setTags(task.tags || []);
    setTagInput("");
    setSubtasks(task.subtasks || []);
    setTimeSpent(task.timeSpent || 0);
    setIsTimerRunning(false);
    setCustomFields(task.customFields || []);
    setStartDate(task.startDate || "");
    setDueDate(task.dueDate || "");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskPayload = {
      title,
      description,
      status,
      priority,
      tags,
      subtasks: isPremium ? subtasks : [],
      timeSpent: isPremium ? timeSpent : 0,
      customFields: isPremium ? customFields : [],
      startDate: isPremium ? startDate : null,
      dueDate: isPremium ? dueDate : null,
    };

    if (editingTask) {
      await updateTask.mutateAsync({
        id: editingTask.id,
        ...taskPayload,
      });
    } else {
      await createTask.mutateAsync(taskPayload);
    }
    setFormOpen(false);
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    if (!isPremium) {
      triggerUpgrade("Unteraufgaben (Subtasks) sind ein exklusives CLYVEN PLUS Feature.");
      return;
    }
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: "sub-" + Date.now(), title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (id: string) => {
    if (!isPremium) {
      triggerUpgrade("Unteraufgaben (Subtasks) sind ein exklusives CLYVEN PLUS Feature.");
      return;
    }
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  // Time tracking handlers
  const handleAddManualTime = () => {
    if (!isPremium) {
      triggerUpgrade("Zeiterfassung ist ein exklusives CLYVEN PLUS Feature.");
      return;
    }
    const mins = parseInt(manualMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      setTimeSpent((prev) => prev + mins * 60);
      setManualMinutes("");
    }
  };

  // Custom Fields handlers
  const handleAddCustomField = () => {
    if (!isPremium) {
      triggerUpgrade("Benutzerdefinierte Felder sind ein exklusives CLYVEN PLUS Feature.");
      return;
    }
    if (!newFieldName.trim()) return;
    const opts = newFieldType === "dropdown" ? newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean) : [];
    setCustomFields([
      ...customFields,
      {
        id: "cf-" + Date.now(),
        name: newFieldName.trim(),
        type: newFieldType,
        value: opts[0] || "",
        options: opts,
      },
    ]);
    setNewFieldName("");
    setNewFieldOptions("");
  };

  const handleUpdateCustomFieldValue = (id: string, val: string) => {
    setCustomFields(
      customFields.map((cf) => (cf.id === id ? { ...cf, value: val } : cf))
    );
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter((cf) => cf.id !== id));
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

  // Drag & drop handlers
  const handleDragStart = (e: any, id: string) => {
    e.dataTransfer?.setData("text/plain", id);
  };

  const handleDrop = (e: any, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer?.getData("text/plain");
    if (id) {
      handleMoveStatus(id, newStatus);
    }
  };

  const filteredTasks = tasks.filter((t: any) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesPriority = filterPriority === "ALL" || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="flex h-full flex-col bg-[#080808] text-white">
      {upgradeOpen && (
        <UpgradeModal
          onClose={() => setUpgradeOpen(false)}
          reason={upgradeReason || `Upgrade deinen Tarif auf CLYVEN PLUS für unbegrenzte Aufgaben und erweiterte Features.`}
        />
      )}

      {/* Top Header */}
      <div className="border-b border-white/[0.06] bg-zinc-950/70 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">Aufgabenverwaltung</h1>
              <PlanBadge tier={planTier} size="sm" showFree />
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Verwalte deine To-Dos, erfasse Arbeitszeiten und behalte den Überblick in der Listen-, Kanban- oder Gantt-Ansicht.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isPremium && (
              <div className="mr-2 text-right">
                <div className="text-[10px] text-zinc-400 font-mono">
                  {tasks.length}/{FREE_LIMITS.tasks} Aufgaben
                </div>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06] mt-1 border border-white/[0.04]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      atLimit ? "bg-amber-400" : "bg-gradient-to-r from-indigo-400 to-sky-400"
                    )}
                    style={{ width: `${Math.min((tasks.length / FREE_LIMITS.tasks) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleOpenCreate}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-md",
                atLimit
                  ? "bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                  : "btn-liquid-primary"
              )}
            >
              {atLimit ? (
                <>
                  <Crown className="h-3.5 w-3.5 text-amber-400" /> Upgrade
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Neue Aufgabe
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters & View Switcher Bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* View Switcher Tabs */}
          <div className="flex rounded-xl glass-panel p-1 shrink-0">
            <button
              onClick={() => handleSwitchView("list")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95",
                view === "list" ? "bg-white/10 text-zinc-100 border border-white/10 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <ListTodo className="h-3.5 w-3.5" /> Listenansicht
            </button>

            <button
              onClick={() => handleSwitchView("kanban")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 relative",
                view === "kanban" ? "bg-white/10 text-zinc-100 border border-white/10 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban-Board
              {!isPremium && <Lock className="h-3 w-3 text-amber-400 shrink-0" />}
            </button>

            <button
              onClick={() => handleSwitchView("gantt")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 relative",
                view === "gantt" ? "bg-white/10 text-zinc-100 border border-white/10 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <BarChart2 className="h-3.5 w-3.5" /> Gantt-Diagramm
              {!isPremium && <Lock className="h-3 w-3 text-amber-400 shrink-0" />}
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Aufgaben durchsuchen..."
                className="glass-input w-full rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-200 outline-none placeholder:text-zinc-500 transition-all"
              />
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900">Alle Prio</option>
              <option value="LOW" className="bg-zinc-900">Prio: Niedrig</option>
              <option value="MEDIUM" className="bg-zinc-900">Prio: Mittel</option>
              <option value="HIGH" className="bg-zinc-900">Prio: Hoch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area based on View */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((x) => (
              <div key={x} className="h-16 animate-pulse rounded-xl bg-white/[0.02] border border-white/[0.04]" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.005] p-8 text-center">
            <CheckSquare className="h-10 w-10 text-white/10 mb-3" />
            <p className="text-sm font-medium text-white/40">Keine Aufgaben vorhanden</p>
            {!atLimit && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-semibold hover:bg-white/10 cursor-pointer transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Erstelle deine erste Aufgabe
              </button>
            )}
          </div>
        ) : view === "list" ? (
          /* ================= LISTENANSICHT (LIST VIEW) ================= */
          <div className="space-y-3 max-w-4xl mx-auto">
            {filteredTasks.map((task: any) => {
              const prio = PRIORITIES[task.priority as keyof typeof PRIORITIES] || PRIORITIES.MEDIUM;
              const subtaskCount = task.subtasks?.length || 0;
              const subtaskDone = task.subtasks?.filter((st: any) => st.completed).length || 0;

              return (
                <div
                  key={task.id}
                  className="glass-panel-interactive group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() =>
                        handleMoveStatus(
                          task.id,
                          task.status === "DONE" ? "TODO" : "DONE"
                        )
                      }
                      className="mt-0.5 text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer active:scale-95"
                    >
                      {task.status === "DONE" ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold transition-all",
                            task.status === "DONE"
                              ? "line-through text-zinc-500"
                              : "text-zinc-100"
                          )}
                        >
                          {task.title}
                        </span>
                        <span
                          className={cn(
                            "status-pill border text-[10px] uppercase font-semibold shrink-0",
                            prio.color
                          )}
                        >
                          <span className={cn(prio.dot, "shrink-0")} />
                          {prio.label}
                        </span>
                      </div>

                      {task.description && (
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks & Time Spent Badge Row */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                        {subtaskCount > 0 && (
                          <span className="status-pill text-[10px] text-zinc-300">
                            <CheckSquare className="h-3 w-3 text-indigo-400 shrink-0" />
                            {subtaskDone}/{subtaskCount} Subtasks
                          </span>
                        )}

                        {task.timeSpent > 0 && (
                          <span className="status-pill text-[10px] text-amber-300">
                            <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                            {formatDuration(task.timeSpent)}
                          </span>
                        )}

                        {task.tags && task.tags.map((t: string) => (
                          <span key={t} className="flex items-center gap-1 text-[10px] text-zinc-400">
                            <Tag className="h-2.5 w-2.5 text-zinc-500" /> #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-zinc-300 hover:text-zinc-100 active:scale-95 transition-all cursor-pointer border border-white/[0.06]"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Aufgabe wirklich löschen?")) deleteTask.mutate(task.id);
                      }}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === "kanban" ? (
          /* ================= KANBAN BOARD (CLYVEN PLUS ONLY) ================= */
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
                  <div className="mb-4 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          col.id === "TODO"
                            ? "bg-blue-400"
                            : col.id === "IN_PROGRESS"
                            ? "bg-yellow-400"
                            : "bg-green-400"
                        )}
                      />
                      <h2 className="text-sm font-semibold text-white/80">{col.title}</h2>
                    </div>
                    <span className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/40">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {columnTasks.map((task: any) => {
                      const prio = PRIORITIES[task.priority as keyof typeof PRIORITIES] || PRIORITIES.MEDIUM;
                      const subtaskCount = task.subtasks?.length || 0;
                      const subtaskDone = task.subtasks?.filter((st: any) => st.completed).length || 0;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e: any) => handleDragStart(e, task.id)}
                          className="group relative cursor-grab rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4 shadow-sm hover:border-white/15 hover:bg-[#111111] transition-all active:cursor-grabbing"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xs font-semibold text-white/90 leading-snug">{task.title}</h3>
                            <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenEdit(task)} className="p-1 rounded hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors cursor-pointer">
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button onClick={() => { if (confirm("Löschen?")) deleteTask.mutate(task.id); }} className="p-1 rounded hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors cursor-pointer">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="mt-1.5 text-[11px] text-white/40 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Extra Indicators */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-white/40">
                            {subtaskCount > 0 && (
                              <span className="flex items-center gap-1 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.04]">
                                <CheckSquare className="h-2.5 w-2.5 text-indigo-400" />
                                {subtaskDone}/{subtaskCount}
                              </span>
                            )}
                            {task.timeSpent > 0 && (
                              <span className="flex items-center gap-1 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.04] text-amber-400/80">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDuration(task.timeSpent)}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-2">
                            <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider", prio.color)}>
                              {prio.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= GANTT DIAGRAMM (CLYVEN PLUS ONLY) ================= */
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0c] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" /> Gantt Timeline / Zeitleiste
                </h2>
                <p className="text-xs text-white/40 mt-0.5">Visuelle Übersicht aller Aufgaben mit Zeitplan und Fortschritt</p>
              </div>
              <PlanBadge tier="business" size="sm" />
            </div>

            <div className="space-y-4">
              {filteredTasks.map((task: any) => {
                const subtaskCount = task.subtasks?.length || 0;
                const subtaskDone = task.subtasks?.filter((st: any) => st.completed).length || 0;
                const progressPct = subtaskCount > 0 ? Math.round((subtaskDone / subtaskCount) * 100) : task.status === "DONE" ? 100 : task.status === "IN_PROGRESS" ? 50 : 0;

                return (
                  <div key={task.id} className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/90">{task.title}</span>
                        <span className="text-[10px] text-white/40 bg-white/[0.05] px-2 py-0.5 rounded-full">{task.status}</span>
                      </div>
                      <div className="text-[10px] text-white/40 flex items-center gap-3">
                        <span>Start: {task.startDate || "Heute"}</span>
                        <span>Fällig: {task.dueDate || "Keine Frist"}</span>
                        <span className="text-amber-400 font-semibold">{progressPct}% Fertig</span>
                      </div>
                    </div>

                    {/* Timeline Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06] relative">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          task.status === "DONE" ? "bg-green-400" : "bg-gradient-to-r from-indigo-500 to-amber-400"
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Task Creation & Editing Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.1] bg-[#0d0d0d] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  {editingTask ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}
                </h2>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1 hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Fields */}
              <div>
                <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/40">Titel *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="z. B. Quartalsbericht fertigstellen"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/40">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Zusätzliche Details hinzufügen..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/40">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 cursor-pointer"
                  >
                    <option value="TODO" className="bg-[#0c0c0c]">To Do</option>
                    <option value="IN_PROGRESS" className="bg-[#0c0c0c]">In Progress</option>
                    <option value="DONE" className="bg-[#0c0c0c]">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/40">Priorität</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 cursor-pointer"
                  >
                    <option value="LOW" className="bg-[#0c0c0c]">Niedrig</option>
                    <option value="MEDIUM" className="bg-[#0c0c0c]">Mittel</option>
                    <option value="HIGH" className="bg-[#0c0c0c]">Hoch</option>
                  </select>
                </div>
              </div>

              {/* Tagging */}
              <div>
                <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/40">Tags</label>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Tag Name..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-xl bg-white/[0.08] px-3 py-2 text-xs font-semibold hover:bg-white/[0.12] cursor-pointer"
                  >
                    + Hinzufügen
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <span key={t} className="rounded bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/60 flex items-center gap-1 border border-white/[0.04]">
                        {t}
                        <button type="button" onClick={() => handleRemoveTag(t)} className="text-white/30 hover:text-red-400">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ================= CLYVEN PLUS FEATURES ================= */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5" /> Plus Features
                  </span>
                  {!isPremium && <PlanBadge tier="business" size="sm" />}
                </div>

                {/* 1. Unteraufgaben (Subtasks) */}
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase font-bold tracking-wider text-white/50">
                    Unteraufgaben (Subtasks)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder={isPremium ? "Neue Unteraufgabe eingeben..." : "Nur im CLYVEN PLUS Tarif verfügbar"}
                      disabled={!isPremium}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="rounded-xl bg-amber-500/20 text-amber-400 px-3 py-2 text-xs font-bold hover:bg-amber-500/30 cursor-pointer disabled:opacity-50"
                    >
                      + Hinzufügen
                    </button>
                  </div>

                  {subtasks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {subtasks.map((st) => (
                        <div key={st.id} className="flex items-center justify-between bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          <button
                            type="button"
                            onClick={() => handleToggleSubtask(st.id)}
                            className="flex items-center gap-2 text-xs text-white/80"
                          >
                            {st.completed ? (
                              <CheckSquare className="h-3.5 w-3.5 text-green-400 shrink-0" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-white/30 shrink-0" />
                            )}
                            <span className={st.completed ? "line-through text-white/30" : ""}>{st.title}</span>
                          </button>
                          <button type="button" onClick={() => handleRemoveSubtask(st.id)} className="text-white/20 hover:text-red-400">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Zeiterfassung (Time Tracking) */}
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase font-bold tracking-wider text-white/50 flex items-center justify-between">
                    <span>Zeiterfassung (Timer & Log)</span>
                    <span className="text-amber-400 font-bold">{formatDuration(timeSpent)} Gesamt</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPremium) {
                          triggerUpgrade("Zeiterfassung ist ein exklusives CLYVEN PLUS Feature.");
                          return;
                        }
                        setIsTimerRunning(!isTimerRunning);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer",
                        isTimerRunning ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                      )}
                    >
                      {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {isTimerRunning ? "Timer Stoppen" : "Timer Starten"}
                    </button>

                    <div className="flex gap-1 flex-1">
                      <input
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(e.target.value)}
                        placeholder="Min. manuell"
                        type="number"
                        disabled={!isPremium}
                        className="w-24 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-xs text-white outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualTime}
                        className="rounded-xl bg-white/[0.08] px-3 py-2 text-xs font-semibold hover:bg-white/[0.12] cursor-pointer disabled:opacity-50"
                      >
                        + Min
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Custom Fields */}
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase font-bold tracking-wider text-white/50">
                    Benutzerdefinierte Felder (Custom Fields)
                  </label>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="Feldname (z. B. Budget)"
                        disabled={!isPremium}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white outline-none disabled:opacity-50"
                      />
                      <select
                        value={newFieldType}
                        onChange={(e: any) => setNewFieldType(e.target.value)}
                        disabled={!isPremium}
                        className="rounded-xl border border-white/[0.08] bg-[#0c0c0c] px-2 py-2 text-xs text-white outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="text">Text</option>
                        <option value="number">Zahl</option>
                        <option value="date">Datum</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                    </div>

                    {newFieldType === "dropdown" && (
                      <input
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="Optionen komma-getrennt (z. B. Offen, In Arbeit, Fertig)"
                        disabled={!isPremium}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white outline-none disabled:opacity-50"
                      />
                    )}

                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="self-start rounded-xl bg-amber-500/20 text-amber-400 px-3 py-1.5 text-xs font-bold hover:bg-amber-500/30 cursor-pointer disabled:opacity-50"
                    >
                      + Feld hinzufügen
                    </button>
                  </div>

                  {customFields.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {customFields.map((cf) => (
                        <div key={cf.id} className="flex items-center gap-2 bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                          <span className="text-xs font-bold text-white/60 min-w-[80px]">{cf.name}:</span>
                          {cf.type === "dropdown" ? (
                            <select
                              value={cf.value}
                              onChange={(e) => handleUpdateCustomFieldValue(cf.id, e.target.value)}
                              className="flex-1 rounded-lg border border-white/[0.08] bg-[#0c0c0c] px-2 py-1 text-xs text-white outline-none"
                            >
                              {(cf.options || []).map((o) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={cf.type === "number" ? "number" : cf.type === "date" ? "date" : "text"}
                              value={cf.value}
                              onChange={(e) => handleUpdateCustomFieldValue(cf.id, e.target.value)}
                              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-white outline-none"
                            />
                          )}
                          <button type="button" onClick={() => handleRemoveCustomField(cf.id)} className="text-white/20 hover:text-red-400">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Timeline Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/50">Startdatum</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={!isPremium}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white outline-none disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase font-bold tracking-wider text-white/50">Fälligkeitsdatum</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={!isPremium}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-white/90 transition-all cursor-pointer"
              >
                {editingTask ? "Aufgabe aktualisieren" : "Aufgabe erstellen"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
