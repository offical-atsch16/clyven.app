const BASE = "/api";

async function getClerkToken(): Promise<string | null> {
  try {
    const clerk = (window as any).Clerk;
    if (!clerk?.session) return null;
    return await clerk.session.getToken();
  } catch {
    return null;
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Not a JSON response
    }
    throw new Error(parsed?.error || text || `HTTP ${res.status}`);
  }
  return res.json();
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getClerkToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  return handleResponse(res);
}

export const api = {
  // Notes
  getNotes: () => request<any[]>("/notes"),
  createNote: (data: any) => request<any>("/notes", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id: string, data: any) => request<any>(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteNote: (id: string) => request<any>(`/notes/${id}`, { method: "DELETE" }),

  // Bookmarks
  getBookmarks: () => request<any[]>("/bookmarks"),
  createBookmark: (data: any) => request<any>("/bookmarks", { method: "POST", body: JSON.stringify(data) }),
  updateBookmark: (id: string, data: any) => request<any>(`/bookmarks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBookmark: (id: string) => request<any>(`/bookmarks/${id}`, { method: "DELETE" }),

  // Focus
  getFocus: () => request<any>("/focus"),
  createFocusSession: (data: any) => request<any>("/focus", { method: "POST", body: JSON.stringify(data) }),

  // Journal
  getJournal: () => request<any[]>("/journal"),
  getJournalEntry: (date: string) => request<any>(`/journal/${date}`),
  saveJournalEntry: (data: any) => request<any>("/journal", { method: "POST", body: JSON.stringify(data) }),

  // Tasks
  getTasks: () => request<any[]>("/tasks"),
  createTask: (data: any) => request<any>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => request<any>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<any>(`/tasks/${id}`, { method: "DELETE" }),

  // User
  getStats: () => request<any>("/user/stats"),
  getSettings: () => request<any>("/user/settings"),
  saveSettings: (data: any) => request<any>("/user/settings", { method: "POST", body: JSON.stringify(data) }),

  // Tickets (public, no Clerk auth)
  createTicket: (data: any) => fetch(`${BASE}/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(handleResponse),
  getTicket: (number: string, passcode: string) => fetch(`${BASE}/tickets/${encodeURIComponent(number)}`, { headers: { "X-Ticket-Passcode": passcode } }).then(handleResponse),
  addTicketMessage: (number: string, data: any) => fetch(`${BASE}/tickets/${encodeURIComponent(number)}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(handleResponse),

  // Admin (cookie-based auth)
  adminLogin: (data: any) => fetch(`${BASE}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) }).then(handleResponse),
  adminLogout: () => fetch(`${BASE}/admin/logout`, { method: "POST", credentials: "include" }).then(handleResponse),
  adminMe: () => fetch(`${BASE}/admin/me`, { credentials: "include" }).then(handleResponse),
  getAdminTickets: () => fetch(`${BASE}/admin/tickets`, { credentials: "include" }).then(handleResponse),
  getAdminTicket: (id: string) => fetch(`${BASE}/admin/tickets/${id}`, { credentials: "include" }).then(handleResponse),
  updateTicketStatus: (id: string, status: string) => fetch(`${BASE}/admin/tickets/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status }) }).then(handleResponse),
  adminReply: (id: string, message: string) => fetch(`${BASE}/admin/tickets/${id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ message }) }).then(handleResponse),
  adminCreateTicket: (data: any) => fetch(`${BASE}/admin/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) }).then(handleResponse),
};
