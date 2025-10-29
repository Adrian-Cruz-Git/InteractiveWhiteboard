import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "./AuthContext";
import { api } from "../config/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setSessionReady(false);
      try {
        if (firebaseUser) {
          // Establish backend session (sets __session cookie)
          const idToken = await firebaseUser.getIdToken(true);
          await api("/session/login", {method: "POST", body: { idToken }, });
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

  return (
    <AuthContext.Provider value={{ user, loading, sessionReady }}>
      {children}
    </AuthContext.Provider>
  );
}
