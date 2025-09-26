import "./Navbar.css";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import OnlineUsers from "./Users/OnlineUsers";
import UserPermissions from "./Users/UserPermissions";
import BoardPermissionsManager from "./Users/BoardPermissionsManager";
import ShareBtn from "./ShareBtn"; // Import the new ShareBtn component

function Navbar({ boards = [], activeBoard, onSelectBoard, onAddBoard }) {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    return (
        <>
            <nav className="navbar">
                {/* Board Navigation */}
                <div className="board-navigation">
                    {boards.map((board) => (
                        <button
                            key={board.id}
                            onClick={() => {
                                // on click navigate to that board (update url id?, and set active board)
                                onSelectBoard(board.id);
                                navigate(`/whiteboard/?id=${board.id}`);
                            }}
                            className={activeBoard === board.id ? "active" : ""}
                        >
                            Board {board.id}
                        </button>
                    ))}
                    <button onClick={onAddBoard} className="new-board">
                        New Board
                    </button>
                </div>

                {/* User Management Section */}
                <div className="user-management">
                    <OnlineUsers boardId={activeBoard} />
                    <UserPermissions boardId={activeBoard} />
                    <BoardPermissionsManager boardId={activeBoard} />
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <ShareBtn activeBoard={activeBoard} />
                    
                    {user ? (
                        <div className="current-user">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || "User Avatar"}
                                    className="user-avatar"
                                />
                            ) : (
                                <span className="user-avatar">
                                    {user.displayName?.[0]}
                                </span>
                            )}
                        </div>
                    ) : (
                        <button
                            className="login-btn"
                            onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
                        >
                            Login
                        </button>
                    )}
                </div>
            </nav>
        </>
    );
}

export default Navbar;