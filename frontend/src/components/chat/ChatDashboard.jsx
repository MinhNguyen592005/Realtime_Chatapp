import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import RoomDetails from "./RoomDetails";
import CreateRoomModal from "./CreateRoomModal";
import { chatService } from "../../services/chatService";
import { websocketService } from "../../services/websocket";

export default function ChatDashboard({ currentUser, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  // Load user's rooms
  const loadRooms = useCallback(async () => {
    try {
      const data = await chatService.getRooms();
      setRooms(data);
      if (data.length > 0 && !activeRoomId) {
        setActiveRoomId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  }, [activeRoomId]);

  // Initial load
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Connect WebSocket on mount
  useEffect(() => {
    websocketService.connect(
      () => {
        setConnected(true);
      },
      (err) => {
        console.error("WebSocket connection error:", err);
        setConnected(false);
      },
    );

    const unsubscribeConn = websocketService.onConnectionChange((status) => {
      setConnected(status);
    });

    // Subscribe to presence
    const unsubPresence = websocketService.subscribeToPresence((event) => {
      // Update member status in rooms
      setRooms((prevRooms) =>
        prevRooms.map((r) => ({
          ...r,
          members: r.members?.map((m) =>
            m.username === event.username ? { ...m, status: event.status } : m,
          ),
        })),
      );
    });

    return () => {
      unsubscribeConn();
      if (unsubPresence) unsubPresence();
      websocketService.disconnect();
    };
  }, []);

  // When active room changes, load details & messages and subscribe to room topic
  useEffect(() => {
    if (!activeRoomId) {
      setActiveRoom(null);
      setMessages([]);
      return;
    }

    let unsubRoom = null;
    let unsubTyping = null;

    const fetchRoomData = async () => {
      try {
        const [roomData, messageData] = await Promise.all([
          chatService.getRoomDetails(activeRoomId),
          chatService.getRoomMessages(activeRoomId),
        ]);

        setActiveRoom(roomData);
        setMessages(messageData);

        // Join room notification
        websocketService.joinRoom(activeRoomId);

        // Subscribe to real-time messages for this room
        unsubRoom = websocketService.subscribeToRoom(
          activeRoomId,
          (newMessage) => {
            setMessages((prev) => {
              // Avoid duplicate message if already present by id
              if (newMessage.id && prev.some((m) => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            // Update last message in rooms list
            setRooms((prevRooms) =>
              prevRooms.map((r) =>
                r.id === activeRoomId ? { ...r, lastMessage: newMessage } : r,
              ),
            );
          },
        );

        // Subscribe to typing indicator for this room
        unsubTyping = websocketService.subscribeToTyping(
          activeRoomId,
          (event) => {
            setTypingUsers((prev) => {
              const filtered = prev.filter(
                (u) => u.username !== event.username,
              );
              return event.typing ? [...filtered, event] : filtered;
            });
          },
        );
      } catch (err) {
        console.error("Failed to load room details/messages:", err);
      }
    };

    fetchRoomData();

    return () => {
      if (unsubRoom) unsubRoom();
      if (unsubTyping) unsubTyping();
      setTypingUsers([]);
    };
  }, [activeRoomId, connected]);

  const handleSendMessage = (content) => {
    if (!activeRoomId) return;
    websocketService.sendMessage(activeRoomId, content);
  };

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
    setActiveRoomId(newRoom.id);
  };

  const handleMemberUpdated = async (roomId) => {
    try {
      const updated = await chatService.getRoomDetails(roomId);
      setActiveRoom(updated);
      setRooms((prev) => prev.map((r) => (r.id === roomId ? updated : r)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoomLeft = (roomId) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setActiveRoomId(null);
    setActiveRoom(null);
    setShowDetails(false);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Column: Sidebar */}
      <Sidebar
        currentUser={currentUser}
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={(id) => setActiveRoomId(id)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onLogout={onLogout}
      />

      {/* Center Column: Chat Area */}
      <ChatArea
        activeRoom={activeRoom}
        messages={messages}
        currentUser={currentUser}
        typingUsers={typingUsers}
        onSendMessage={handleSendMessage}
        onToggleDetails={() => setShowDetails(!showDetails)}
        showDetails={showDetails}
      />

      {/* Right Column: Room Details (collapsible) */}
      {showDetails && activeRoom && (
        <RoomDetails
          room={activeRoom}
          currentUser={currentUser}
          onClose={() => setShowDetails(false)}
          onMemberUpdated={handleMemberUpdated}
          onRoomLeft={handleRoomLeft}
        />
      )}

      {/* Modal for creating a new room */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated}
        currentUser={currentUser}
      />
    </div>
  );
}
