import "./Navbar.css";
import { useEffect, useState } from "react";
import { auth } from "../firebase"; // make sure you export these
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

function Navbar({ boards, activeBoard, onSelectBoard, onAddBoard }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // listen for login/logout
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Google login error:", err);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <nav className="navbar">
            <div className="board-controls">
                {boards.map((board) => (
                    <button
                        key={board.id}
                        onClick={() => onSelectBoard(board.id)}
                        className={activeBoard === board.id ? "active" : ""}
                    >
                        Board {board.id}
                    </button>
                ))}
                <button onClick={onAddBoard} className="new-board">
                    New Board
                </button>
            </div>

            <div className="auth-controls">
                {user ? (
                    <>
                        <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="user-avatar"
                        />
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </>
                ) : (
                    <button onClick={handleLogin} className="login-btn">
                        Login with Google
                    </button>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
