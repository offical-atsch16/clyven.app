import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Code2, GitPullRequest, Play, Plus, Copy, Check, Trash2, Tag, Lock, ExternalLink, Sparkles, Terminal } from "lucide-react";
import { api } from "../lib/api";
import { usePremium } from "../hooks/usePremium";
import { cn } from "../lib/utils";

export function DevHub() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isPremium, openUpgrade } = usePremium();

  // Snippet vault local state
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetLang, setSnippetLang] = useState("typescript");
  const [snippetCode, setSnippetCode] = useState("");
  const [snippetTags, setSnippetTags] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [snippetError, setSnippetError] = useState<string | null>(null);

  // Queries
  const { data: issuesData, isLoading: loadingIssues } = useQuery({
    queryKey: ["github-issues"],
    queryFn: api.getGithubIssues,
    enabled: isPremium,
  });

  const { data: snippets, isLoading: loadingSnippets } = useQuery({
    queryKey: ["snippets"],
    queryFn: api.getSnippets,
  });

  // Snippet mutations
  const createSnippetMutation = useMutation({
    mutationFn: api.createSnippet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      setIsCreatingSnippet(false);
      setSnippetTitle("");
      setSnippetCode("");
      setSnippetTags("");
      setSnippetError(null);
    },
    onError: (err: any) => {
      setSnippetError(err.message || "Failed to save snippet.");
    },
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: api.deleteSnippet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartFocusOnIssue = (issue: any) => {
    sessionStorage.setItem("clyven_focus_issue", JSON.stringify({
      label: `[#${issue.number}] ${issue.title}`,
      url: issue.url,
    }));
    setLocation("/focus");
  };

  const handleCreateSnippetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snippetTitle.trim() || !snippetCode.trim()) return;
    const parsedTags = snippetTags.split(",").map((t) => t.trim()).filter(Boolean);
    createSnippetMutation.mutate({
      title: snippetTitle.trim(),
      language: snippetLang,
      codeContent: snippetCode,
      tags: parsedTags,
    });
  };


  const snippetCount = snippets?.length || 0;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Dev Hub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Code2 className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Developer Hub</h1>
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-300">
              PLUS
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-400">
            GitHub issue workspace & code snippet vault synchronized with Cloudflare Pages.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingSnippet(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Code Snippet
        </button>
      </div>

      {/* GitHub Issues Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-mono font-semibold text-zinc-200 uppercase tracking-wider">
              Assigned GitHub Issues & PRs
            </h2>
          </div>
          {isPremium && (
            <span className="text-xs font-mono text-zinc-500">
              {issuesData?.issues?.length || 0} active
            </span>
          )}
        </div>

        {!isPremium ? (
          <div className="rounded-xl border border-white/10 bg-[#0c0d12] p-6 text-center shadow-lg relative overflow-hidden">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-mono font-bold text-white mb-2">
              [PLUS FEATURE] - Connect GitHub Repositories, Sync Issues & Manage Code Snippets
            </h3>
            <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto mb-4">
              Upgrade to Clyven Plus to connect your GitHub account, automatically sync assigned issues, and launch focus sessions directly on tickets.
            </p>
            <button
              onClick={openUpgrade}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-mono font-bold text-black hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> UPGRADE TO CLYVEN PLUS
            </button>
          </div>
        ) : loadingIssues ? (
          <div className="rounded-xl border border-white/10 bg-[#111218] p-8 text-center text-xs font-mono text-zinc-500">
            Loading assigned issues...
          </div>
        ) : !issuesData?.isConnected ? (
          <div className="rounded-xl border border-white/10 bg-[#111218] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-sm font-semibold text-zinc-200 mb-1">GitHub App Not Connected</p>
              <p className="text-xs text-zinc-400">Connect your GitHub account in Settings to import assigned issues and sync PR status.</p>
            </div>
            <a
              href="https://github.com/apps/clyven-inc/installations/new?setup_action=install"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-mono text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
            >
              Connect GitHub <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issuesData.issues.map((issue) => (
              <motion.div
                key={issue.id}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-white/10 bg-[#111218] p-4 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-sm group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold truncate">
                      {issue.repo} #{issue.number}
                    </span>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-white transition-colors"
                      title="Open issue on GitHub"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <h3 className="text-xs font-medium text-zinc-100 line-clamp-2 mb-3 leading-relaxed">
                    {issue.title}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {issue.labels?.map((label: string) => (
                      <span
                        key={label}
                        className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-zinc-400"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleStartFocusOnIssue(issue)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-mono font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" /> START FOCUS TIMER ON THIS ISSUE
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Code Snippet Vault Section */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-mono font-semibold text-zinc-200 uppercase tracking-wider">
              Code Snippet Vault
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {snippetCount} saved {isPremium ? "(Unlimited)" : "(Limit: 10)"}
          </span>
        </div>

        {/* Create Snippet Modal / Form */}
        <AnimatePresence>
          {isCreatingSnippet && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateSnippetSubmit}
              className="rounded-2xl border border-white/15 bg-[#111218] p-5 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-mono font-bold text-white">Create New Code Snippet</h3>
                <button
                  type="button"
                  onClick={() => setIsCreatingSnippet(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {snippetError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-mono text-rose-300">
                  {snippetError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Snippet Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supabase Auth Middleware Guard"
                    value={snippetTitle}
                    onChange={(e) => setSnippetTitle(e.target.value)}
                    className="w-full rounded-xl glass-input px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Language</label>
                  <select
                    value={snippetLang}
                    onChange={(e) => setSnippetLang(e.target.value)}
                    className="w-full rounded-xl glass-input px-3 py-2 text-xs font-mono text-white bg-[#111218] focus:outline-none"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="sql">SQL</option>
                    <option value="bash">Bash / Shell</option>
                    <option value="python">Python</option>
                    <option value="json">JSON</option>
                    <option value="html">HTML / CSS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Code Content</label>
                <textarea
                  required
                  rows={6}
                  placeholder="// Paste your code snippet here..."
                  value={snippetCode}
                  onChange={(e) => setSnippetCode(e.target.value)}
                  className="w-full rounded-xl glass-input p-3 text-xs font-mono text-zinc-200 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. auth, supabase, middleware"
                  value={snippetTags}
                  onChange={(e) => setSnippetTags(e.target.value)}
                  className="w-full rounded-xl glass-input px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingSnippet(false)}
                  className="rounded-xl px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSnippetMutation.isPending}
                  className="rounded-xl bg-cyan-500 px-5 py-2 text-xs font-mono font-bold text-black hover:bg-cyan-400 disabled:opacity-50"
                >
                  {createSnippetMutation.isPending ? "Saving..." : "Save Snippet"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Snippets List */}
        {loadingSnippets ? (
          <div className="rounded-xl border border-white/10 bg-[#111218] p-8 text-center text-xs font-mono text-zinc-500">
            Loading code snippets...
          </div>
        ) : !snippets || snippets.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#111218] p-8 text-center text-xs font-mono text-zinc-500">
            No code snippets saved yet. Click "Add Code Snippet" above to add your first snippet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snippets.map((snippet: any) => (
              <div
                key={snippet.id}
                className="rounded-xl border border-white/10 bg-[#111218] p-4 flex flex-col justify-between space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="rounded bg-cyan-500/20 text-cyan-300 px-2 py-0.5 text-[10px] font-mono uppercase font-bold">
                      {snippet.language}
                    </span>
                    <h3 className="text-xs font-mono font-semibold text-white truncate">
                      {snippet.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyCode(snippet.id, snippet.codeContent)}
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                      title="Copy code to clipboard"
                    >
                      {copiedId === snippet.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => deleteSnippetMutation.mutate(snippet.id)}
                      className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                      title="Delete snippet"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Monospaced code box with syntax look */}
                <pre className="rounded-lg bg-[#08090d] border border-white/5 p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-48 leading-relaxed select-text">
                  <code>{snippet.codeContent}</code>
                </pre>

                {snippet.tags && snippet.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <Tag className="h-3 w-3 text-zinc-500" />
                    {snippet.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
