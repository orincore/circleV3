// src/components/chat/ChatWindow.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Paperclip,
  Mic,
  ImageIcon,
  MoreVertical,
  X,
  Trash2,
  Edit,
  Smile,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../components/AuthContext";
import { useChatContext, Message as MessageType } from "./ChatProvider";
import { useNotification } from "../../hooks/useNotification";
import { motion } from "framer-motion";
import { supabase } from "../../lib/SupabaseClient";

export const ChatWindow: React.FC<{ onOpenSidebar?: () => void }> = ({ onOpenSidebar }) => {
  const { user } = useAuth();
  const {
    selectedChat,
    messages,
    handleSendMessage,
    setMessages,
    deleteMessage,
    editMessage,
    unsendMessage,
    reactToMessage,
  } = useChatContext();
  
  const [inputValue, setInputValue] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputValue, setEditInputValue] = useState("");
  const [replyMessage, setReplyMessage] = useState<MessageType | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchMessagesForChat = async () => {
      if (selectedChat?.roomId) {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_room_id", selectedChat.roomId)
          .order("timestamp", { ascending: true });
        if (error) {
          console.error("Error fetching messages for chat:", error);
          return;
        }
        if (data) {
          setMessages(data);
        }
      }
    };
    fetchMessagesForChat();
  }, [selectedChat?.roomId, setMessages]);

  useEffect(() => {
    if (!selectedChat?.roomId) return;
    const channel = supabase
      .channel(`messages-${selectedChat.roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${selectedChat.roomId}`,
        },
        (payload) => {
          if (payload.new.sender_id === user?.id) return;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat?.roomId, setMessages, user?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const text = replyMessage
        ? `(Reply to: ${replyMessage.content.substring(0, 40)}${replyMessage.content.length > 40 ? "..." : ""}) ${inputValue.trim()}`
        : inputValue.trim();
      handleSendMessage(text);
      setInputValue("");
      setShowAttachments(false);
      setReplyMessage(null);
    }
  };

  const handleEditSubmit = (e: React.FormEvent, messageId: string) => {
    e.preventDefault();
    if (editInputValue.trim()) {
      editMessage(messageId, editInputValue.trim());
      setEditingMessageId(null);
      setEditInputValue("");
    }
  };

  const handleAvatarClick = () => {
    if (selectedChat?.user?.id) {
      window.location.href = `/profile/${selectedChat.user.id}`;
    }
  };

  const avatarSource =
    selectedChat?.user.avatar ||
    `https://ui-avatars.com/api/?name=${selectedChat?.user.name}&background=random`;

  useEffect(() => {
    if (messages.length > 0 && selectedChat && user?.id) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_id !== user.id) {
        showNotification(`New message from ${selectedChat.user.name}`, {
          body: lastMessage.content,
          icon: avatarSource,
          data: { roomId: selectedChat.roomId },
        });
      }
    }
  }, [messages, selectedChat, user, avatarSource, showNotification]);

  const startRandomMatch = () => {
    console.log("Starting random match (implementation needed)");
  };

  if (!selectedChat || !selectedChat.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-4">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            Your Messages
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Send private messages to friends or start a random chat
          </p>
          <Button onClick={startRandomMatch} className="rounded-full">
            Start a Random Chat
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 relative">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {showProfileModal ? (
          <div className="flex items-center justify-between p-3">
            <button
              onClick={() => setShowProfileModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-primary-500 p-0.5 mr-3">
                <img
                  src={avatarSource}
                  alt={selectedChat.user.name}
                  className="w-full h-full rounded-full object-cover border border-white dark:border-gray-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${selectedChat.user.name}&background=random`;
                  }}
                />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100">
                  {selectedChat.user.name}
                </h2>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
            <button
              onClick={() => setShowProfileModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        ) : (
          <div className="flex items-center p-3">
            <button
              className="md:hidden mr-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              onClick={onOpenSidebar}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button 
              onClick={handleAvatarClick}
              className="flex items-center flex-1"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-primary-500 p-0.5">
                  <img
                    src={avatarSource}
                    alt={selectedChat.user.name}
                    className="w-full h-full rounded-full object-cover border border-white dark:border-gray-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${selectedChat.user.name}&background=random`;
                    }}
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              <div className="ml-3 text-left">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedChat.user.name}
                </h3>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </button>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message container with padding to account for sticky header */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg, index) => {
          const isUser = msg.sender_id === user?.id;
          const showTimestamp =
            index === 0 ||
            new Date(msg.timestamp).getTime() -
              new Date(messages[index - 1].timestamp).getTime() >
              5 * 60 * 1000;
          return (
            <div
              key={msg.id || msg.timestamp}
              className="relative group"
              onMouseEnter={() => isUser && setOpenMenuId(msg.id!)}
              onMouseLeave={() => isUser && setOpenMenuId(null)}
            >
              {showTimestamp && (
                <div className="flex justify-center my-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(msg.timestamp).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="relative">
                  {isUser && (
                    <div className="absolute top-0 right-0 z-10">
                      <button
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                        onClick={() =>
                          setOpenMenuId(openMenuId === msg.id ? null : msg.id!)
                        }
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuId === msg.id && (
                        <div className="absolute top-10 right-0 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-lg z-20">
                          {isUser && (
                            <>
                              <button
                                className="w-full text-left px-3 py-1 text-xs text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={() => {
                                  unsendMessage(msg.id!);
                                  setOpenMenuId(null);
                                }}
                              >
                                Unsend
                              </button>
                              <button
                                className="w-full text-left px-3 py-1 text-xs text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={() => {
                                  setEditingMessageId(msg.id!);
                                  setEditInputValue(msg.content);
                                  setOpenMenuId(null);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="w-full text-left px-3 py-1 text-xs text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={() => {
                                  deleteMessage(msg.id!);
                                  setOpenMenuId(null);
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          <button
                            className="w-full text-left px-3 py-1 text-xs text-green-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                            onClick={() => {
                              setReplyMessage(msg);
                              setOpenMenuId(null);
                            }}
                          >
                            Reply
                          </button>
                          <button
                            className="w-full text-left px-3 py-1 text-xs text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                            onClick={() => {
                              reactToMessage(msg.id!, "😊");
                              setOpenMenuId(null);
                            }}
                          >
                            React
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      isUser
                        ? "bg-primary-500 text-white"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {editingMessageId === msg.id ? (
                      <input
                        type="text"
                        value={editInputValue}
                        onChange={(e) => setEditInputValue(e.target.value)}
                        onBlur={(e) => handleEditSubmit(e, msg.id!)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEditSubmit(e, msg.id!);
                          }
                        }}
                        autoFocus
                        className="w-full bg-transparent border-b border-gray-300 dark:border-gray-500 focus:outline-none text-sm"
                      />
                    ) : (
                      <p className="text-sm">
                        {msg.deleted ? "[deleted]" : msg.content}
                      </p>
                    )}
                    {msg.edited && !msg.deleted && (
                      <span className="text-xs italic">(edited)</span>
                    )}
                    <p className="text-xs mt-1 opacity-70 text-right">
                      {formatTime(msg.timestamp)}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* Reply banner */}
      {replyMessage && (
        <div className="sticky bottom-16 z-10 p-2 bg-gray-200 dark:bg-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Replying to: {replyMessage.content.substring(0, 50)}{replyMessage.content.length > 50 && "..."}
          </span>
          <button
            onClick={() => setReplyMessage(null)}
            className="text-xs text-red-500"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Attachment options */}
      {showAttachments && (
        <div className="sticky bottom-16 z-10 p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 grid grid-cols-4 gap-2">
          <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-1">
              <ImageIcon className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-xs">Photo</span>
          </button>
          <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-1">
              <Video className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-xs">Video</span>
          </button>
          <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-1">
              <Paperclip className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs">File</span>
          </button>
          <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
              <Mic className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs">Audio</span>
          </button>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 z-10 p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            onClick={() => setShowAttachments(!showAttachments)}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Message..."
            className="flex-1 px-4 py-2 rounded-full text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-100 dark:bg-gray-800"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          {inputValue.trim() ? (
            <Button
              type="submit"
              className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </Button>
          ) : (
            <button
              type="button"
              className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;