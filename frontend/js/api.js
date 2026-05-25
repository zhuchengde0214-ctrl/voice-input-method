// Thin REST client for the backend. Resolves the API base from a meta tag
// when present, so the same bundle can be served behind a proxy without
// rebuilding.

const meta = document.querySelector('meta[name="api-base"]');
export const API_BASE =
  (meta && meta.getAttribute('content')) ||
  (location.port === '3000' ? 'http://localhost:3001' : `${location.origin}`);

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  enhance: (text, hotwords = [], options = {}) =>
    request('/api/enhance', {
      method: 'POST',
      body: JSON.stringify({ text, hotwords, options }),
    }),
  parseCommand: (text) =>
    request('/api/command', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  listHotwords: () => request('/api/hotwords'),
  addHotword: (term, aliases) =>
    request('/api/hotwords', {
      method: 'POST',
      body: JSON.stringify({ term, aliases }),
    }),
  deleteHotword: (id) => request(`/api/hotwords/${id}`, { method: 'DELETE' }),
  listHistory: () => request('/api/history'),
  saveHistory: (text) =>
    request('/api/history', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  deleteHistory: (id) => request(`/api/history/${id}`, { method: 'DELETE' }),
  clearHistory: () => request('/api/history', { method: 'DELETE' }),
  health: () => request('/api/health'),
};
