import React, { useState } from "react";
import {
  X,
  Shield,
  UserX,
  UserPlus,
  Users,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { chatService } from "../../services/chatService";

export default function RoomDetails({
  room,
  currentUser,
  onClose,
  onMemberUpdated,
  onRoomLeft,
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
    <div className="w-80 h-full bg-slate-900/90 border-l border-slate-800 flex flex-col text-slate-200 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-white">Room Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Info card */}
        <div className="text-center pb-4 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 mx-auto mb-3 flex items-center justify-center text-white shadow-lg">
            <Users className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-white text-base truncate">
            {room.name}
          </h4>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {room.type} CHAT
          </span>
          {room.createdAt && (
            <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Created{" "}
              {new Date(room.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Members section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Members ({room.members?.length || 0})
            </h5>
            {isGroup && isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
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
              className="p-3 bg-slate-800/80 rounded-xl mb-3 border border-slate-700"
            >
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mb-2 focus:outline-none focus:border-indigo-500"
                >
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              )}
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || availableUsers.length === 0}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
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
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={
                          member.avatarUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${member.username}`
                        }
                        alt={member.username}
                        className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-slate-900 ${
                          member.status === "ONLINE"
                            ? "bg-emerald-500"
                            : "bg-slate-500"
                        }`}
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                        {member.username}
                        {member.userId === currentUser.id && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        {isMemberAdmin ? (
                          <span className="text-amber-400 flex items-center gap-0.5 font-medium">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span>Member</span>
                        )}
                      </div>
                    </div>
                  </div>

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
          <div className="pt-4 border-t border-slate-800">
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
