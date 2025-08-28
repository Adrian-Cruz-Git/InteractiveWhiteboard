//
import WhiteboardApp from "./pages/WhiteboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Landing</Link> | 
        <Link to="/login">Login</Link> | 
        <Link to="/whiteboard">Whiteboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/whiteboard" element={<WhiteboardApp />} />
      </Routes>
    </Router>
  );
}

export default App;
