import { create } from "zustand";

export type WorkspaceTheme =
  | "pitch-black"
  | "terminal-mono"
  | "subtle-slate"
  | "ascii-matrix"
  | "dotted-blueprint"
  | "oled-contrast"
  | "warm-charcoal"
  | "cyber-amber"
  | "dark"
  | "light";

interface AppStore {
  theme: string;
  setTheme: (t: string) => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  openCommandPalette: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

const getInitialTheme = (): string => {
  const saved = localStorage.getItem("clyven-theme");
  if (saved) {
    if (saved === "dark") return "pitch-black";
    if (saved === "light") return "subtle-slate";
    return saved;
  }
  return "pitch-black";
};

export const useAppStore = create<AppStore>((set) => ({
  theme: getInitialTheme(),
  setTheme: (themeKey) => {
    const normalizedKey = themeKey === "dark" ? "pitch-black" : themeKey === "light" ? "subtle-slate" : themeKey;
    localStorage.setItem("clyven-theme", normalizedKey);
    document.documentElement.setAttribute("data-theme", normalizedKey);
    document.body.setAttribute("data-theme", normalizedKey);
    // Keep Tailwind dark class for standard dark styling compatibility
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    set({ theme: normalizedKey });
  },
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  openCommandPalette: () => set({ commandOpen: true }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
