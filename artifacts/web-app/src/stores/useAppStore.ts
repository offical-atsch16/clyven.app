import { create } from "zustand";

interface AppStore {
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  theme: (localStorage.getItem("clyven-theme") as "dark" | "light") || "dark",
  setTheme: (theme) => {
    localStorage.setItem("clyven-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    set({ theme });
  },
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
