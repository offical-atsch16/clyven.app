import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });
}

export function formatRelative(date: string | Date) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  if (hrs < 24) return `vor ${hrs} Std.`;
  if (days < 7) return `vor ${days} Tagen`;
  return formatDate(d);
}

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

export const QUOTES = [
  "Der einzige Weg, großartige Arbeit zu leisten, ist, das zu lieben, was man tut.",
  "Produktivität ist niemals ein Zufall. Sie ist immer das Ergebnis eines Engagements.",
  "Fokus ist nicht das, was du tust — es ist das, was du weglässt.",
  "Deine Zeit ist begrenzt. Verschwende sie nicht damit, das Leben eines anderen zu leben.",
  "Kleine tägliche Verbesserungen führen zu atemberaubenden Ergebnissen.",
  "Die Kunst der Ruhe ist ebenso wichtig wie die Kunst der Arbeit.",
];

export function getDailyQuote() {
  const day = new Date().getDay();
  return QUOTES[day % QUOTES.length];
}
