// 
import WhiteboardApp from "./pages/WhiteboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext/";
import RegisterPage from "./pages/RegisterPage.jsx"

import { useState, useEffect } from "react";
import Spaces from "@ably/spaces";
import { Realtime } from "ably";
import { nanoid } from "nanoid";
import { config } from "./config";



//Home Links to landing page - login to loginpage - whiteboard to whiteboardpage - settings to settingspage

//NEW - Used for ably live cursors 
//Create ably client one time.
const client = new Realtime({ key: config.ABLY_KEY, clientId: nanoid() });
const spaces = new Spaces(client);
//Manually create channel
const cursorsChannel = client.channels.get('whiteboard-cursors');


function App() {
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
        <div style={{ paddingTop: "70px" }}>
          <Routes>
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/whiteboard" element={<WhiteboardApp />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
