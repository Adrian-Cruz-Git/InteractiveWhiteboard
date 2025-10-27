import "./BoardPermissionsManager.css";
import { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "../../config/api";

//Pop-up modal to manage board permissions

function BoardPermissionsManager({ boardId }) {
    const [user, setUser] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [userPermission, setUserPermission] = useState("viewer");
    const [allUsers, setAllUsers] = useState([]);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [loading, setLoading] = useState(false);

    const withAuth = (init = {}) => ({
        ...init,
        headers: { ...(init.headers || {}), Authorization: `Bearer ${user?.uid || ""}`, ...(user?.email ? { "X-User-Email": String(user.email).toLowerCase() } : {}), "Content-Type": "application/json", },
    });

    // Mock function to fetch user permissions (replace with actual API call)
    const fetchUserPermissions = async (boardId) => {
        try {
            setLoading(true);
            const response = await api(`/files/${encodneURIComponent(boardId)}/permissions`, withAuth());
            console.log('Fetched user permissions:', response);

            // Assuming response has a 'permission' field
            const permission = res?.permission ?? "none";
            setUserPermission(permission);
            return permission;
        } catch (error) {
            console.error('Failed to fetch user permissions:', error);
            setUserPermission("none");
            return "none";
        } finally {
            setLoading(false);
        }
    };

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser && boardId) {
                await fetchUserPermissions(boardId);
                await fetchAllBoardUsers(boardId);
            }
        });
        return () => unsubscribe();
    }, [boardId]);





    // Mock function to fetch all board users (replace with actual API call)
    const fetchAllBoardUsers = async (boardId) => {
        try {
            setLoading(true);
            const response = await api(`/files/${encodeURIComponent(boardId)}/users`, withAuth());

            const normalized = (response || []).map(u => ({
                id: u.user_id,
                displayName: u.display_name || "Unnamed User",
                email: u.email || "No Email",
                photoURL: u.photo_url || null,
                permission: u.permission || "viewer",
                isOnline: false,
                lastSeen: new Date()
            }));
            console.log('Fetched board users:', normalized);

            setAllUsers(normalized);
        } catch (error) {
            console.error('Failed to fetch board users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get permission display info
    const getPermissionInfo = (permission) => {
        const map = {
            owner: { label: "Owner", color: "#4CAF50", icon: "👑" },
            editor: { label: "Editor", color: "#2196F3", icon: "✏️" },
            viewer: { label: "Viewer", color: "#FF9800", icon: "👁️" },
            none: { label: "No access", color: "#9E9E9E", icon: "⛔" },
        };
        return map[permission] || map.viewer;
    };

    // Handle permission change (for owners/editors)
    const handlePermissionChange = async (userId, newPermission) => {
        if (userId === user.uid) {
            alert("You cannot change your own permission level.");
            return;
        }

        try {
            // Call to backend API to update permission
            // Return new permission on success

            // Update local state immediately for better UX
            setAllUsers(users =>
                users.map(boardUser => boardUser.id === userId ? { ...boardUser, permission: newPermission } : boardUser)
            );

            await api(`/files/${encodeURIComponent(boardId)}/permissions/${encodeURIComponent(userId)}`, { method: 'PUT', body: JSON.stringify({ permission: newPermission }) });

            const userName = allUsers.find((u) => u.id === userId)?.displayName || "User";

            console.log(`Updated user ${userId} permission to ${newPermission}`);

            alert(`${userName}'s permission updated to ${getPermissionInfo(newPermission).label}`);

        } catch (error) {
            console.error('Failed to update permission:', error);
            alert('Failed to update permission. Please try again.');

            // Revert the change in UI
            fetchAllBoardUsers(boardId);
        }
    };

    // Handle removing user from board
    const handleRemoveUser = async (userId) => {
        const userToRemove = allUsers.find(u => u.id === userId);

        if (!userToRemove) return;

        if (userId === user.uid) {
            alert("You cannot remove yourself from the board.");
            return;
        }

        if (!window.confirm(`Are you sure you want to remove ${userToRemove.displayName} from the board? This action cannot be undone.`)) {
            return;
        }

        try {
            // TODO: Replace with actual API call
            // await fetch(`/api/boards/${boardId}/users/${userId}`, {
            //     method: 'DELETE',
            //     headers: {
            //         'Authorization': `Bearer ${await user.getIdToken()}`
            //     }
            // });

            // Update local state immediately
            setAllUsers(users => users.filter(boardUser => boardUser.id !== userId));

            console.log(`Removed user ${userId} from board`);
            alert(`${userToRemove.displayName} has been removed from the board.`);

        } catch (error) {
            console.error('Failed to remove user:', error);
            alert('Failed to remove user. Please try again.');

            // Refresh the user list
            fetchAllBoardUsers(boardId);
        }
    };

    // Handle adding new user
    const handleAddUser = async () => {
        const email = newUserEmail.trim().toLowerCase();

        if (!email) {
            alert('Please enter a valid email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Check if user already exists
        if (allUsers.some(u => u.email.toLowerCase() === email)) {
            alert('This user is already added to the board');
            return;
        }

        setIsAddingUser(true);
        try {
            // TODO: Replace with actual API call
            // const response = await fetch(`/api/boards/${boardId}/users`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${await user.getIdToken()}`
            //     },
            //     body: JSON.stringify({ 
            //         email: email,
            //         permission: 'viewer' // default permission
            //     })
            // });
            // const newUser = await response.json();

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock new user creation
            const mockNewUser = {
                id: `user_${Date.now()}`,
                displayName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
                email: email,
                photoURL: null,
                permission: 'viewer',
                isOnline: false,
                lastSeen: new Date()
            };

            setAllUsers(users => [...users, mockNewUser]);
            setNewUserEmail("");

            console.log(`Added new user: ${email}`);
            alert(`Successfully added ${email} as a viewer to the board.`);

        } catch (error) {
            console.error('Failed to add user:', error);
            alert('Failed to add user. Please check the email and try again.');
        } finally {
            setIsAddingUser(false);
        }
    };

    // Format last seen time
    const formatLastSeen = (lastSeen) => {
        const now = new Date();
        const diff = now - lastSeen;
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;

        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}w ago`;

        return lastSeen.toLocaleDateString();
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowPermissionsModal(false);
        setNewUserEmail("");
    };

    // Handle escape key
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && showPermissionsModal) {
                handleCloseModal();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [showPermissionsModal]);

    if (!user || !boardId) return null;

    const canManagePermissions = userPermission === 'owner' || userPermission === 'editor';
    const isOwner = userPermission === 'owner';
    const onlineUsersCount = allUsers.filter(u => u.isOnline).length;

    return (
        <>
            <button
                onClick={() => setShowPermissionsModal(true)}
                className="permissions-manager-btn"
                title="Manage board permissions"
            >
                <span>👥</span>
                <span>Users</span>
                {allUsers.length > 0 && (
                    <span className="user-count">({allUsers.length})</span>
                )}
            </button>

            {showPermissionsModal && (
                <div className="permissions-modal-overlay" onClick={handleCloseModal}>
                    <div className="permissions-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="permissions-modal-header">
                            <h3>Board Permissions - Board {boardId}</h3>
                            <button className="close-btn" onClick={handleCloseModal}>×</button>
                        </div>
                        <div className="permissions-modal-content">
                            {loading && (
                                <div className="loading-indicator">
                                    <div className="spinner"></div>
                                    <span>Loading...</span>
                                </div>
                            )}

                            <div className="current-permission">
                                <h4>Your Permission</h4>
                                <div className="permission-item">
                                    <span className="permission-icon">{getPermissionInfo(userPermission).icon}</span>
                                    <span className="permission-label">{getPermissionInfo(userPermission).label}</span>
                                    <span
                                        className="permission-badge"
                                        style={{ backgroundColor: getPermissionInfo(userPermission).color }}
                                    ></span>
                                </div>
                                <p className="permission-description">
                                    {userPermission === 'owner' && "You have full control over this board and can manage all users."}
                                    {userPermission === 'editor' && "You can edit the board and manage viewer permissions."}
                                    {userPermission === 'viewer' && "You can view the board but cannot make changes."}
                                </p>
                            </div>

                            <div className="all-users">
                                <div className="users-header">
                                    <div className="users-info">
                                        <h4>All Users ({allUsers.length})</h4>
                                        <span className="online-count">{onlineUsersCount} online</span>
                                    </div>
                                    {isOwner && (
                                        <div className="add-user-section">
                                            <input
                                                type="email"
                                                value={newUserEmail}
                                                onChange={(e) => setNewUserEmail(e.target.value)}
                                                placeholder="Enter email address"
                                                className="add-user-input"
                                                onKeyPress={(e) => e.key === 'Enter' && !isAddingUser && handleAddUser()}
                                                disabled={isAddingUser}
                                            />
                                            <button
                                                className="add-user-btn"
                                                onClick={handleAddUser}
                                                disabled={isAddingUser || !newUserEmail.trim()}
                                            >
                                                {isAddingUser ? (
                                                    <>
                                                        <div className="mini-spinner"></div>
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>+ Add</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="users-list">
                                    {allUsers.length === 0 ? (
                                        <div className="empty-state">
                                            <span>No users found</span>
                                        </div>
                                    ) : (
                                        allUsers.map((boardUser) => (
                                            <div key={boardUser.id} className="user-item">
                                                <div className="user-info">
                                                    <div className="user-avatar-container">
                                                        {boardUser.photoURL ? (
                                                            <img
                                                                src={boardUser.photoURL}
                                                                alt={boardUser.displayName}
                                                                className="user-item-avatar"
                                                            />
                                                        ) : (
                                                            <span className="user-item-avatar">
                                                                {boardUser.displayName?.[0]?.toUpperCase() || '?'}
                                                            </span>
                                                        )}
                                                        {boardUser.isOnline && <div className="online-status"></div>}
                                                    </div>
                                                    <div className="user-details">
                                                        <span className="user-name">
                                                            {boardUser.displayName}
                                                            {boardUser.id === user.uid && <span className="you-indicator">(You)</span>}
                                                        </span>
                                                        <span className="user-email">{boardUser.email}</span>
                                                        <span className="user-status">
                                                            {boardUser.isOnline ? (
                                                                <span className="status-online">● Online</span>
                                                            ) : (
                                                                <span className="status-offline">Last seen {formatLastSeen(boardUser.lastSeen)}</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="user-permission">
                                                    {canManagePermissions && boardUser.permission !== 'owner' && boardUser.id !== user.uid ? (
                                                        <select
                                                            value={boardUser.permission}
                                                            onChange={(e) => handlePermissionChange(boardUser.id, e.target.value)}
                                                            className="permission-select"
                                                        >
                                                            <option value="viewer">👁️ Viewer</option>
                                                            <option value="editor">✏️ Editor</option>
                                                            {isOwner && <option value="owner">👑 Owner</option>}
                                                        </select>
                                                    ) : (
                                                        <div className="permission-display">
                                                            <span className="permission-icon">{getPermissionInfo(boardUser.permission).icon}</span>
                                                            <span className="permission-label">{getPermissionInfo(boardUser.permission).label}</span>
                                                        </div>
                                                    )}
                                                    {isOwner && boardUser.permission !== 'owner' && boardUser.id !== user.uid && (
                                                        <button
                                                            onClick={() => handleRemoveUser(boardUser.id)}
                                                            className="remove-user-btn"
                                                            title="Remove user from board"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default BoardPermissionsManager;