// Page for landing , option to authenticate if not logged in
// or to navigate to new whiteboard if you are

import TopNav from "../components/TopNav";
import { useAuth } from "../contexts/useAuth";
import { Link, useNavigate } from "react-router-dom";
import "./LandingPage.css";



function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleCreateWhiteboard = () => {
    navigate("/whiteboard"); 
  };

  const handleExploreTemplates = () => {
    navigate("/whiteboard"); // Change later to wherever templates are
  };

  return (
    <div>
      <TopNav />
      <div className="landing-container">
        <div className="landing-box">
          {currentUser ? ( // If logged in display create or from templates
            <>
              <h1>Welcome to the Whiteboard App</h1>
              <p>Start creating new whiteboards or explore templates.</p>
              <button
                className="landing-button"
                onClick={handleCreateWhiteboard}
              >
                Create Whiteboard
              </button>
              <button
                className="landing-button"
                onClick={handleExploreTemplates}
              >
                Explore Templates
              </button>
            </>
          ) : ( // If not logged in prompt to register / login
            <>
              <h1>Welcome!</h1>
              <p>
                Please <Link to="/login">Login</Link> or{" "}
                <Link to="/register">Register</Link> to access the Whiteboard App.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
