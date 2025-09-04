// 
import WhiteboardApp from "./pages/WhiteboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

<<<<<<< Updated upstream
=======
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext/";
import RegisterPage from "./pages/RegisterPage.jsx"
import FilesPage from "./pages/FilesPage.jsx";

>>>>>>> Stashed changes
//Home Links to landing page - login to loginpage - whiteboard to whiteboardpage - settings to settingspage

function App() {
  return (
<<<<<<< Updated upstream
    <Router>
      <nav>
        <Link to="/">Home</Link> |  
        <Link to="/login">Login</Link> | 
        <Link to="/whiteboard">Whiteboard</Link> |
        <Link to="/settings">Settings</Link>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/whiteboard" element={<WhiteboardApp />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
=======
    <AuthProvider>
      <Router>
        <div style={{ paddingTop: "70px" }}>
          <Routes>
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/whiteboard" element={<WhiteboardApp />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/files" element={<FilesPage />} />
            </Route>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
>>>>>>> Stashed changes
  );
}

export default App;
