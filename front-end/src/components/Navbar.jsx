import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/useAuth";
import "./Navbar.css";

export default function Navbar() {
  // ✅ useAuth provides `user` not `currentUser`
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="flex justify-between items-center bg-gray-800 text-white p-3">
      <h1
        className="text-lg font-bold cursor-pointer"
        onClick={() => navigate("/")}
      >
        Interactive Whiteboard
      </h1>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span>{user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-green-500 px-3 py-1 rounded hover:bg-green-600"
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
