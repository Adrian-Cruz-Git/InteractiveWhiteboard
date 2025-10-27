import { getIdToken } from "firebase/auth";
import { auth } from "../firebase";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export async function api(path, { method = "GET", headers = {}, body } = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  };

  // Correct body handling (no accidental assignment; no nested blocks)
  if (body !== undefined) {
    if(typeof body === "string"){
      opts.body = body;
    } else {
      opts.body = JSON.stringify(body);
    }
  }

  // Attach Firebase ID token if available
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await getIdToken(user, /* forceRefresh */ false);
      opts.headers.Authorization = `Bearer ${token}`;
    } catch {
      // If token fetch fails, continue without header; server may still allow public endpoints
    }
  }

  const res = await fetch(`${API_BASE}${path}`, opts);

  // Read text once; parse if JSON — prevents "body stream already read"
  const text = await res.text();
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const parsed = isJson && text ? JSON.parse(text) : text || null;

  if (!res.ok) {
    const message =
      (isJson && parsed && (parsed.error || parsed.message)) ||
      text ||
      `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return parsed;
}
