import "./OnlineUsers.css";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/useAuth";

function OnlineUsers({ client, boardId }) {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [connectionState, setConnectionState] = useState('disconnected');
    const [debugInfo, setDebugInfo] = useState('');
    const { user } = useAuth();

    


    useEffect(() => {
        const channel = client.channels.get(`whiteboard-presence-${boardId}`);
        // Monitor connection state
        const updateConnectionState = () => {
            const state = client.connection.state;
            setConnectionState(state);
        };

        updateConnectionState();
        client.connection.on('statechange', updateConnectionState);

        const handlePresence = () => {
            channel.presence.get()
                .then((members) => {
                    const users = members.map((m) => ({
                        id: m.clientId,
                        displayName: m.data?.displayName || m.clientId,
                        permission: m.data?.permission || "viewer",
                        photoURL: m.data?.photoURL || null,
                    }));
                    
                    setOnlineUsers(users);
                })
                .catch((err) => {
                    console.log("Error getting presence members:", err);
                });
        };

        const currentUser = {
            displayName: user?.displayName || user?.email || 'Anonymous',
            permission: "editor",
            photoURL: user?.photoURL || null,
            userId: user?.id || user?.email, // Add explicit user ID
        };


        const enterPresence = () => {
            channel.presence.enter(currentUser)
                .then(() => {
                    handlePresence();
                })
                .catch((err) => {
                    console.log("Error entering presence:", err);
                });
        };

        const handleConnectionReady = () => {
            enterPresence();
        };

        // Handle different connection states
        if (client.connection.state === "connected") {
            enterPresence();
        } else if (client.connection.state === "connecting") {
            client.connection.once("connected", handleConnectionReady);
        } else {
            client.connection.once("connected", handleConnectionReady);
        }

        // Subscribe to presence events
        const onEnter = (member) => {
            // console.log("Member entered:", member);
            handlePresence();
        };

        const onLeave = (member) => {
            // console.log("Member left:", member);
            handlePresence();
        };

        const onUpdate = (member) => {
            // console.log("Member updated:", member);
            handlePresence();
        };

        channel.presence.subscribe("enter", onEnter);
        channel.presence.subscribe("leave", onLeave);
        channel.presence.subscribe("update", onUpdate);


        // Cleanup function
        return () => {
            
            channel.presence.leave()
                .then(() => {
                })
                .catch((err) => {
                    console.log("Error leaving presence:", err);
                });

            channel.presence.unsubscribe("enter", onEnter);
            channel.presence.unsubscribe("leave", onLeave);
            channel.presence.unsubscribe("update", onUpdate);
            
            client.connection.off('statechange', updateConnectionState);
            client.connection.off("connected", handleConnectionReady);
        };
    }, [client, boardId, user]);

    // Get permission display info
    const getPermissionInfo = (permission) => {
        const permissionMap = {
            'owner': { label: 'Owner', color: '#4CAF50', icon: '👑' },
            'editor': { label: 'Editor', color: '#2196F3', icon: '✏️' },
            'viewer': { label: 'Viewer', color: '#FF9800', icon: '👁️' }
        };
        return permissionMap[permission] || permissionMap['viewer'];
    };

    if (!onlineUsers.length) return null;

    return (
        <div>
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
        </div>
    );
}

export default OnlineUsers;