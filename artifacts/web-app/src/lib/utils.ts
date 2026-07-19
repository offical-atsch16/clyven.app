import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function formatRelative(date: string | Date) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hrs ago`;
  if (days < 7) return `${days} days ago`;
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
  "The only way to do great work is to love what you do.",
  "Productivity is never an accident. It is always the result of commitment.",
  "Focus is not what you do — it is what you say no to.",
  "Your time is limited. Don't waste it living someone else's life.",
  "Small daily improvements lead to stunning results.",
  "The art of rest is as important as the art of work.",
];

export function getDailyQuote() {
  const day = new Date().getDay();
  return QUOTES[day % QUOTES.length];
}
