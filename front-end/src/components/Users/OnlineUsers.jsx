import "./OnlineUsers.css";
import { useState, useEffect } from "react";

// Component to display online users with avatars and permission indicators on the navbar
//Right now its hardcoded mock data, but should be replaced with real-time data from backend (connect to supabase)

function OnlineUsers({ boardId }) {
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Mock function to fetch online users (replace with real-time listener)
    useEffect(() => {
        if (boardId) {
            // TODO: Replace with actual real-time listener (e.g., Socket.io, Firebase Realtime Database)
            const mockOnlineUsers = [
                {
                    id: "user1",
                    displayName: "John Doe",
                    photoURL: "https://via.placeholder.com/32",
                    permission: "owner"
                },
                {
                    id: "user2", 
                    displayName: "Jane Smith",
                    photoURL: null,
                    permission: "editor"
                },
                {
                    id: "user3",
                    displayName: "Bob Wilson",
                    photoURL: "https://via.placeholder.com/32",
                    permission: "viewer"
                },
                {
                    id: "user4",
                    displayName: "Alice Johnson",
                    photoURL: null,
                    permission: "editor"
                },
                {
                    id: "user5",
                    displayName: "Charlie Brown",
                    photoURL: "https://via.placeholder.com/32",
                    permission: "viewer"
                }
            ];
            setOnlineUsers(mockOnlineUsers);
        }
    }, [boardId]);

    // Get permission display info
    const getPermissionInfo = (permission) => {
        const permissionMap = {
            'owner': { label: 'Owner', color: '#4CAF50', icon: '👑' },
            'editor': { label: 'Editor', color: '#2196F3', icon: '✏️' },
            'viewer': { label: 'Viewer', color: '#FF9800', icon: '👁️' }
        };
        return permissionMap[permission] || permissionMap['viewer']; // default to viewer
    };

    if (!onlineUsers.length) return null;

    return (
        <div className="online-users-stack">
            {onlineUsers.slice(0, 4).map((onlineUser, index) => (
                <div
                    key={onlineUser.id}
                    className="online-user-avatar"
                    style={{ zIndex: onlineUsers.length - index }}
                    title={`${onlineUser.displayName} (${getPermissionInfo(onlineUser.permission).label})`}
                >
                    {onlineUser.photoURL ? (
                        <img
                            src={onlineUser.photoURL}
                            alt={onlineUser.displayName}
                        />
                    ) : (
                        <span className="avatar-initials">
                            {onlineUser.displayName?.[0] || '?'}
                        </span>
                    )}
                    <div 
                        className="permission-indicator"
                        style={{ backgroundColor: getPermissionInfo(onlineUser.permission).color }}
                    ></div>
                </div>
            ))}
            {onlineUsers.length > 4 && (
                <div className="more-users-indicator">
                    +{onlineUsers.length - 4}
                </div>
            )}
        </div>
    );
}

export default OnlineUsers;