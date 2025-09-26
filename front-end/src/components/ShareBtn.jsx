import { useState } from "react";
import "./ShareBtn.css"; // You'll need to create this CSS file or add styles to your existing CSS

function ShareBtn({ activeBoard }) {
    const [showShareModal, setShowShareModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

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
            <button onClick={() => setShowShareModal(true)} className="share">
                Share
            </button>

            {/* Share Modal */}
            {showShareModal && (
                <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <h3>Share Board {activeBoard}</h3>
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
                                <button className="close-btn" onClick={() => setShowShareModal(false)}>
                                    ×
                                </button>
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

export default ShareBtn;