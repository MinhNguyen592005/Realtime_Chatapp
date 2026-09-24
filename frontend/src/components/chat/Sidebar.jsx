import React, { useState } from "react";
import {
  LogOut,
  Plus,
  Search,
  MessageSquare,
  Users,
  User,
  Circle,
} from "lucide-react";

export default function Sidebar({
  currentUser,
  rooms,
  activeRoomId,
  onSelectRoom,
  onOpenCreateModal,
  onOpenProfile,
  onLogout,
  onlineUsers = {},
}) {
  const [filterTab, setFilterTab] = useState("ALL"); // 'ALL', 'DIRECT', 'GROUP'
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRooms = rooms.filter((room) => {
    const matchesType = filterTab === "ALL" ? true : room.type === filterTab;
    const matchesSearch =
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.lastMessage?.content
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="w-80 h-full flex flex-col bg-white border-r border-slate-200 text-slate-800 select-none">
      {/* User Profile Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <button type="button" onClick={onOpenProfile} title="Xem trang cá nhân"
          className="flex items-center gap-3 min-w-0 text-left rounded-xl hover:bg-slate-50 transition">
          <div className="relative shrink-0">
            <img
              src={
                currentUser?.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.username}`
              }
              alt={currentUser?.username}
              className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {currentUser?.displayName || currentUser?.username}
            </h3>
            <p className="text-xs text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
              Online
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={onOpenProfile} title="Trang cá nhân" aria-label="Trang cá nhân"
            className="p-2 rounded-xl text-slate-500 hover:text-[#a6533e] hover:bg-slate-100 transition">
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            title="Log out"
            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-slate-100 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & New Room Button */}
      <div className="p-3 border-b border-slate-200 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#c47c68]"
            />
          </div>
          <button
            onClick={onOpenCreateModal}
            title="Create room or chat"
            className="p-2 bg-[#FEDBD0] hover:bg-[#f4c5b6] text-slate-900 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`flex-1 py-1 rounded-md transition ${
              filterTab === "ALL"
                ? "bg-[#FEDBD0] text-slate-900 font-medium shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTab("DIRECT")}
            className={`flex-1 py-1 rounded-md transition ${
              filterTab === "DIRECT"
                ? "bg-[#FEDBD0] text-slate-900 font-medium shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => setFilterTab("GROUP")}
            className={`flex-1 py-1 rounded-md transition ${
              filterTab === "GROUP"
                ? "bg-[#FEDBD0] text-slate-900 font-medium shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No conversations found. Click + to start a chat!
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isActive = room.id === activeRoomId;
            const isGroup = room.type === "GROUP";
            const otherMember = isGroup ? null : room.members?.find((member) => member.userId !== currentUser.id);

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`p-2.5 rounded-xl cursor-pointer transition flex items-center gap-3 relative ${
                  isActive
                    ? "bg-[#FEDBD0] border border-[#f4c5b6] text-slate-900"
                    : "hover:bg-slate-50 border border-transparent text-slate-700"
                }`}
              >
                {/* Room Avatar */}
                <div className="relative shrink-0">
                  {isGroup ? (
                    <div className="w-10 h-10 rounded-full bg-[#FEDBD0] flex items-center justify-center text-slate-800 shadow-sm">
                      <Users className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                      <img
                        src={otherMember?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(otherMember?.username || room.name)}`}
                        alt={room.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-semibold truncate text-slate-900">
                      {room.name || (isGroup ? "Group Chat" : "Direct Chat")}
                    </h4>
                    {room.lastMessage && (
                      <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 truncate">
                    {room.lastMessage ? (
                      <span>
                        {room.lastMessage.sender?.username ? (
                          <span className="text-slate-700 font-medium">
                            {room.lastMessage.sender.username}:{" "}
                          </span>
                        ) : null}
                        {room.lastMessage.content}
                      </span>
                    ) : (
                      <span className="italic text-slate-500">
                        No messages yet
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
