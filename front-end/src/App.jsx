// 
import WhiteboardApp from "./pages/WhiteboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import TopNav from "./components/TopNav";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext/";

//Home Links to landing page - login to loginpage - whiteboard to whiteboardpage - settings to settingspage


function App() {
  return (
    <AuthProvider>
      <Router>
        <TopNav />
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
  