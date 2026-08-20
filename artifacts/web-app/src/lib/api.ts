const rawBase = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");
export const API_BASE_URL = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

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
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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
  createTicket: (data: any) => fetch(`${API_BASE_URL}/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(handleResponse),
  getTicket: (number: string, passcode: string) => fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(number)}`, { headers: { "X-Ticket-Passcode": passcode } }).then(handleResponse),
  addTicketMessage: (number: string, data: any) => fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(number)}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(handleResponse),

  // Admin (cookie-based auth)
  adminLogin: (data: any) => fetch(`${API_BASE_URL}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) }).then(handleResponse),
  adminLogout: () => fetch(`${API_BASE_URL}/admin/logout`, { method: "POST", credentials: "include" }).then(handleResponse),
  adminMe: () => fetch(`${API_BASE_URL}/admin/me`, { credentials: "include" }).then(handleResponse),
  getAdminTickets: () => fetch(`${API_BASE_URL}/admin/tickets`, { credentials: "include" }).then(handleResponse),
  getAdminTicket: (id: string) => fetch(`${API_BASE_URL}/admin/tickets/${id}`, { credentials: "include" }).then(handleResponse),
  updateTicketStatus: (id: string, status: string) => fetch(`${API_BASE_URL}/admin/tickets/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status }) }).then(handleResponse),
  adminReply: (id: string, message: string) => fetch(`${API_BASE_URL}/admin/tickets/${id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ message }) }).then(handleResponse),
  adminCreateTicket: (data: any) => fetch(`${API_BASE_URL}/admin/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) }).then(handleResponse),
};
