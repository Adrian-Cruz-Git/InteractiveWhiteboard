export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function api(path, { method = 'GET', headers = {}, body } = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };

  if (body !== undefined) {
    if (opts.body = typeof body === 'string') {
      {
        opts.body = body;
      }
    } else {
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { }
    throw new Error(msg);
  }

  // 204 No Content case
  if (res.status === 204) return null;
  return res.json();
}
