import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Plus, Timer, BookOpen, Bookmark, BarChart2, FileText,
  Sun, Moon, Search, LayoutDashboard, Trophy,
} from "lucide-react";
import { useAppStore } from "../stores/useAppStore";

export function CommandPalette() {
  const { commandOpen, setCommandOpen, theme, setTheme } = useAppStore();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!commandOpen) setQuery("");
  }, [commandOpen]);

  const run = (fn: () => void) => {
    fn();
    setCommandOpen(false);
  };

  const go = (path: string) => run(() => navigate(path));

  return (
    <AnimatePresence>
      {commandOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setCommandOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl"
            >
              <Command label="Clyven" className="flex flex-col">
                <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
                  <Search className="h-4 w-4 text-white/30 shrink-0" />
                  <Command.Input
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search or enter a command..."
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                  />
                  <kbd className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/20">ESC</kbd>
                </div>

                <Command.List className="max-h-72 overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-white/30">
                    No results found
                  </Command.Empty>

                  <CmdGroup heading="Navigation">
                    <CmdItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" onSelect={() => go("/dashboard")} />
                    <CmdItem icon={<FileText className="h-4 w-4" />} label="Notes" onSelect={() => go("/notes")} />
                    <CmdItem icon={<Bookmark className="h-4 w-4" />} label="Bookmarks" onSelect={() => go("/bookmarks")} />
                    <CmdItem icon={<Timer className="h-4 w-4" />} label="Start Focus" onSelect={() => go("/focus")} />
                    <CmdItem icon={<BookOpen className="h-4 w-4" />} label="Open Journal" onSelect={() => go("/journal")} />
                    <CmdItem icon={<BarChart2 className="h-4 w-4" />} label="Analytics" onSelect={() => go("/analytics")} />
                    <CmdItem icon={<Trophy className="h-4 w-4" />} label="Achievements" onSelect={() => go("/achievements")} />
                  </CmdGroup>

                  <CmdGroup heading="Actions">
                    <CmdItem icon={<Plus className="h-4 w-4" />} label="New Note" onSelect={() => go("/notes?new=1")} />
                    <CmdItem icon={<Bookmark className="h-4 w-4" />} label="New Bookmark" onSelect={() => go("/bookmarks?new=1")} />
                    <CmdItem icon={<Timer className="h-4 w-4" />} label="Start Focus" onSelect={() => go("/focus?start=1")} />
                  </CmdGroup>

                  <CmdGroup heading="Design">
                    <CmdItem
                      icon={theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      label={theme === "dark" ? "Enable Light Mode" : "Enable Dark Mode"}
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
      className="[&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-white/25 [&_[cmdk-group-heading]]:uppercase"
    >
      {children}
    </Command.Group>
  );
}

function CmdItem({ icon, label, onSelect }: { icon: React.ReactNode; label: string; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white data-[selected=true]:bg-white/[0.06] data-[selected=true]:text-white transition-colors outline-none"
    >
      <span className="text-white/40">{icon}</span>
      {label}
    </Command.Item>
  );
}
