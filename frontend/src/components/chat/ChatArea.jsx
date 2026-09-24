import React, { useState, useEffect, useRef } from "react";
import { Send, Users, Info, MessageSquare, Sparkles } from "lucide-react";
import { websocketService } from "../../services/websocket";
import { getReadableTextColor } from "./appearance";

export default function ChatArea({
  activeRoom,
  messages,
  currentUser,
  typingUsers = [],
  onSendMessage,
  onToggleDetails,
  showDetails,
  appearance,
  onOpenProfile,
}) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom on new messages or typing change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (activeRoom) {
      // Send typing indicator
      websocketService.sendTyping(activeRoom.id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        websocketService.sendTyping(activeRoom.id, false);
      }, 2000);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoom) return;

    onSendMessage(inputText.trim());
    setInputText("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    websocketService.sendTyping(activeRoom.id, false);
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!activeRoom) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-white text-slate-500 p-6 select-none">
        <div className="w-16 h-16 rounded-3xl bg-[#FEDBD0] border border-[#f4c5b6] flex items-center justify-center mb-4 text-slate-700 shadow-sm">
          <MessageSquare className="w-8 h-8 opacity-70" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">
          Select a Conversation
        </h3>
        <p className="text-sm max-w-sm text-center mt-1 text-slate-500">
          Choose a room from the left or create a new one to start messaging in
          real-time.
        </p>
      </div>
    );
  }

  // Filter typing users for this room, excluding self
  const currentTyping = typingUsers.filter(
    (t) =>
      t.roomId === activeRoom.id &&
      t.username !== currentUser?.username &&
      t.typing,
  );
  const messageTextColor = getReadableTextColor(appearance.messageColor);
  const backgroundTextColor = getReadableTextColor(appearance.backgroundColor);
  const directPartner = activeRoom.type === "DIRECT"
    ? activeRoom.members?.find((member) => member.userId !== currentUser.id)
    : null;

  return (
    <div className="flex-1 h-full flex flex-col bg-white overflow-hidden relative">
      {/* Header */}
      <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            {activeRoom.type === "GROUP" ? (
              <div className="w-10 h-10 rounded-full bg-[#FEDBD0] flex items-center justify-center text-slate-800 shadow-sm">
                <Users className="w-5 h-5" />
              </div>
            ) : (
              <img
                src={directPartner?.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeRoom.name)}`}
                alt={activeRoom.name}
                className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200"
              />
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              {directPartner ? (
                <button type="button" onClick={() => onOpenProfile(directPartner.userId)}
                  className="hover:text-[#a6533e] hover:underline" title="Xem trang cá nhân">
                  {activeRoom.name}
                </button>
              ) : activeRoom.name}
              <span className="text-[10px] px-2 py-0.5 rounded-full font-normal bg-[#FEDBD0] text-slate-700 border border-[#f4c5b6]">
                {activeRoom.type}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {activeRoom.members?.length || 0} members
            </p>
          </div>
        </div>

        <button
          onClick={onToggleDetails}
          className={`p-2 rounded-xl border transition ${
            showDetails
              ? "bg-[#FEDBD0] border-[#f4c5b6] text-slate-800"
              : "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
          title="Room Details"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ backgroundColor: appearance.backgroundColor }}
      >
        {messages.length === 0 ? (
          <div
            className="h-full flex flex-col items-center justify-center text-xs"
            style={{ color: backgroundTextColor }}
          >
            <Sparkles className="w-6 h-6 mb-2 opacity-70" />
            No messages yet in this room. Say hi!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.sender?.id === currentUser?.id;
            const isSystem =
              msg.messageType === "JOIN" || msg.messageType === "LEAVE";

            if (isSystem) {
              return (
                <div key={msg.id || index} className="flex justify-center my-2">
                  <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-500 font-medium">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id || index}
                className={`flex items-end gap-2.5 ${isSelf ? "justify-end" : "justify-start"}`}
              >
                {!isSelf && (
                  <img
                    src={
                      msg.sender?.avatarUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender?.username}`
                    }
                    alt={msg.sender?.username}
                    className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0 mb-1"
                  />
                )}

                <div
                  className={`max-w-md rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                    isSelf
                      ? "rounded-br-xs"
                      : "rounded-bl-xs"
                  }`}
                  style={{ backgroundColor: appearance.messageColor, color: messageTextColor }}
                >
                  {!isSelf && (
                    <button type="button" onClick={() => msg.sender?.id && onOpenProfile(msg.sender.id)} title="Xem trang cá nhân"
                      className="block text-[11px] font-semibold mb-0.5 opacity-80 hover:underline">
                      {msg.sender?.displayName || msg.sender?.username || "Unknown"}
                    </button>
                  )}
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                  <div className="text-[10px] mt-1 text-right opacity-70">
                    {formatMessageTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {currentTyping.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600 italic py-1 animate-pulse">
            <span className="inline-flex gap-1 items-center bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <span className="w-1.5 h-1.5 bg-[#c47c68] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#c47c68] rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-[#c47c68] rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1.5 not-italic text-slate-600">
                {currentTyping.map((t) => t.username).join(", ")} is typing...
              </span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={`Message ${activeRoom.name || "here"}... (Press Enter)`}
            className="flex-1 bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#c47c68] focus:ring-1 focus:ring-[#c47c68] transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-[#FEDBD0] hover:bg-[#f4c5b6] text-slate-900 rounded-2xl shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
