export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';

// Add this helper:
export function authHeadersFromUser(user) {
  // Try stable places Firebase puts the token without needing async getIdToken()
  const token =
    user?.accessToken ||
    user?.stsTokenManager?.accessToken ||
    null;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api(path, { method = 'GET', headers = {}, body } = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };

  // Correct body handling
  if (body !== undefined) {
    if (typeof body === "string") {
      opts.body = body;
    } else {
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (!res.ok) {
    // Read text once. parse if json
    const text = await res.text();
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
  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}