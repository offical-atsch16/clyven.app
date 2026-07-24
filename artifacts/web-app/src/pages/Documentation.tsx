import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, BookOpen, Layout, Server, Database, Shield, Zap, Copy, Check,
  Terminal, ExternalLink, Github, MessageSquare, CheckSquare, Key, Mail,
  ListTodo, Cpu, Kanban, Landmark, Lock, HelpCircle
} from "lucide-react";
import { cn } from "../lib/utils";

const SECTIONS = [
  { id: "overview", title: "Plattform-Übersicht", icon: BookOpen },
  { id: "features", title: "Funktionen & Workflows", icon: Kanban },
  { id: "architecture", title: "System-Architektur", icon: Layout },
  { id: "routing", title: "API Routing Tabelle", icon: Server },
  { id: "database", title: "Datenbank-Schema & Diagramm", icon: Database },
  { id: "auth", title: "Authentifizierung & Flow", icon: Shield },
  { id: "premium", title: "Premium Gating (Clyven Plus)", icon: Zap },
  { id: "tickets", title: "Support-Ticket Lifecycle", icon: MessageSquare },
];

export function Documentation() {
  const [activeSection, setActiveSection] = useState("overview");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const codeExamples = {
    authCheck: `// requireAuth.ts (Backend Gating Middleware)
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Expose userId, check subscriptions (metadata/fallbacks)
  req.userId = auth.userId;
  req.isPremium = checkSubscription(auth);
  next();
}`,
    tasksLimit: `// tasks.ts (Limit Gating on creation)
router.post("/", requireAuth, async (req, res) => {
  const { userId, isPremium } = req as AuthenticatedRequest;
  if (!isPremium) {
    const { count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count || 0) >= 20) {
      return res.status(403).json({ error: "LIMIT_REACHED" });
    }
  }
  // Insert logic...
})`,
    dbSchema: `CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
  };

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.05] bg-[#080808]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-6 w-6" />
              <span className="text-sm font-bold tracking-[0.25em]">CLYVEN</span>
            </div>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-white/[0.05] bg-[#0c0c0c] pt-24 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="mx-auto max-w-6xl px-6 relative z-10">
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">Technical documentation</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-4 sm:text-4xl">Systemdokumentation & Architektur</h1>
          <p className="text-white/40 text-sm mt-2 max-w-2xl leading-relaxed">
            Erfahren Sie im Detail, wie Clyven.app aufgebaut ist. Diese Dokumentation beleuchtet die Features, die zugrundeliegende Monorepo-Architektur, API-Schnittstellen, Datenbankschemata sowie Sicherheits- und E-Mail-Workflows.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">

          {/* Side Table of Contents (Sticky on Desktop) */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-1">
            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-white/20">Themengebiete</p>
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSection(sec.id);
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-left transition-all cursor-pointer",
                    activeSection === sec.id
                      ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.05]"
                      : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {sec.title}
                </button>
              );
            })}
          </aside>

          {/* Documentation Content */}
          <main className="space-y-16 leading-relaxed">

            {/* Overview */}
            <section id="overview" className="scroll-mt-28">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <BookOpen className="h-5 w-5 text-blue-400" /> 1. Plattform-Übersicht
              </h2>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                Clyven ist ein hochperformanter, minimalistischer digitaler Workspace für Produktivität und Wissensmanagement. Das System integriert Notizmanagement (Second Brain), Lesezeichenverwaltung, Fokustimer, tägliche Reflexionen, Gamification sowie ein robustes Support-Ticket-System.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                  <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Terminal className="h-4 w-4 text-white/40" /> Performance & Modern Tech Stack
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Echtzeit-Synchronisierung mit Drizzle ORM und PostgreSQL/Supabase, schnelles Client-Rerendering mit Vite und Zustand sowie Framer-Motion für nahtlose UI-Animationen.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                  <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-white/40" /> Datensouveränität & Gating
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Vollständige Absicherung aller Benutzer-Schnittstellen mit modernem Clerk OAuth & JWT-Verifizierung. Schutz sensibler Systemdaten durch differenziertes API-Level Gating.
                  </p>
                </div>
              </div>
            </section>

            {/* Features & Workflows */}
            <section id="features" className="scroll-mt-28 border-t border-white/[0.05] pt-12">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <Kanban className="h-5 w-5 text-yellow-400" /> 2. Funktionen & Workflows
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Die Plattform bietet ein nahtloses Set an Produktivitäts-Funktionen, die dem Nutzer helfen, Wissen zu organisieren und Aufgaben strukturiert abzuarbeiten:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] flex gap-4 items-start">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white/90">Notes & Second Brain</h4>
                    <p className="text-xs text-white/40 mt-1">Echtzeit-Notizen mit Textlängenanalyse, Favorisierung, Pin-Möglichkeiten, Exportfunktion in Markdown sowie farblicher Kategorisierung für strukturierte Gedankenablage.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] flex gap-4 items-start">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white/90">Interaktives Kanban-Board</h4>
                    <p className="text-xs text-white/40 mt-1">Das innovative neue Task-Board ermöglicht das einfache Planen und Priorisieren von Aufgaben. Durch die Implementierung nativer HTML5 Drag & Drop Schnittstellen lassen sich Tickets fließend zwischen den Spalten „To Do“, „In Progress“ und „Completed“ verschieben.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] flex gap-4 items-start">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 shrink-0 mt-0.5">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white/90">Fokustimer & Study-Tracker</h4>
                    <p className="text-xs text-white/40 mt-1">Integrierter Pomodoro-Timer zur Steigerung der Konzentration. Fokussitzungen werden mit Dauer und Typ persistiert und fließen direkt in ein detailliertes Analyse-Dashboard.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] flex gap-4 items-start">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-400 shrink-0 mt-0.5">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white/90">Geschütztes Support-Ticket-System</h4>
                    <p className="text-xs text-white/40 mt-1">Ein fortschrittliches Ticket-System zur reibungslosen Kommunikation. Jedes neu erstellte Ticket generiert einen absolut sicheren, zufälligen 6-stelligen Zugangscode (Passcode) in der DB, der per Gmail SMTP versendet wird und als einzige Verifizierungsmethode dient.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture" className="scroll-mt-28 border-t border-white/[0.05] pt-12">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <Layout className="h-5 w-5 text-indigo-400" /> 3. System-Architektur
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Clyven ist als modularer pnpm-Monorepo-Workspace aufgebaut, um eine strikte Trennung zwischen Frontend-Präsentation und API-Logik zu gewährleisten:
              </p>

              {/* Architecture Interactive Flow Map (SVG Diagram) */}
              <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[#0c0c0c] p-6 text-center">
                <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Interaktives Systemdiagramm</span>

                <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4">
                  {/* Web Client */}
                  <div className="w-full md:w-1/3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                    <div className="flex justify-center mb-1 text-blue-400"><Cpu className="h-5 w-5" /></div>
                    <div className="text-xs font-bold text-white uppercase">React Client</div>
                    <div className="text-[10px] text-white/30 mt-1">Wouter, Zustand, TanStack Query</div>
                  </div>

                  {/* Arrow 1 */}
                  <div className="flex flex-col items-center justify-center text-white/20">
                    <span className="hidden md:block">── API (JWT) ──▶</span>
                    <span className="md:hidden">▼</span>
                  </div>

                  {/* Express Server */}
                  <div className="w-full md:w-1/3 rounded-xl border border-blue-500/20 bg-blue-500/[0.01] p-4 text-center">
                    <div className="flex justify-center mb-1 text-indigo-400"><Server className="h-5 w-5" /></div>
                    <div className="text-xs font-bold text-white uppercase">Express API Server</div>
                    <div className="text-[10px] text-white/30 mt-1">Routing, JWT-Check, SMTP, Admin Portal</div>
                  </div>

                  {/* Arrow 2 */}
                  <div className="flex flex-col items-center justify-center text-white/20">
                    <span className="hidden md:block">── SQL / SDK ──▶</span>
                    <span className="md:hidden">▼</span>
                  </div>

                  {/* Supabase DB */}
                  <div className="w-full md:w-1/3 rounded-xl border border-green-500/20 bg-green-500/[0.01] p-4 text-center">
                    <div className="flex justify-center mb-1 text-green-400"><Database className="h-5 w-5" /></div>
                    <div className="text-xs font-bold text-white uppercase">Supabase PostgreSQL</div>
                    <div className="text-[10px] text-white/30 mt-1">Tabellen, Indizes, Drizzle ORM Schemata</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 text-xs text-white/50">
                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                  <strong className="text-white font-medium block mb-1">artifacts/web-app</strong>
                  React 19 & Vite-getriebener Client. Verwendet Tailwind CSS für responsive Layouts und Framer-Motion für sanfte Page-Transitions.
                </div>
                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                  <strong className="text-white font-medium block mb-1">artifacts/api-server</strong>
                  Express-Backend. Valdiert Clerk-User und verarbeitet Support-Tickets, Admin-Sessions und E-Mail-Dienste (Nodemailer).
                </div>
                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                  <strong className="text-white font-medium block mb-1">lib/db</strong>
                  Datenbankmodul mit Drizzle-Modellen und PostgreSQL Schema-Migrationen zur lückenlosen Absicherung der Datenkonsistenz.
                </div>
              </div>
            </section>

            {/* API Routing Table */}
            <section id="routing" className="scroll-mt-28 border-t border-white/[0.05] pt-12">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <Server className="h-5 w-5 text-green-400" /> 4. Express API Routing Tabelle
              </h2>
              <p className="text-white/50 text-sm mb-4">
                Sämtliche Backend-Schnittstellen sind unter dem Präfix <code className="text-white/80 bg-white/[0.05] px-1.5 py-0.5 rounded">/api</code> registriert und durch rollenbasierte Autorisierungsmechanismen abgesichert.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.01]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.02] text-white/40 uppercase tracking-widest text-[10px]">
                      <th className="p-4 font-semibold">Methode</th>
                      <th className="p-4 font-semibold">Pfad</th>
                      <th className="p-4 font-semibold">Absicherung</th>
                      <th className="p-4 font-semibold">Zweck</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-white/70">
                    <tr>
                      <td className="p-4 font-bold text-blue-400">POST</td>
                      <td className="p-4 font-mono">/api/tickets</td>
                      <td className="p-4 text-green-400 font-semibold">Öffentlich (Keine Auth)</td>
                      <td className="p-4">Ticket erstellen & Zugangscode per SMTP zusenden</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-green-400">GET</td>
                      <td className="p-4 font-mono">/api/tickets/:id</td>
                      <td className="p-4 text-yellow-400 font-semibold">Individueller Zugangscode</td>
                      <td className="p-4">Liefert Ticket und Nachrichtenverlauf</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-blue-400">POST</td>
                      <td className="p-4 font-mono">/api/tickets/:id/messages</td>
                      <td className="p-4 text-yellow-400 font-semibold">Individueller Zugangscode</td>
                      <td className="p-4">Fügt dem Ticket eine neue Antwort hinzu</td>
                    </tr>
                    <tr className="bg-blue-500/[0.02]">
                      <td className="p-4 font-bold text-green-400">GET</td>
                      <td className="p-4 font-mono">/api/tasks</td>
                      <td className="p-4 text-red-400 font-semibold">Clerk JWT (Benutzer)</td>
                      <td className="p-4">Liefert alle Kanban-Tasks des Benutzers</td>
                    </tr>
                    <tr className="bg-blue-500/[0.02]">
                      <td className="p-4 font-bold text-blue-400">POST</td>
                      <td className="p-4 font-mono">/api/tasks</td>
                      <td className="p-4 text-red-400 font-semibold">Clerk JWT (Limit-Checked)</td>
                      <td className="p-4">Erstellt eine neue Aufgabe (Free-Limit: 20 Tasks)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-green-400">GET</td>
                      <td className="p-4 font-mono">/api/notes</td>
                      <td className="p-4 text-red-400 font-semibold">Clerk JWT (Benutzer)</td>
                      <td className="p-4">Liefert alle nicht-archivierten Notizen</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-blue-400">POST</td>
                      <td className="p-4 font-mono">/api/notes</td>
                      <td className="p-4 text-red-400 font-semibold">Clerk JWT (Limit-Checked)</td>
                      <td className="p-4">Notiz anlegen (Free-Limit: 10 Notizen)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Database Schema & Interactive Visual Diagram */}
            <section id="database" className="scroll-mt-28 border-t border-white/[0.05] pt-12">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <Database className="h-5 w-5 text-blue-400" /> 5. Datenbank-Schema & Diagramm
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Unsere PostgreSQL/Supabase-Relationen sind über Drizzle ORM modelliert und für Performance hochgradig indiziert. Das folgende interaktive Schema zeigt die wichtigsten Entitäten und deren Attribute:
              </p>

              {/* Visual Entity-Relationship Diagram using Tailwind and CSS */}
              <div className="mb-8 rounded-2xl border border-white/[0.06] bg-[#0c0c0c] p-6">
                <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold block mb-4">Interaktives Entity-Relationship Modell</span>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Tickets Table Box */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2 font-mono text-white/80">
                      <span>🎟️ Table: tickets</span>
                      <span className="text-white/20 text-[10px]">UUID Primary</span>
                    </div>
                    <ul className="space-y-1.5 font-mono text-[11px] text-white/50">
                      <li><strong className="text-blue-400">id</strong> : <span className="text-white/30">UUID</span></li>
                      <li><strong className="text-white/70">ticket_number</strong> : <span className="text-white/30">TEXT (Unique)</span></li>
                      <li><strong className="text-white/70">name</strong> : <span className="text-white/30">TEXT</span></li>
                      <li><strong className="text-white/70">email</strong> : <span className="text-white/30">TEXT</span></li>
                      <li><strong className="text-white/70">passcode</strong> : <span className="text-white/30">TEXT (6-stelliger Code)</span></li>
                      <li><strong className="text-white/70">status</strong> : <span className="text-white/30">TEXT (OPEN / IN_PROGRESS / CLOSED)</span></li>
                    </ul>
                  </div>

                  {/* Tasks Table Box */}
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.01] p-4 text-xs">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2 font-mono text-white/80">
                      <span>📋 Table: tasks</span>
                      <span className="text-blue-400/50 text-[10px]">New Core Feature</span>
                    </div>
                    <ul className="space-y-1.5 font-mono text-[11px] text-white/50">
                      <li><strong className="text-blue-400">id</strong> : <span className="text-white/30">UUID</span></li>
                      <li><strong className="text-white/70">user_id</strong> : <span className="text-white/30">TEXT (Clerk ID)</span></li>
                      <li><strong className="text-white/70">title</strong> : <span className="text-white/30">TEXT</span></li>
                      <li><strong className="text-white/70">description</strong> : <span className="text-white/30">TEXT</span></li>
                      <li><strong className="text-white/70">status</strong> : <span className="text-white/30">TEXT (TODO / IN_PROGRESS / DONE)</span></li>
                      <li><strong className="text-white/70">priority</strong> : <span className="text-white/30">TEXT (LOW / MEDIUM / HIGH)</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 font-mono text-xs overflow-hidden">
                <button
                  onClick={() => handleCopy(codeExamples.dbSchema, "db")}
                  className="absolute right-4 top-4 rounded-lg bg-white/[0.04] p-1.5 text-white/40 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                >
                  {copiedText === "db" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <pre className="overflow-x-auto text-white/80 select-all leading-relaxed whitespace-pre">
                  {codeExamples.dbSchema}
                </pre>
              </div>
            </section>

            {/* Clerk Authentication */}
            <section id="auth" className="scroll-mt-28 border-t border-white/[0.05] pt-12">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-indigo-400" /> 6. Clerk Authentifizierung & Session Flow
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Die Authentifizierung erfolgt clientseitig über den <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">&lt;ClerkProvider /&gt;</code> in <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">App.tsx</code>. Bei API-Anfragen wird das JSON Web Token (JWT) sicher im Autorisierungs-Header übermittelt und serverseitig in der Middleware validiert:
              </p>

              {/* sequence diagram using clean text/SVG structure */}
              <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[#0c0c0c] p-6 font-mono text-xs text-white/60 space-y-2">
                <div className="text-center font-bold text-white/40 text-[10px] uppercase tracking-wider mb-4">Request Authentication Sequence</div>
                <div className="flex items-center justify-between border-b border-white/[0.03] pb-1.5">
                  <span className="text-blue-400">1. Client</span>
                  <span>Fordert Token bei Clerk an & sendet HTTP Request an API</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/[0.03] pb-1.5">
                  <span className="text-indigo-400">2. Middleware</span>
                  <span>Prüft Signatur & extrahiert die verschlüsselte Clerk userId</span>
                </div>
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-green-400">3. Handler</span>
                  <span>Führt datenbankgatterte Operationen unter user_id-Filter aus</span>
                </div>
              </div>

              <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 font-mono text-xs overflow-hidden">
                <button
                  onClick={() => handleCopy(codeExamples.authCheck, "auth")}
                  className="absolute right-4 top-4 rounded-lg bg-white/[0.04] p-1.5 text-white/40 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                >
                  {copiedText === "auth" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <pre className="overflow-x-auto text-white/80 select-all leading-relaxed whitespace-pre">
                  {codeExamples.authCheck}
                </pre>
              </div>
            </section>

            {/* Premium Gating (Clyven Plus) */}
            <section id="premium" className="scroll-mt-28 border-t border-white/[0.05] pt-12">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <Zap className="h-5 w-5 text-yellow-400" /> 7. Premium Gating (Clyven Plus)
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Premium-Prüfungen finden synchron auf Client- und API-Ebene statt. Nutzer der Tarife <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">Clyven Plus</code> oder <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">Clyven Business</code> besitzen unlimitierten Speicherplatz für Notizen, Lesezeichen und Aufgaben.
              </p>

              <div className="grid gap-4 sm:grid-cols-3 text-center mb-6">
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Notes Limit</span>
                  <div className="text-xl font-bold mt-1 text-white">10</div>
                  <span className="text-[10px] text-white/20">Notes auf Free Plan</span>
                </div>
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Bookmarks Limit</span>
                  <div className="text-xl font-bold mt-1 text-white">25</div>
                  <span className="text-[10px] text-white/20">Bookmarks auf Free Plan</span>
                </div>
                <div className="rounded-xl border border-white/[0.05] bg-blue-500/[0.01] p-4 border-blue-500/10">
                  <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Tasks Limit</span>
                  <div className="text-xl font-bold mt-1 text-blue-400">20</div>
                  <span className="text-[10px] text-blue-400/30">Tasks auf Free Plan</span>
                </div>
              </div>

              <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 font-mono text-xs overflow-hidden">
                <button
                  onClick={() => handleCopy(codeExamples.tasksLimit, "limits")}
                  className="absolute right-4 top-4 rounded-lg bg-white/[0.04] p-1.5 text-white/40 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                >
                  {copiedText === "limits" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <pre className="overflow-x-auto text-white/80 select-all leading-relaxed whitespace-pre">
                  {codeExamples.tasksLimit}
                </pre>
              </div>
            </section>

            {/* Support-Ticket Lifecycle & Protection */}
            <section id="tickets" className="scroll-mt-28 border-t border-white/[0.05] pt-12">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <MessageSquare className="h-5 w-5 text-blue-400" /> 8. Support-Ticket Lifecycle
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Das Clyven Support-Ticket-System ist für maximale Sicherheit und Bequemlichkeit ohne zwingende Anmeldung konzipiert:
              </p>

              <div className="space-y-4 text-xs text-white/40">
                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] flex gap-3">
                  <span className="h-5 w-5 rounded-full bg-white/[0.06] text-white/80 font-bold flex items-center justify-center shrink-0">1</span>
                  <p>
                    <strong className="text-white font-semibold">Generierung des 6-stelligen Zugangscodes:</strong> Bei der manuellen oder automatischen Ticket-Erstellung wird über einen kryptografisch sicheren Generator ein zufälliger 6-stelliger Zahlencode (z. B. <code className="bg-white/[0.05] px-1 rounded text-blue-400">482915</code>) berechnet und verschlüsselt in der Datenbank abgelegt.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] flex gap-3">
                  <span className="h-5 w-5 rounded-full bg-white/[0.06] text-white/80 font-bold flex items-center justify-center shrink-0">2</span>
                  <p>
                    <strong className="text-white font-semibold"> SMTP Zustellungs-Pipeline:</strong> Nach erfolgreicher Transaktion in der Datenbank sendet das Backend über <code className="bg-white/[0.05] px-1 rounded">Nodemailer</code> eine formschöne HTML-Bestätigungs-E-Mail an den Kunden. Diese enthält die Zusammenfassung des Anliegens, die eindeutige Ticketnummer sowie den individuellen 													Zugangscode.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] flex gap-3">
                  <span className="h-5 w-5 rounded-full bg-white/[0.06] text-white/80 font-bold flex items-center justify-center shrink-0">3</span>
                  <p>
                    <strong className="text-white font-semibold">Zweistufiger Zugriffsschutz:</strong> Tickets können im Frontend absolut geschützt nur geöffnet werden, wenn der Benutzer die korrekte Ticketnummer und den dazugehörigen Zugangscode eingibt.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.05] bg-blue-500/[0.02] border-blue-500/10 flex gap-3 text-blue-300/80">
                  <span className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center shrink-0">4</span>
                  <p>
                    <strong className="text-white font-semibold">Sicherheit:</strong> Wir gewähren Sicherheit mit AES-256 Verschlüsselung in all unseren Systemen
                  </p>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#0c0c0c] px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-xs text-white/20">© 2026 CLYVEN</p>
          <div className="flex gap-6 text-xs text-white/30 items-center">
            <Link href="/privacy"><span className="hover:text-white/50 cursor-pointer transition-colors">Privacy</span></Link>
            <Link href="/impressum"><span className="hover:text-white/50 cursor-pointer transition-colors">Legal Notice</span></Link>
            <a href="https://github.com/offical-atsch16/clyven.app" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors flex items-center gap-1 cursor-pointer">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
