// 
import { AuthProvider } from "./contexts/AuthProvider"; 
import { useAuth } from "./contexts/useAuth";
import { BrowserRouter as Router, Route, Routes, Link, Navigate} from "react-router-dom"
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FilesPage from "./pages/FilesPage";
import WhiteboardPage from "./pages/WhiteboardPage";
import SettingsPage from "./pages/SettingsPage";
import NavBar from "./components/Navbar";
//ably
import { useState, useEffect } from "react";
import Spaces from "@ably/spaces";
import { Realtime } from "ably";
import { nanoid } from "nanoid";
import { config } from "./config";

//NEW - Used for ably live cursors 
//Create ably client one time.
const client = new Realtime({ key: config.ABLY_KEY, clientId: nanoid() });
const spaces = new Spaces(client);
//Manually create channel
const cursorsChannel = client.channels.get('whiteboard-cursors');


function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
 
  
  return (
    <Routes>
      {/* Public pages */}
      {!user && ( // If not logged in
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} /> // Wildcard route (default route, any other link route to /login) 
        </>
      )}

      {/* Authenticated pages */}
      {user && (
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/whiteboard/:id" element={<WhiteboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/files" replace />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  
       //Live Cursors
  const [spaceName, setSpaceName] = useState("spaces-live-cursors");
  //Live Cursors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("name");
    if (name) setSpaceName(name);
  }, []);
  
  
  return (
    <AuthProvider>
      <Router>
        <NavBar />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
