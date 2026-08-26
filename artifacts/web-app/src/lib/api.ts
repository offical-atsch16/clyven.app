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
    throw new Error(parsed?.error || parsed?.message || text || `HTTP ${res.status}`);
  }
  return res.json();
}

async function getClerkToken(): Promise<string | null> {
  try {
    const clerk = typeof window !== "undefined" ? (window as any).Clerk : null;
    if (clerk && clerk.session && typeof clerk.session.getToken === "function") {
      const token = await clerk.session.getToken().catch(() => null);
      return token || null;
    }
  } catch (err) {
    // Ignore Clerk session errors when unauthenticated or offline
  }
  return null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getClerkToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });
  return handleResponse(res);
}

export const api = {
  // AI Endpoints
  getNotesAIAssistant: (data: { action: "fix_spelling" | "summarize" | "todo_list"; text: string }) =>
    request<{ success: boolean; result: string; action: string }>("/ai/notes-assistant", { method: "POST", body: JSON.stringify(data) }),
  getJournalAISummary: (entries: any[]) =>
    request<{ success: boolean; summary: string }>("/ai/journal-summary", { method: "POST", body: JSON.stringify({ entries }) }),
  aiChat: (data: { message: string; messages?: any[]; noteContext?: string }) =>
    request<{ success: boolean; message: { role: string; content: string; timestamp: string } }>("/ai/chat", { method: "POST", body: JSON.stringify(data) }),

  // Notes
  getNotes: () => request<any[]>("/notes"),
  createNote: (data: any) => request<any>("/notes", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id: string, data: any) => request<any>(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteNote: (id: string) => request<any>(`/notes/${id}`, { method: "DELETE" }),

  // Note Attachments
  getNoteAttachments: (noteId: string) => request<any[]>(`/notes/${noteId}/attachments`),
  getPresignedAttachmentUrl: (noteId: string, data: { fileName: string; fileSize: number; fileType?: string }) =>
    request<{ uploadUrl: string; fileUrl: string; key?: string; attachment?: any }>(`/notes/${noteId}/attachments/presigned-url`, { method: "POST", body: JSON.stringify(data) }),
  createNoteAttachment: (noteId: string, data: any) => request<any>(`/notes/${noteId}/attachments`, { method: "POST", body: JSON.stringify(data) }),
  deleteNoteAttachment: (noteId: string, attachmentId: string) => request<any>(`/notes/${noteId}/attachments/${attachmentId}`, { method: "DELETE" }),
  deleteAttachment: (attachmentId: string) => request<any>(`/attachments/${attachmentId}`, { method: "DELETE" }),

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

  // Newsletter
  subscribeNewsletter: (email: string) =>
    request<any>("/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  unsubscribeNewsletter: (email: string) =>
    request<any>("/newsletter/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // System Status & Settings
  getSystemStatus: () => fetch(`${API_BASE_URL}/banners/active?route=*`).then(handleResponse),

  // System Banners
  getActiveBanner: (route: string) => fetch(`${API_BASE_URL}/banners/active?route=${encodeURIComponent(route)}`).then(handleResponse),

  // User
  getMe: () => request<any>("/user/me"),
  syncPlan: () => request<any>("/user/sync-plan", { method: "POST" }),
  getStats: () => request<any>("/user/stats"),
  getSettings: () => request<any>("/user/settings"),
  saveSettings: (data: any) => request<any>("/user/settings", { method: "POST", body: JSON.stringify(data) }),

  // Tickets (public)
  createTicket: (data: any) => fetch(`${API_BASE_URL}/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(handleResponse),
  getTicket: (number: string, emailOrPasscode: string, passcode?: string) => {
    const pc = passcode || emailOrPasscode;
    const em = passcode ? emailOrPasscode : "";
    return fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(number)}?email=${encodeURIComponent(em)}&passcode=${encodeURIComponent(pc)}`, {
      headers: {
        "X-Ticket-Email": em,
        "X-Ticket-Passcode": pc
      }
    }).then(handleResponse);
  },
  addTicketMessage: (number: string, data: any) => fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(number)}/messages`, { method: "POST", headers: { "Content-Type": "application/json", "X-Ticket-Passcode": data.passcode || "" }, body: JSON.stringify(data) }).then(handleResponse),

  // Admin (cookie and token auth)
  adminLogin: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const result = await handleResponse(res);
    if (result.token && typeof window !== "undefined") {
      sessionStorage.setItem("admin_token", result.token);
    }
    return result;
  },
  adminLogout: async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_token");
    }
    return fetch(`${API_BASE_URL}/admin/logout`, {
      method: "POST",
      credentials: "include",
    }).then(handleResponse);
  },
  getAdminAuthHeaders: (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("admin_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  },
  adminMe: () => {
    const headers = api.getAdminAuthHeaders();
    delete headers["Content-Type"];
    return fetch(`${API_BASE_URL}/admin/me`, { headers, credentials: "include" }).then(handleResponse);
  },
  getAdminTickets: () => {
    const headers = api.getAdminAuthHeaders();
    delete headers["Content-Type"];
    return fetch(`${API_BASE_URL}/admin/tickets`, { headers, credentials: "include" }).then(handleResponse);
  },
  getAdminTicket: (id: string) => {
    const headers = api.getAdminAuthHeaders();
    delete headers["Content-Type"];
    return fetch(`${API_BASE_URL}/admin/tickets/${id}`, { headers, credentials: "include" }).then(handleResponse);
  },
  updateTicketStatus: (id: string, status: string) => fetch(`${API_BASE_URL}/admin/tickets/${id}/status`, {
    method: "PATCH",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ status })
  }).then(handleResponse),
  adminReply: (id: string, message: string) => fetch(`${API_BASE_URL}/admin/tickets/${id}/messages`, {
    method: "POST",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ message })
  }).then(handleResponse),
  adminCreateTicket: (data: any) => fetch(`${API_BASE_URL}/admin/tickets`, {
    method: "POST",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data)
  }).then(handleResponse),
  assignAdminTicket: (id: string, clerkUserId: string) => fetch(`${API_BASE_URL}/admin/tickets/${id}/assign`, {
    method: "PATCH",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ clerkUserId })
  }).then(handleResponse),
  deleteAdminTicket: (id: string) => fetch(`${API_BASE_URL}/admin/tickets/${id}`, {
    method: "DELETE",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
  }).then(handleResponse),

  // Admin Banners
  getAdminBanners: () => fetch(`${API_BASE_URL}/admin/banners`, {
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
  }).then(handleResponse),
  createAdminBanner: (data: any) => fetch(`${API_BASE_URL}/admin/banners`, {
    method: "POST",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then(handleResponse),
  updateAdminBanner: (id: string, data: any) => fetch(`${API_BASE_URL}/admin/banners/${id}`, {
    method: "PATCH",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then(handleResponse),
  deleteAdminBanner: (id: string) => fetch(`${API_BASE_URL}/admin/banners/${id}`, {
    method: "DELETE",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
  }).then(handleResponse),

  // Admin System Settings
  getAdminSettings: () => fetch(`${API_BASE_URL}/admin/settings`, {
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
  }).then(handleResponse),
  updateAdminSetting: (key: string, value: any, description?: string) => fetch(`${API_BASE_URL}/admin/settings`, {
    method: "POST",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ key, value, description }),
  }).then(handleResponse),

  // Feature Flags
  getFeatureFlags: () => request<{ flags: Record<string, boolean> }>("/feature-flags"),

  // Admin Feature Flags
  getAdminFeatureFlags: () => fetch(`${API_BASE_URL}/admin/feature-flags`, {
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
  }).then(handleResponse),
  createAdminFeatureFlag: (data: any) => fetch(`${API_BASE_URL}/admin/feature-flags`, {
    method: "POST",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then(handleResponse),
  updateAdminFeatureFlag: (id: string, data: any) => fetch(`${API_BASE_URL}/admin/feature-flags/${id}`, {
    method: "PATCH",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then(handleResponse),
  deleteAdminFeatureFlag: (id: string) => fetch(`${API_BASE_URL}/admin/feature-flags/${id}`, {
    method: "DELETE",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
  }).then(handleResponse),

  // User Audit & Impersonation
  searchAdminUsers: (query: string) => fetch(`${API_BASE_URL}/admin/users?search=${encodeURIComponent(query)}`, {
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
  }).then(handleResponse),
  getAdminUserAudit: (id: string) => fetch(`${API_BASE_URL}/admin/users/${id}/audit`, {
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
  }).then(handleResponse),
  impersonateAdminUser: (id: string) => fetch(`${API_BASE_URL}/admin/users/${id}/impersonate`, {
    method: "POST",
    headers: api.getAdminAuthHeaders(),
    credentials: "include",
  }).then(handleResponse),
};
