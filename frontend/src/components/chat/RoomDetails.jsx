import React, { useState } from "react";
import {
  X,
  Shield,
  UserX,
  UserPlus,
  Users,
  Calendar,
  AlertCircle,
  Palette,
} from "lucide-react";
import { chatService } from "../../services/chatService";

export default function RoomDetails({
  room,
  currentUser,
  onClose,
  onMemberUpdated,
  onRoomLeft,
  appearance,
  onAppearanceChange,
  onAppearanceReset,
  onOpenProfile,
}) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!room) return null;

  const currentMember = room.members?.find((m) => m.userId === currentUser.id);
  const isAdmin =
    currentMember?.role === "ADMIN_ROOM" ||
    room.createdBy?.id === currentUser.id;
  const isGroup = room.type === "GROUP";

  const handleOpenAdd = async () => {
    setError("");
    setShowAddMember(true);
    try {
      const allUsers = await chatService.getUsers();
      const currentMemberIds = new Set(room.members?.map((m) => m.userId));
      const notInRoom = allUsers.filter((u) => !currentMemberIds.has(u.id));
      setAvailableUsers(notInRoom);
      if (notInRoom.length > 0) {
        setSelectedUserId(notInRoom[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch available users.");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setLoading(true);
    setError("");
    try {
      await chatService.addMember(room.id, selectedUserId);
      setShowAddMember(false);
      onMemberUpdated(room.id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to add member.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await chatService.removeMember(room.id, userId);
      if (userId === currentUser.id) {
        onRoomLeft(room.id);
      } else {
        onMemberUpdated(room.id);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to remove member.");
    }
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm("Are you sure you want to leave this room?")) return;
    try {
      await chatService.removeMember(room.id, currentUser.id);
      onRoomLeft(room.id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to leave room.");
    }
  };

  return (
    <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col text-slate-800 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-900">Room Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Info card */}
        <div className="text-center pb-4 border-b border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-[#FEDBD0] mx-auto mb-3 flex items-center justify-center text-slate-800 shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-900 text-base truncate">
            {room.name}
          </h4>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEDBD0] text-slate-700 border border-[#f4c5b6]">
            {room.type} CHAT
          </span>
          {room.createdAt && (
            <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Created{" "}
              {new Date(room.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Per-room chat colors */}
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4" /> Appearance
            </h5>
            <button
              type="button"
              onClick={onAppearanceReset}
              className="text-xs font-medium text-[#a6533e] hover:text-[#873f2e]"
            >
              Reset
            </button>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 text-xs text-slate-700">
              <span>Message color</span>
              <span className="flex items-center gap-2 font-mono text-slate-500">
                {appearance.messageColor.toUpperCase()}
                <input
                  type="color"
                  value={appearance.messageColor}
                  onChange={(event) =>
                    onAppearanceChange("messageColor", event.target.value)
                  }
                  className="w-11 h-9 p-1 rounded-lg border border-slate-300 bg-white cursor-pointer"
                  aria-label="Message color"
                />
              </span>
            </label>
            <label className="flex items-center justify-between gap-3 text-xs text-slate-700">
              <span>Chat background</span>
              <span className="flex items-center gap-2 font-mono text-slate-500">
                {appearance.backgroundColor.toUpperCase()}
                <input
                  type="color"
                  value={appearance.backgroundColor}
                  onChange={(event) =>
                    onAppearanceChange("backgroundColor", event.target.value)
                  }
                  className="w-11 h-9 p-1 rounded-lg border border-slate-300 bg-white cursor-pointer"
                  aria-label="Chat background color"
                />
              </span>
            </label>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Colors are saved for this room on this browser.
          </p>
        </div>

        {/* Members section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Members ({room.members?.length || 0})
            </h5>
            {isGroup && isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="text-xs text-[#a6533e] hover:text-[#873f2e] flex items-center gap-1 font-medium"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add
              </button>
            )}
          </div>

          {error && (
            <div className="p-2 mb-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add member inline form */}
          {showAddMember && (
            <form
              onSubmit={handleAddMember}
              className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-200"
            >
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Select User
              </label>
              {availableUsers.length === 0 ? (
                <p className="text-xs text-slate-500 mb-2">
                  No other users to add.
                </p>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 mb-2 focus:outline-none focus:border-[#c47c68]"
                >
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName || u.username} (@{u.username})
                    </option>
                  ))}
                </select>
              )}
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || availableUsers.length === 0}
                  className="px-3 py-1 bg-[#FEDBD0] hover:bg-[#f4c5b6] text-slate-900 text-xs font-medium rounded-lg disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          )}

          {/* Members list */}
          <div className="space-y-2">
            {room.members?.map((member) => {
              const isMemberAdmin = member.role === "ADMIN_ROOM";
              const canKick =
                isGroup && isAdmin && member.userId !== currentUser.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <button type="button" onClick={() => onOpenProfile(member.userId)} title="Xem trang cá nhân"
                    className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-75">
                    <div className="relative shrink-0">
                      <img
                        src={
                          member.avatarUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${member.username}`
                        }
                        alt={member.username}
                        className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-white ${
                          member.status === "ONLINE"
                            ? "bg-emerald-500"
                            : "bg-slate-500"
                        }`}
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1">
                        {member.displayName || member.username}
                        {member.userId === currentUser.id && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        {isMemberAdmin ? (
                          <span className="text-amber-700 flex items-center gap-0.5 font-medium">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span>@{member.username}</span>
                        )}
                      </div>
                    </div>
                  </button>

                  {canKick && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      title="Remove member"
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Room Action */}
        {isGroup && (
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleLeaveRoom}
              className="w-full py-2 px-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition"
            >
              Leave Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
