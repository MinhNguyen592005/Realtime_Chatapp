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
    <div className="w-80 h-full flex flex-col bg-slate-900/90 border-r border-slate-800 text-slate-200 select-none">
      {/* User Profile Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={
                currentUser?.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.username}`
              }
              alt={currentUser?.username}
              className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-semibold text-white truncate">
              {currentUser?.username}
            </h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
              Online
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Log out"
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Search & New Room Button */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={onOpenCreateModal}
            title="Create room or chat"
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-800/60 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`flex-1 py-1 rounded-md transition ${
              filterTab === "ALL"
                ? "bg-indigo-600 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTab("DIRECT")}
            className={`flex-1 py-1 rounded-md transition ${
              filterTab === "DIRECT"
                ? "bg-indigo-600 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => setFilterTab("GROUP")}
            className={`flex-1 py-1 rounded-md transition ${
              filterTab === "GROUP"
                ? "bg-indigo-600 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-white"
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

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`p-2.5 rounded-xl cursor-pointer transition flex items-center gap-3 relative ${
                  isActive
                    ? "bg-indigo-600/25 border border-indigo-500/50 text-white"
                    : "hover:bg-slate-800/60 border border-transparent text-slate-300"
                }`}
              >
                {/* Room Avatar */}
                <div className="relative shrink-0">
                  {isGroup ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow">
                      <Users className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${room.name}`}
                        alt={room.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-semibold truncate text-white">
                      {room.name || (isGroup ? "Group Chat" : "Direct Chat")}
                    </h4>
                    {room.lastMessage && (
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 truncate">
                    {room.lastMessage ? (
                      <span>
                        {room.lastMessage.sender?.username ? (
                          <span className="text-slate-300 font-medium">
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
