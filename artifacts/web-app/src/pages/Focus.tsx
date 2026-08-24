import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, RotateCcw, Timer, CircleCheck as CheckCircle, Flame, Clock, Volume2, VolumeX, CloudRain, Music, Radio } from "lucide-react";
import { api } from "../lib/api";
import { cn, formatMinutes } from "../lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const MODES = [
  { key: "pomodoro", label: "Pomodoro", work: 25, break: 5 },
  { key: "short", label: "Short", work: 15, break: 3 },
  { key: "deep", label: "Deep Work", work: 50, break: 10 },
  { key: "custom", label: "Custom", work: 30, break: 5 },
];

const AMBIENT_SOUNDS = [
  { key: "rain", label: "Rain", icon: CloudRain, url: `${basePath}/sounds/rain.mp3` },
  { key: "lofi", label: "Lofi", icon: Music, url: `${basePath}/sounds/lofi.mp3` },
  { key: "white-noise", label: "White Noise", icon: Radio, url: `${basePath}/sounds/white-noise.mp3` },
];

const MOTIVATIONS = [
  "Every minute counts. You've got this! 🚀",
  "Deep focus — in the flow state. ⚡",
  "Concentration is a superpower. 🧠",
  "Productivity is a choice. ✨",
  "This block moves you forward. 🎯",
];

