import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "./AuthContext";
import { api } from "../config/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  const promotedForUidRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setSessionReady(false);
      promotedForUidRef.current = null;

      try {
        if (firebaseUser) {
          // Establish backend session (sets __session cookie)
          const idToken = await firebaseUser.getIdToken(true);
          await api("/session/login", { method: "POST", body: { idToken }, });
          setSessionReady(true);
        } else {
          // Clear cookie session if present
          try {
            await api("/session/logout", { method: "POST" });
          } catch {
            /* ignore */
          }
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionReady || !user) return;
    if (promotedForUidRef.current === user.uid) return; // already promoted this session

    (async () => {
      try {
        await api("/invitations/promote-pending", { method: "POST" });
      } catch {
        // non-fatal; ignore errors so login flow isn't blocked
      } finally {
        promotedForUidRef.current = user.uid;
      }
    })();
  }, [sessionReady, user]);

  return (
    <AuthContext.Provider value={{ user, loading, sessionReady }}>
      {children}
    </AuthContext.Provider>
  );
}
