import React, { useState, useEffect } from "react";
import { chatService } from "../../services/chatService";
import { X, Users, User, Check, Search } from "lucide-react";

export default function CreateRoomModal({
  isOpen,
  onClose,
  onRoomCreated,
  currentUser,
}) {
  const [roomType, setRoomType] = useState("DIRECT"); // 'DIRECT' or 'GROUP'
  const [roomName, setRoomName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSelectedUserIds([]);
      setRoomName("");
      setError("");
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const data = await chatService.getUsers();
      // Exclude self
      setUsers(data.filter((u) => u.id !== currentUser.id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const toggleUserSelection = (userId) => {
    if (roomType === "DIRECT") {
      setSelectedUserIds([userId]);
    } else {
      if (selectedUserIds.includes(userId)) {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
      } else {
        setSelectedUserIds([...selectedUserIds, userId]);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      setError("Please select at least one user.");
      return;
    }

    if (roomType === "GROUP" && !roomName.trim()) {
      setError("Please enter a group room name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const newRoom = await chatService.createRoom({
        name: roomType === "GROUP" ? roomName.trim() : null,
        type: roomType,
        memberIds: selectedUserIds,
      });
      onRoomCreated(newRoom);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {roomType === "DIRECT" ? (
              <User className="w-5 h-5 text-indigo-400" />
            ) : (
              <Users className="w-5 h-5 text-indigo-400" />
            )}
            {roomType === "DIRECT"
              ? "New Direct Conversation"
              : "Create Group Chat"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl my-4 border border-slate-700/50">
          <button
            type="button"
            onClick={() => {
              setRoomType("DIRECT");
              setSelectedUserIds([]);
              setError("");
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              roomType === "DIRECT"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Direct 1-on-1
          </button>
          <button
            type="button"
            onClick={() => {
              setRoomType("GROUP");
              setSelectedUserIds([]);
              setError("");
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              roomType === "GROUP"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Group Chat
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Group Name input */}
        {roomType === "GROUP" && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Group Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Engineering Team"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Search Users */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-60 mb-4">
          {filteredUsers.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500">
              No users found.
            </p>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUserIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUserSelection(u.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? "bg-indigo-600/20 border border-indigo-500/40"
                      : "hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={
                          u.avatarUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`
                        }
                        alt={u.username}
                        className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                          u.status === "ONLINE"
                            ? "bg-emerald-500"
                            : "bg-slate-500"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {u.username}
                      </div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-slate-600"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : roomType === "DIRECT"
                ? "Start Chat"
                : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
