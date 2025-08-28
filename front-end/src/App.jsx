// 
import WhiteboardApp from "./pages/WhiteboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

//Home Links to landing page - login to loginpage - whiteboard to whiteboardpage - settings to settingspage

function App() {
  return (
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
  );
}

export default App;
