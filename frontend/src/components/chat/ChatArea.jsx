import React, { useState, useEffect, useRef } from "react";
import { Send, Users, Info, MessageSquare, Sparkles } from "lucide-react";
import { websocketService } from "../../services/websocket";

export default function ChatArea({
  activeRoom,
  messages,
  currentUser,
  typingUsers = [],
  onSendMessage,
  onToggleDetails,
  showDetails,
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
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 p-6 select-none">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-indigo-400 shadow-xl">
          <MessageSquare className="w-8 h-8 opacity-70" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300">
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

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Header */}
      <div className="h-16 px-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            {activeRoom.type === "GROUP" ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow">
                <Users className="w-5 h-5" />
              </div>
            ) : (
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeRoom.name}`}
                alt={activeRoom.name}
                className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700"
              />
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              {activeRoom.name}
              <span className="text-[10px] px-2 py-0.5 rounded-full font-normal bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {activeRoom.type}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {activeRoom.members?.length || 0} members
            </p>
          </div>
        </div>

        <button
          onClick={onToggleDetails}
          className={`p-2 rounded-xl border transition ${
            showDetails
              ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
              : "border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
          title="Room Details"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Sparkles className="w-6 h-6 mb-2 text-indigo-400/60" />
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
                  <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400 font-medium">
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
                    className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 mb-1"
                  />
                )}

                <div
                  className={`max-w-md rounded-2xl px-4 py-2.5 shadow-md text-sm ${
                    isSelf
                      ? "bg-indigo-600 text-white rounded-br-xs"
                      : "bg-slate-800 border border-slate-700/70 text-slate-100 rounded-bl-xs"
                  }`}
                >
                  {!isSelf && (
                    <div className="text-[11px] font-semibold text-indigo-300 mb-0.5">
                      {msg.sender?.username || "Unknown"}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isSelf ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {currentTyping.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 italic py-1 animate-pulse">
            <span className="inline-flex gap-1 items-center bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1.5 not-italic text-slate-300">
                {currentTyping.map((t) => t.username).join(", ")} is typing...
              </span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={`Message ${activeRoom.name || "here"}... (Press Enter)`}
            className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
