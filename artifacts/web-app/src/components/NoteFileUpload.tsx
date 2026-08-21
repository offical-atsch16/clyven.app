import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Trash2, Download, AlertCircle, Lock, Crown, Zap, Check } from "lucide-react";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { usePremium } from "../hooks/usePremium";
import { UpgradeModal } from "./UpgradeModal";

interface Props {
  noteId: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function NoteFileUpload({ noteId }: Props) {
  const qc = useQueryClient();
  const { planTier, openUpgrade } = usePremium();
  const [dragActive, setDragActive] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["note-attachments", noteId],
    queryFn: () => api.getNoteAttachments(noteId),
    enabled: !!noteId,
  });

  const createAttachment = useMutation({
    mutationFn: (data: any) => api.createNoteAttachment(noteId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["note-attachments", noteId] });
      setErrorMessage("");
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Upload fehlgeschlagen.");
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) => api.deleteNoteAttachment(noteId, attachmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["note-attachments", noteId] }),
  });

  const maxFileBytes = planTier === "business" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  const isFree = planTier === "free";

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (isFree) {
      setUpgradeOpen(true);
      return;
    }

    setErrorMessage("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > maxFileBytes) {
        setErrorMessage(
          `Datei "${file.name}" ist zu groß (${formatBytes(file.size)}). Max. ${planTier === "business" ? "100 MB" : "10 MB"}.`
        );
        continue;
      }

      // Create attachment payload
      const objectUrl = URL.createObjectURL(file);
      await createAttachment.mutateAsync({
        fileName: file.name,
        fileUrl: objectUrl,
        fileSize: file.size,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="mt-6 border-t border-white/[0.08] pt-4">
      {upgradeOpen && (
        <UpgradeModal
          onClose={() => setUpgradeOpen(false)}
          reason="Dateiuploads in Notizen stehen erst ab dem Plus-Tarif zur Verfügung."
        />
      )}

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
            Dateianhänge
          </h3>
          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/40">
            {attachments.length}
          </span>
        </div>

        <span className="text-[10px] text-white/30">
          {isFree
            ? "Uploads gesperrt (Free-Tarif)"
            : planTier === "business"
            ? "Max. 100 MB pro Datei (Business)"
            : "Max. 10 MB pro Datei (Plus)"}
        </span>
      </div>

      {/* Free Tier Upgrade Banner */}
      {isFree ? (
        <div
          onClick={() => setUpgradeOpen(true)}
          className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 cursor-pointer hover:bg-amber-500/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400">Dateianhänge freischalten</p>
              <p className="text-[11px] text-white/40">Upgrade auf Plus oder Business für Dateiuploads in deinen Notizen.</p>
            </div>
          </div>
          <button className="rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 group-hover:bg-amber-500/30 transition-colors">
            Upgrade →
          </button>
        </div>
      ) : (
        /* Drag and Drop Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer",
            dragActive
              ? "border-amber-400 bg-amber-500/[0.08]"
              : "border-white/[0.1] bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]"
          )}
        >
          <input
            type="file"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />

          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-white/60">
            <Upload className="h-5 w-5 text-amber-400" />
          </div>

          <p className="text-xs font-semibold text-white/80">
            Dateien hierher ziehen oder <span className="text-amber-400 underline">durchsuchen</span>
          </p>
          <p className="mt-1 text-[10px] text-white/30">
            {planTier === "business" ? "Bis zu 100 MB pro Datei" : "Bis zu 10 MB pro Datei"}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-xl">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachments.map((att: any) => (
            <div
              key={att.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#111111] p-3 text-xs hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileText className="h-4 w-4 shrink-0 text-amber-400/80" />
                <div className="overflow-hidden">
                  <p className="truncate font-semibold text-white/80">{att.fileName}</p>
                  <p className="text-[10px] text-white/30">{formatBytes(att.fileSize)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={att.fileUrl}
                  download={att.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors"
                  title="Herunterladen"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => deleteAttachment.mutate(att.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                  title="Löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
