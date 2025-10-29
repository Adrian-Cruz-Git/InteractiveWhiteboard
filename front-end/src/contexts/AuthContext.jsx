import { createContext } from "react";

// Context only, no logic here
export const AuthContext = createContext({ user: null, loading: true, sessionReady: false });