export function Focus() {
  const qc = useQueryClient();
  const { data: focusData } = useQuery({ queryKey: ["focus"], queryFn: api.getFocus, retry: 1 });
  const saveSession = useMutation({ mutationFn: api.createFocusSession, onSuccess: () => qc.invalidateQueries({ queryKey: ["focus"] }) });

  const [mode, setMode] = useState(MODES[0]);
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(MODES[0].work * 60);
  const [sessions, setSessions] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customWork, setCustomWork] = useState(30);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ambient sound state
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [ambientSound, setAmbientSound] = useState(AMBIENT_SOUNDS[0]);
  const [ambientVolume, setAmbientVolume] = useState(50);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(ambientSound.url);
    audio.loop = true;
    audio.volume = ambientVolume / 100;
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, []);

  // Update audio source when sound changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ambientSound.url;
      audioRef.current.load();
      if (ambientEnabled) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [ambientSound]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (ambientEnabled) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [ambientEnabled]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = ambientVolume / 100;
    }
  }, [ambientVolume]);

  const totalSeconds = phase === "work" ? (mode.key === "custom" ? customWork : mode.work) * 60 : mode.break * 60;
  const progress = 1 - seconds / totalSeconds;
  const motivation = MOTIVATIONS[sessions % MOTIVATIONS.length];

  const resetTimer = useCallback((m = mode, ph: "work" | "break" = "work") => {
    clearInterval(interval.current!);
    setRunning(false);
    setPhase(ph);
    setSeconds((m.key === "custom" ? customWork : m.work) * 60);
  }, [mode, customWork]);

  useEffect(() => { resetTimer(); }, [mode]);

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(interval.current!);
            setRunning(false);
            if (phase === "work") {
              const duration = mode.key === "custom" ? customWork : mode.work;
              saveSession.mutate({ duration, type: mode.key });
              setSessions((prev) => prev + 1);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
              setPhase("break");
              return mode.break * 60;
            } else {
              setPhase("work");
              return (mode.key === "custom" ? customWork : mode.work) * 60;
            }
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval.current!);
    }
    return () => clearInterval(interval.current!);
  }, [running, phase, mode, customWork, saveSession]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const circumference = 2 * Math.PI * 110;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100">Focus Mode</h1>
          <p className="mt-1 text-sm text-zinc-400 font-medium">Work deeply — don't skip breaks.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Timer */}
          <div className="glass-panel flex flex-col items-center rounded-3xl p-8">
            {/* Mode selector */}
            <div className="mb-8 flex gap-2 rounded-2xl glass-panel p-1.5">
              {MODES.map((m) => (
                <button key={m.key} onClick={() => { setMode(m); setRunning(false); }}
                  className={cn("rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95",
                    mode.key === m.key ? "bg-white/10 text-zinc-100 border border-white/10 shadow-sm" : "text-zinc-400 hover:text-zinc-200")}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Phase */}
            <div className="mb-6 status-pill border-zinc-800 bg-zinc-900/60 text-xs font-semibold uppercase tracking-widest text-zinc-300">
              <span className={phase === "work" ? "glow-dot-cyan shrink-0" : "glow-dot-emerald shrink-0"} />
              {phase === "work" ? "Focus Time" : "Break"}
            </div>

            {/* SVG Circle Timer */}
            <div className="relative mb-8">
              <svg width="260" height="260" className="-rotate-90">
                <circle cx="130" cy="130" r="110" fill="none" stroke="rgba(39,39,42,0.6)" strokeWidth="6" />
                <motion.circle cx="130" cy="130" r="110" fill="none"
                  stroke={running ? "#38bdf8" : "rgba(255,255,255,0.75)"} strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  transition={{ duration: 0.5 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold tabular-nums text-zinc-100 tracking-tight">
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </span>
                {running && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-2 max-w-[150px] text-center text-xs text-zinc-400 font-medium leading-relaxed">
                    {motivation}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => resetTimer()}
                className="flex h-12 w-12 items-center justify-center rounded-2xl glass-panel text-zinc-400 hover:text-zinc-100 hover:border-white/20 transition-all cursor-pointer">
                <RotateCcw className="h-5 w-5" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                onClick={() => setRunning((r) => !r)}
                className="btn-liquid-primary flex h-16 w-16 items-center justify-center rounded-2xl cursor-pointer shadow-lg">
                {running ? <Pause className="h-6 w-6 text-zinc-950" /> : <Play className="h-6 w-6 translate-x-0.5 text-zinc-950" />}
              </motion.button>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl glass-panel border-white/10">
                <span className="text-sm font-bold text-zinc-300 font-mono">{sessions}</span>
              </div>
            </div>

            {mode.key === "custom" && (
              <div className="mt-6 flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-medium">Duration:</span>
                <input type="number" value={customWork} onChange={(e) => setCustomWork(Number(e.target.value))}
                  min={1} max={120}
                  className="glass-input w-16 rounded-xl px-2 py-1 text-center text-sm font-medium text-zinc-100 outline-none" />
                <span className="text-xs text-zinc-400 font-medium">minutes</span>
              </div>
            )}

            {/* Success */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="mt-6 flex items-center gap-2 status-pill border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-4 py-2.5">
                  <span className="glow-dot-emerald shrink-0" />
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold">Great work! Session saved 🎉</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats & History */}
          <div className="space-y-4">
            {/* Ambient Sounds */}
            <div className="glass-panel rounded-3xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Ambient Soundscapes</p>
                <button onClick={() => setAmbientEnabled(!ambientEnabled)}
                  className={cn("rounded-xl p-1.5 transition-colors cursor-pointer active:scale-95", ambientEnabled ? "text-sky-400" : "text-zinc-500 hover:text-zinc-200")}>
                  {ambientEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {AMBIENT_SOUNDS.map((sound) => {
                  const Icon = sound.icon;
                  return (
                    <button key={sound.key} onClick={() => { setAmbientSound(sound); setAmbientEnabled(true); }}
                      className={cn("flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all cursor-pointer active:scale-95 border",
                        ambientSound.key === sound.key && ambientEnabled
                          ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                          : "border-zinc-800 bg-zinc-900/40 hover:border-white/20 hover:bg-zinc-900/60")}>
                      <Icon className={cn("h-4 w-4", ambientSound.key === sound.key && ambientEnabled ? "text-sky-400" : "text-zinc-400")} />
                      <span className={cn("text-[10px]", ambientSound.key === sound.key && ambientEnabled ? "text-sky-300 font-semibold" : "text-zinc-400 font-medium")}>{sound.label}</span>
                    </button>
                  );
                })}
              </div>
              {ambientEnabled && (
                <div className="mt-4 flex items-center gap-3">
                  <VolumeX className="h-3 w-3 text-zinc-500" />
                  <input type="range" value={ambientVolume} onChange={(e) => setAmbientVolume(Number(e.target.value))}
                    min={0} max={100}
                    className="flex-1 h-1 rounded-full appearance-none bg-zinc-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400 cursor-pointer" />
                  <Volume2 className="h-3 w-3 text-zinc-500" />
                </div>
              )}
            </div>

            {/* Today stats */}
            <div className="glass-panel rounded-3xl p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Today</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Timer className="h-4 w-4 text-zinc-400" /> Focus time
                  </div>
                  <span className="text-sm font-semibold text-zinc-100">{formatMinutes(focusData?.todayMinutes ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Flame className="h-4 w-4 text-amber-400" /> Sessions
                  </div>
                  <span className="text-sm font-semibold text-zinc-100">{sessions + (focusData?.sessions?.filter((s: any) => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    return s.completedAt && new Date(s.completedAt) >= today;
                  }).length ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Clock className="h-4 w-4 text-zinc-400" /> Total
                  </div>
                  <span className="text-sm font-semibold text-zinc-100">{formatMinutes(focusData?.totalMinutes ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Recent sessions */}
            <div className="glass-panel rounded-3xl p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Recent Sessions</p>
              {!focusData?.sessions?.length ? (
                <p className="py-4 text-center text-sm text-zinc-500">No sessions yet</p>
              ) : (
                <div className="space-y-2">
                  {(focusData?.sessions ?? []).slice(0, 6).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl px-3 py-2 border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-2">
                        <div className="glow-dot-blue shrink-0" />
                        <span className="text-sm text-zinc-300 font-medium capitalize">{s.type === "pomodoro" ? "🍅" : "⚡"} {s.type}</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-200">{formatMinutes(s.duration)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
