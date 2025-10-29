export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function api(path, { method = 'GET', headers = {}, body } = {}) {
  const opts = { method, credentials: "include", headers: { "Content-Type": "application/json", ...headers }, };

  // Correct body handling
  if (body !== undefined) {
    if (typeof body === "string") {
      opts.body = body;
    } else {
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, opts);

  const text = await res.text();

  if (!res.ok) {
    // Read text once. parse if json
    let message = text || `${res.status} ${res.statusText}`;
    try {
      const j = text ? JSON.parse(text) : null;
      if (j && (j.error || j.message)) {
        message = j.error || j.message;
      }
    } catch { }
    throw new Error(message);
  }

  if (res.status === 204) {
    return null;
  }
  
  // success: parse body once
  if (!text) {
    return null;

  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}