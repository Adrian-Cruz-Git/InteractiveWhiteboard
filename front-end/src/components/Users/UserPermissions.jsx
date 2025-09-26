import "./UserPermissions.css";
import { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

function UserPermissions({ boardId }) {
    const [user, setUser] = useState(null);
    const [userPermission, setUserPermission] = useState("viewer");

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            
            // Fetch user permissions for the active board
            if (currentUser && boardId) {
                fetchUserPermissions(currentUser.uid, boardId);
            } else {
                setUserPermission("viewer");
            }
        });
        return () => unsubscribe();
    }, [boardId]);

    // Mock function to fetch user permissions (replace with actual API call)
    const fetchUserPermissions = async (userId, boardId) => {
        try {
            // TODO: Replace with actual API call to the backend
            // const response = await fetch(`/api/boards/${boardId}/permissions/${userId}`);
            // const data = await response.json();
            // setUserPermission(data.permission);
            
            // Mocked data for now
            const mockPermissions = {
                'board1': 'owner',
                'board2': 'editor',
                'board3': 'viewer'
            };
            setUserPermission(mockPermissions[`board${boardId}`] || 'viewer');
        } catch (error) {
            console.error('Failed to fetch user permissions:', error);
            setUserPermission("viewer");
        }
    };

    // Get permission display info
    const getPermissionInfo = (permission) => {
        const permissionMap = {
            'owner': { label: 'Owner', color: '#4CAF50', icon: '👑' },
            'editor': { label: 'Editor', color: '#2196F3', icon: '✏️' },
            'viewer': { label: 'Viewer', color: '#FF9800', icon: '👁️' }
        };
        return permissionMap[permission] || permissionMap['viewer'];
    };

    if (!user || !boardId) return null;

    const permissionInfo = getPermissionInfo(userPermission);

    return (
        <div
            className="permissions-btn"
            title={`Your permission: ${permissionInfo.label}`}
        >
            <span className="permission-icon">{permissionInfo.icon}</span>
            <span className="permission-label">{permissionInfo.label}</span>
        </div>
    );
}

export default UserPermissions;