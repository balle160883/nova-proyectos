const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('monday_m365_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem('monday_m365_token');
    localStorage.removeItem('monday_m365_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return [];
  }
  const json = await res.json();
  return json;
}

export const api = {
  // Auth & Session
  async loginPassword(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.accessToken) {
      localStorage.setItem('monday_m365_token', json.accessToken);
    }
    return json;
  },

  async loginEntraId(data: { email: string; name: string }) {
    const res = await fetch(`${API_BASE}/auth/sso/entra-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.accessToken) {
      localStorage.setItem('monday_m365_token', json.accessToken);
    }
    return json;
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getAuthHeaders(),
    });
    const json = await handleResponse(res);
    return Array.isArray(json) ? json : [];
  },

  async createUser(data: any) {
    const res = await fetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateUser(id: string, data: any) {
    const res = await fetch(`${API_BASE}/auth/users/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteUser(id: string) {
    const res = await fetch(`${API_BASE}/auth/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Boards
  async getBoards() {
    const res = await fetch(`${API_BASE}/boards`, {
      headers: getAuthHeaders(),
    });
    const json = await handleResponse(res);
    return Array.isArray(json) ? json : [];
  },

  async getBoard(id: string) {
    const res = await fetch(`${API_BASE}/boards/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createBoard(data: any) {
    const res = await fetch(`${API_BASE}/boards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateBoard(id: string, data: { title?: string; description?: string }) {
    const res = await fetch(`${API_BASE}/boards/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteBoard(id: string) {
    const res = await fetch(`${API_BASE}/boards/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createGroup(data: any) {
    const res = await fetch(`${API_BASE}/boards/groups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createItem(data: any) {
    const res = await fetch(`${API_BASE}/boards/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateItem(id: string, data: any) {
    const res = await fetch(`${API_BASE}/boards/items/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteItem(id: string) {
    const res = await fetch(`${API_BASE}/boards/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Automations
  async getAutomations(boardId: string) {
    const res = await fetch(`${API_BASE}/automations/board/${boardId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAutomationTemplates() {
    const res = await fetch(`${API_BASE}/automations/templates`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createAutomation(data: any) {
    const res = await fetch(`${API_BASE}/automations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async toggleAutomation(id: string, isEnabled: boolean) {
    const res = await fetch(`${API_BASE}/automations/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isEnabled }),
    });
    return handleResponse(res);
  },

  // Microsoft Graph API & Meetings
  async syncOutlookCalendar(itemId: string, title: string, dueDate?: string) {
    const res = await fetch(`${API_BASE}/graph/calendar/sync-item`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemId, title, dueDate }),
    });
    return handleResponse(res);
  },

  async getMeetings(boardId: string) {
    const res = await fetch(`${API_BASE}/meetings/board/${boardId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createMeeting(data: any) {
    const res = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async convertActionItemToTask(actionItemId: string, data: any) {
    const res = await fetch(`${API_BASE}/meetings/action-items/${actionItemId}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};
