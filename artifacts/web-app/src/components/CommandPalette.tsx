import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, Timer, BookOpen, Bookmark, BarChart2, FileText,
  Sun, Moon, Search, LayoutDashboard, Trophy
} from "lucide-react";
import { useAppStore } from "../stores/useAppStore";
import { api } from "../lib/api";

export function CommandPalette() {
  const { commandOpen, setCommandOpen, theme, setTheme } = useAppStore();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  const { data: notes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: api.getNotes,
    enabled: commandOpen,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandOpen, setCommandOpen]);

  useEffect(() => {
    if (!commandOpen) setQuery("");
  }, [commandOpen]);

  const run = (fn: () => void) => {
    fn();
    setCommandOpen(false);
  };

  const go = (path: string) => run(() => navigate(path));

  const filteredNotes = notes.filter((n: any) =>
    n.title?.toLowerCase().includes(query.toLowerCase()) ||
    n.content?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {commandOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            onClick={() => setCommandOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl"
            >
              <Command label="Clyven Command Palette" className="flex flex-col">
                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 bg-black/40">
                  <Search className="h-4 w-4 text-sky-400 shrink-0" />
                  <Command.Input
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search notes, commands, or views (Cmd + K)..."
                    className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500 font-medium"
                  />
                  <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 font-mono">ESC</kbd>
                </div>

                <Command.List className="max-h-80 overflow-y-auto p-2">
                  <Command.Empty className="py-8 text-center text-sm text-white/30">
                    No results for "{query}"
                  </Command.Empty>

                  {filteredNotes.length > 0 && (
                    <CmdGroup heading="Notes & Knowledge Base">
                      {filteredNotes.slice(0, 5).map((note: any) => (
                        <CmdItem
                          key={note.id}
                          icon={<FileText className="h-4 w-4 text-sky-400" />}
                          label={note.title || "Untitled Note"}
                          sublabel={note.content ? note.content.slice(0, 40) + "..." : "Empty Note"}
                          onSelect={() => go(`/notes?id=${note.id}`)}
                        />
                      ))}
                    </CmdGroup>
                  )}

                  <CmdGroup heading="Navigation">
                    <CmdItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" onSelect={() => go("/dashboard")} />
                    <CmdItem icon={<FileText className="h-4 w-4" />} label="Notes & Second Brain" onSelect={() => go("/notes")} />
                    <CmdItem icon={<Bookmark className="h-4 w-4" />} label="Bookmarks Vault" onSelect={() => go("/bookmarks")} />
                    <CmdItem icon={<Timer className="h-4 w-4" />} label="Focus Timer & Ambience" onSelect={() => go("/focus")} />
                    <CmdItem icon={<BookOpen className="h-4 w-4" />} label="Daily Journal & AI Insights" onSelect={() => go("/journal")} />
                    <CmdItem icon={<BarChart2 className="h-4 w-4" />} label="Analytics & Stats" onSelect={() => go("/analytics")} />
                    <CmdItem icon={<Trophy className="h-4 w-4" />} label="Achievements" onSelect={() => go("/achievements")} />
                  </CmdGroup>

                  <CmdGroup heading="Actions">
                    <CmdItem icon={<Plus className="h-4 w-4" />} label="Create New Note" onSelect={() => go("/notes?new=1")} />
                    <CmdItem icon={<Bookmark className="h-4 w-4" />} label="Save New Bookmark" onSelect={() => go("/bookmarks?new=1")} />
                    <CmdItem icon={<Timer className="h-4 w-4" />} label="Start Focus Session" onSelect={() => go("/focus?start=1")} />
                  </CmdGroup>

                  <CmdGroup heading="Appearance">
                    <CmdItem
                      icon={theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      label={theme === "dark" ? "Activate Light Mode" : "Activate Dark Mode"}
                      onSelect={() => run(() => setTheme(theme === "dark" ? "light" : "dark"))}
                    />
                  </CmdGroup>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function CmdGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-sky-400 [&_[cmdk-group-heading]]:uppercase"
    >
      {children}
    </Command.Group>
  );
}

function CmdItem({
  icon,
  label,
  sublabel,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100 data-[selected=true]:bg-white/10 data-[selected=true]:text-zinc-100 transition-all outline-none my-0.5"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="text-zinc-400 shrink-0">{icon}</span>
        <span className="truncate font-medium">{label}</span>
      </div>
      {sublabel && (
        <span className="text-xs text-zinc-500 truncate ml-4 font-mono">{sublabel}</span>
      )}
    </Command.Item>
  );
}
