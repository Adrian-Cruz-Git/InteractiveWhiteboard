
import "./Navbar.css";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Navbar({ boards, activeBoard, onSelectBoard, onAddBoard }) {
    const [user, setUser] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const navigate = useNavigate();

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Generate shareable link
    const generateShareLink = () => {
        const baseUrl = window.location.origin;
        const boardPath = `/whiteboard/${activeBoard}`;
        return `${baseUrl}${boardPath}`;
    };

    // Copy link to clipboard
    const handleCopyLink = async () => {
        const shareLink = generateShareLink();
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <>
            <nav className="navbar">
                {boards.map((board) => (
                    <button
                        key={board.id}
                        onClick={() => onSelectBoard(board.id)}
                        className={activeBoard === board.id ? "active" : ""}
                    >
                        Board {board.id}
                    </button>
                ))}
                <button onClick={onAddBoard} className="new-board">New Board</button>
                <button onClick={() => setShowShareModal(true)} className="share">Share</button>
                {user ? (
                    <>
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || "User Avatar"}
                                className="user-avatar"
                            />
                        ) : (
                            <span className="user-avatar">{user.displayName?.[0]}</span>
                        )}
                    </>
                ) : (
                    <button
                        className="login-btn"
                        onClick={() => signInWithPopup(auth, new auth.GoogleAuthProvider())}
                    >
                        Login
                    </button>
                )}

            </nav>

            {showShareModal && (
                <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <h3>Share Board {activeBoard}</h3>
                            <button className="close-btn" onClick={() => setShowShareModal(false)}>×</button>
                        </div>
                        <div className="share-modal-content">
                            <div className="share-link-section">
                                <label>Shareable Link:</label>
                                <div className="link-container">
                                    <input
                                        type="text"
                                        value={generateShareLink()}
                                        readOnly
                                        className="share-link-input"
                                    />
                                </div>
                            </div>
                            <div className="share-actions">
                                <button
                                    onClick={handleCopyLink}
                                    className="copy-link-btn"
                                    disabled={copySuccess}
                                >
                                    {copySuccess ? '✓ Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Navbar;

