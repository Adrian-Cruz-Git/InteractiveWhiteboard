import React, { useState } from "react";
import "./Navbar.css";

//Nav bar for whiteboard component (new board button)

function Navbar({ boards, activeBoard, onSelectBoard, onAddBoard }) {
    const [showShareModal, setShowShareModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Generate shareable link (customise in future get id from url or backend)
    const generateShareLink = () => {
        const baseUrl = window.location.origin;
        const boardPath = `/board/${activeBoard}`;
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
    // // Send link via email - Future
    // const handleSendTo = () => {
    //     const shareLink = generateShareLink();
    //     const subject = `Check out this whiteboard - Board ${activeBoard}`;
    //     const body = `I'd like to share this whiteboard with you: ${shareLink}`;
    //     window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    // };

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
            </nav>

            {showShareModal && (
                <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <h3>Share Board {activeBoard}</h3>
                            <button 
                                className="close-btn" 
                                onClick={() => setShowShareModal(false)}
                            >
                                ×
                            </button>
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
                                
                                {/* <button 
                                    onClick={handleSendTo} 
                                    className="send-to-btn"
                                >
                                    Send via Email
                                </button> */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Navbar;