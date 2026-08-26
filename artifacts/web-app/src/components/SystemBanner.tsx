import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "../lib/utils";
import { api } from "../lib/api";

export function SystemBanner() {
  const [banner, setBanner] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    fetchActiveBanner();
  }, [location]);

  async function fetchActiveBanner() {
    try {
      const res = await api.getActiveBanner(location);
      if (res && res.banner) {
        setBanner(res.banner);
        setDismissed(false);
      } else {
        setBanner(null);
      }
    } catch {
      setBanner(null);
    }
  }

  if (!banner || dismissed) return null;

  const typeStyles: Record<string, { bg: string; border: string; text: string; icon: any }> = {
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-300",
      icon: Info,
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-300",
      icon: AlertTriangle,
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-300",
      icon: AlertCircle,
    },
    success: {
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      text: "text-green-300",
      icon: CheckCircle2,
    },
  };

  const style = typeStyles[banner.type] || typeStyles.info;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 border-b px-4 py-2.5 text-xs transition-all z-40",
        style.bg,
        style.border,
        style.text
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-4 w-4 shrink-0" />
        <div className="truncate">
          <strong className="font-semibold mr-1.5">{banner.title}</strong>
          <span className="opacity-90">{banner.message}</span>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-white/10 transition-all shrink-0"
        title="Banner schließen"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
