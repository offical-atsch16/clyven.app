import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, RotateCcw, Timer, CircleCheck as CheckCircle, Flame, Clock, Volume2, VolumeX, CloudRain, Trees, Coffee, Flame as FlameIcon, Save as Waves, Wind } from "lucide-react";
import { api } from "../lib/api";
import { cn, formatMinutes } from "../lib/utils";

const MODES = [
  { key: "pomodoro", label: "Pomodoro", work: 25, break: 5 },
  { key: "short", label: "Short", work: 15, break: 3 },
  { key: "deep", label: "Deep Work", work: 50, break: 10 },
  { key: "custom", label: "Custom", work: 30, break: 5 },
];

const AMBIENT_SOUNDS = [
  { key: "rain", label: "Rain", icon: CloudRain, url: "https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3" },
  { key: "forest", label: "Forest", icon: Trees, url: "https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39a0b8eb.mp3" },
  { key: "cafe", label: "Café", icon: Coffee, url: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_7c5e3b9c4a.mp3" },
  { key: "fireplace", label: "Fireplace", icon: FlameIcon, url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_8e0f5e7c8e.mp3" },
  { key: "waves", label: "Waves", icon: Waves, url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_9f5f5e3e9d.mp3" },
  { key: "wind", label: "Wind", icon: Wind, url: "https://cdn.pixabay.com/download/audio/2022/02/23/audio_b6b0e6e0f9.mp3" },
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
          <h1 className="text-2xl font-bold text-white">Focus Mode</h1>
          <p className="mt-1 text-sm text-white/40">Work deeply — don't skip breaks.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Timer */}
          <div className="flex flex-col items-center rounded-2xl border border-white/[0.07] bg-[#111111] p-8">
            {/* Mode selector */}
            <div className="mb-8 flex gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
              {MODES.map((m) => (
                <button key={m.key} onClick={() => { setMode(m); setRunning(false); }}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    mode.key === m.key ? "bg-white/[0.1] text-white" : "text-white/30 hover:text-white/60")}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Phase */}
            <div className="mb-6 text-xs font-medium uppercase tracking-widest text-white/30">
              {phase === "work" ? "🎯 Focus Time" : "☕ Break"}
            </div>

            {/* SVG Circle Timer */}
            <div className="relative mb-8">
              <svg width="260" height="260" className="-rotate-90">
                <circle cx="130" cy="130" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <motion.circle cx="130" cy="130" r="110" fill="none"
                  stroke="rgba(255,255,255,0.6)" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  transition={{ duration: 0.5 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold tabular-nums text-white">
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </span>
                {running && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-2 max-w-[140px] text-center text-xs text-white/30 leading-relaxed">
                    {motivation}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => resetTimer()}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.1] text-white/40 hover:text-white transition-colors">
                <RotateCcw className="h-5 w-5" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setRunning((r) => !r)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black hover:bg-white/90 transition-colors shadow-lg">
                {running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" />}
              </motion.button>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.1]">
                <span className="text-sm font-bold text-white/50">{sessions}</span>
              </div>
            </div>

            {mode.key === "custom" && (
              <div className="mt-6 flex items-center gap-3">
                <span className="text-xs text-white/40">Duration:</span>
                <input type="number" value={customWork} onChange={(e) => setCustomWork(Number(e.target.value))}
                  min={1} max={120}
                  className="w-16 rounded-lg border border-white/[0.1] bg-white/[0.05] px-2 py-1 text-center text-sm text-white outline-none" />
                <span className="text-xs text-white/40">minutes</span>
              </div>
            )}

            {/* Success */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="mt-6 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-950/20 px-4 py-2.5">
                  <CheckCircle className="h-4 w-4 text-green-400/70" />
                  <span className="text-sm text-green-400/70">Great work! Session saved 🎉</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats & History */}
          <div className="space-y-4">
            {/* Ambient Sounds */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-widest text-white/25">Ambient Sounds</p>
                <button onClick={() => setAmbientEnabled(!ambientEnabled)}
                  className={cn("rounded-lg p-1.5 transition-colors", ambientEnabled ? "text-white/70" : "text-white/25 hover:text-white/60")}>
                  {ambientEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {AMBIENT_SOUNDS.map((sound) => {
                  const Icon = sound.icon;
                  return (
                    <button key={sound.key} onClick={() => { setAmbientSound(sound); setAmbientEnabled(true); }}
                      className={cn("flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all",
                        ambientSound.key === sound.key && ambientEnabled
                          ? "border border-white/20 bg-white/[0.08]"
                          : "border border-transparent hover:bg-white/[0.04]")}>
                      <Icon className={cn("h-4 w-4", ambientSound.key === sound.key && ambientEnabled ? "text-white/70" : "text-white/30")} />
                      <span className={cn("text-[10px]", ambientSound.key === sound.key && ambientEnabled ? "text-white/60" : "text-white/30")}>{sound.label}</span>
                    </button>
                  );
                })}
              </div>
              {ambientEnabled && (
                <div className="mt-4 flex items-center gap-3">
                  <VolumeX className="h-3 w-3 text-white/30" />
                  <input type="range" value={ambientVolume} onChange={(e) => setAmbientVolume(Number(e.target.value))}
                    min={0} max={100}
                    className="flex-1 h-1 rounded-full appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/60 cursor-pointer" />
                  <Volume2 className="h-3 w-3 text-white/30" />
                </div>
              )}
            </div>

            {/* Today stats */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/25">Today</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Timer className="h-4 w-4" /> Focus time
                  </div>
                  <span className="text-sm font-semibold text-white">{formatMinutes(focusData?.todayMinutes ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Flame className="h-4 w-4" /> Sessions
                  </div>
                  <span className="text-sm font-semibold text-white">{sessions + (focusData?.sessions?.filter((s: any) => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    return s.completedAt && new Date(s.completedAt) >= today;
                  }).length ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Clock className="h-4 w-4" /> Total
                  </div>
                  <span className="text-sm font-semibold text-white">{formatMinutes(focusData?.totalMinutes ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Recent sessions */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/25">Recent Sessions</p>
              {!focusData?.sessions?.length ? (
                <p className="py-4 text-center text-sm text-white/20">No sessions yet</p>
              ) : (
                <div className="space-y-2">
                  {(focusData?.sessions ?? []).slice(0, 6).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/[0.03]">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                        <span className="text-sm text-white/50 capitalize">{s.type === "pomodoro" ? "🍅" : "⚡"} {s.type}</span>
                      </div>
                      <span className="text-sm font-medium text-white/70">{formatMinutes(s.duration)}</span>
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
