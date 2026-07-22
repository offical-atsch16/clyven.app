import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, Layout, Server, Database, Shield, Zap, Copy, Check, Terminal, ExternalLink, Github } from "lucide-react";
import { cn } from "../lib/utils";

const SECTIONS = [
  { id: "overview", title: "Overview", icon: BookOpen },
  { id: "architecture", title: "Architecture", icon: Layout },
  { id: "routing", title: "API Routing", icon: Server },
  { id: "database", title: "Database Schema", icon: Database },
  { id: "auth", title: "Authentication", icon: Shield },
  { id: "premium", title: "Premium Gating", icon: Zap },
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
    authCheck: `// requireAuth.ts (Backend Gating)
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Expose userId & check isPremium...
}`,
    notesLimit: `// notes.ts (API Limit Enforcement)
if (!isPremium) {
  const { count } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count || 0) >= 10) {
    return res.status(403).json({ error: "LIMIT_REACHED" });
  }
}`,
    dbSchema: `CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) DEFAULT 'Untitled',
  content TEXT,
  color VARCHAR(50) DEFAULT 'default',
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
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

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">

          {/* Side Table of Contents (Sticky on Desktop) */}
          <aside className="lg:sticky lg:top-28 h-fit space-y-1">
            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-white/20">Documentation</p>
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
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition-all cursor-pointer",
                    activeSection === sec.id
                      ? "bg-white/[0.08] text-white font-medium"
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
          <main className="space-y-12 leading-relaxed">

            {/* Overview */}
            <section id="overview" className="scroll-mt-28 border-t border-white/[0.05] lg:border-t-0 pt-8 lg:pt-0">
              <h1 className="text-3xl font-extrabold tracking-tight mb-4">Project Documentation</h1>
              <p className="text-white/50 mb-6 text-sm">
                Welcome to the official technical documentation for Clyven.app. Clyven is a minimalist yet highly functional personal digital workspace bringing your notes, focus timer, journal, and links into a beautiful experience.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                  <h3 className="font-semibold mb-2 text-white flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-white/40" /> Built for Performance
                  </h3>
                  <p className="text-xs text-white/40">
                    Engineered with modern tools like React, Vite, Tailwind CSS, Express, and PostgreSQL/Supabase to deliver near-instant loading times and rock-solid synchronization.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                  <h3 className="font-semibold mb-2 text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-white/40" /> Complete Sovereignty
                  </h3>
                  <p className="text-xs text-white/40">
                    Full user-authentication powered by Clerk, supporting subscription billing and seamless, authenticated API endpoint access controls.
                  </p>
                </div>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture" className="scroll-mt-28 border-t border-white/[0.05] pt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5">
                <Layout className="h-5 w-5 text-white/40" /> Technical Architecture
              </h2>
              <p className="text-white/50 mb-4 text-sm">
                Clyven is structured as a pnpm workspace monorepo. This maintains clear logical separation between backend logic and frontend templates.
              </p>
              <div className="space-y-3">
                <div className="flex gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                  <div className="font-bold text-xs uppercase tracking-widest text-white/40 shrink-0 w-24">Frontend</div>
                  <div className="text-xs text-white/60">
                    Built inside <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">artifacts/web-app</code> using React 19, Vite, and Tailwind CSS. Employs <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">wouter</code> for routing, Zustand for state management, and TanStack React Query for caching.
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                  <div className="font-bold text-xs uppercase tracking-widest text-white/40 shrink-0 w-24">Backend</div>
                  <div className="text-xs text-white/60">
                    An Express.js API located in <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">artifacts/api-server</code>. It validates Clerk JSON Web Tokens (JWT) on each request and executes pool-based queries with Drizzle ORM.
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                  <div className="font-bold text-xs uppercase tracking-widest text-white/40 shrink-0 w-24">Database</div>
                  <div className="text-xs text-white/60">
                    A cloud-hosted PostgreSQL database provided by Supabase. Schemas and schema definitions are modeled using Drizzle in <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">lib/db</code>.
                  </div>
                </div>
              </div>
            </section>

            {/* API Routing */}
            <section id="routing" className="scroll-mt-28 border-t border-white/[0.05] pt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5">
                <Server className="h-5 w-5 text-white/40" /> Express API Routing Table
              </h2>
              <p className="text-white/50 mb-4 text-sm">
                All backend routes are prefix-scoped with <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">/api</code>.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.01]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.02] text-white/40 uppercase tracking-widest">
                      <th className="p-4 font-semibold">Method</th>
                      <th className="p-4 font-semibold">Route</th>
                      <th className="p-4 font-semibold">Auth</th>
                      <th className="p-4 font-semibold">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-white/70">
                    <tr>
                      <td className="p-4 font-bold text-green-400">GET</td>
                      <td className="p-4 font-mono">/api/notes</td>
                      <td className="p-4 text-white/40">Clerk JWT</td>
                      <td className="p-4">Fetch non-archived user notes</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-blue-400">POST</td>
                      <td className="p-4 font-mono">/api/notes</td>
                      <td className="p-4 text-white/40">Clerk JWT</td>
                      <td className="p-4">Create note (Enforces 10 notes free limit)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-yellow-400">PUT</td>
                      <td className="p-4 font-mono">/api/notes/:id</td>
                      <td className="p-4 text-white/40">Clerk JWT</td>
                      <td className="p-4">Update, pin, favorite, or archive note</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-green-400">GET</td>
                      <td className="p-4 font-mono">/api/bookmarks</td>
                      <td className="p-4 text-white/40">Clerk JWT</td>
                      <td className="p-4">Fetch user bookmarks</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-blue-400">POST</td>
                      <td className="p-4 font-mono">/api/bookmarks</td>
                      <td className="p-4 text-white/40">Clerk JWT</td>
                      <td className="p-4">Create bookmark (Enforces 25 bookmarks free limit)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-green-400">GET</td>
                      <td className="p-4 font-mono">/api/focus</td>
                      <td className="p-4 text-white/40">Clerk JWT</td>
                      <td className="p-4">Fetch focus sessions and analytics</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-blue-400">POST</td>
                      <td className="p-4 font-mono">/api/focus</td>
                      <td className="p-4 text-white/40">Clerk JWT</td>
                      <td className="p-4">Save completed work / break session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Database */}
            <section id="database" className="scroll-mt-28 border-t border-white/[0.05] pt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5">
                <Database className="h-5 w-5 text-white/40" /> Database Schema
              </h2>
              <p className="text-white/50 mb-4 text-sm">
                Relational entity definition written via SQL & managed through Drizzle ORM mapping.
              </p>

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

            {/* Authentication */}
            <section id="auth" className="scroll-mt-28 border-t border-white/[0.05] pt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-white/40" /> Clerk Authentication
              </h2>
              <p className="text-white/50 mb-4 text-sm">
                Auth state is initiated securely inside <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">App.tsx</code> with the <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">&lt;ClerkProvider /&gt;</code> wrapper. The API validates request authorization header tokens.
              </p>

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

            {/* Premium Gating */}
            <section id="premium" className="scroll-mt-28 border-t border-white/[0.05] pt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5">
                <Zap className="h-5 w-5 text-white/40" /> Premium Gating (Clyven Plus)
              </h2>
              <p className="text-white/50 mb-4 text-sm">
                Paid user checkups run on both client-side and server-side. Users with the <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">Clyven Plus</code> or <code className="text-white/80 bg-white/[0.05] px-1 py-0.5 rounded">Clyven Business</code> subscription plans are exempted from all free limitations (unlimited notes and bookmarks).
              </p>

              <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 font-mono text-xs overflow-hidden">
                <button
                  onClick={() => handleCopy(codeExamples.notesLimit, "limits")}
                  className="absolute right-4 top-4 rounded-lg bg-white/[0.04] p-1.5 text-white/40 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                >
                  {copiedText === "limits" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <pre className="overflow-x-auto text-white/80 select-all leading-relaxed whitespace-pre">
                  {codeExamples.notesLimit}
                </pre>
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
