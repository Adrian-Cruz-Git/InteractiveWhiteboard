// src/pages/LandingPage.jsx
import TopNav from "../components/TopNav";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
    const navigate = useNavigate();

    const createNewWhiteboard = () => {
        navigate("/whiteboard"); // WhiteboardPage can handle generating ID
    };

    const openFromFiles = () => {
        navigate("/files");
    };

    return (
        <div className="landing-page-wrapper">
            {/* Top navigation with login/logout */}
            <TopNav />

            {/* Main landing content */}
            <div className="landing-page">
                <div className="welcome-card">
                    <h1>Welcome to Interactive Online Whiteboard</h1>
                    <p>How would you like to get started?</p>
                    <div className="welcome-buttons">
                        <button onClick={openFromFiles} className="welcome-btn open-files">
                            📂 Open from Files
                        </button>
                        <button onClick={createNewWhiteboard} className="welcome-btn create-new">
                            ✨ Create New
                        </button>
                    </div>
                    <div className="welcome-tip">
                        💡 <strong>Tip:</strong> You can always create additional whiteboards
                        or open saved ones using the navigation bar above.
                    </div>
                </div>
            </div>
        </div>
    );
}
