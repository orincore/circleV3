
import React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Plus,
  ArrowLeft,
  MessageCircle,
  Phone,
  Video,
  Info,
  Paperclip,
  Mic,
  Image,
  Send,
  Loader2,
  Check,
  UserPlus,
  UserMinus,
  X,
} from "lucide-react"
import { useChatContext } from "./ChatProvider"
import { Avatar } from "../../components/ui/Avatar"
import { useUser } from "@clerk/clerk-react"
import { useNotification } from "../../hooks/useNotification"
import { maskName } from "./utils"

export const ChatSidebar: React.FC<{ onSelectChat?: () => void }> = ({ onSelectChat }) => {
  const { chatList, selectedChat, setSelectedChat, startRandomMatch } = useChatContext()
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-full flex flex-col border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center">
          <ArrowLeft className="w-5 h-5 mr-2 md:hidden" onClick={onSelectChat} />
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <button className="btn btn-ghost btn-sm p-1">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search messages"
            className="input pl-10 w-full bg-gray-100 dark:bg-gray-800 border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <button onClick={startRandomMatch} className="btn btn-primary mx-4 mb-4">
        Start Random Chat
      </button>

      <div className="flex-1 overflow-y-auto">
        <div className="px-2 space-y-1">
          {chatList
            .filter((chat) => chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((chat) => (
              <motion.div
                key={chat.roomId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat?.roomId === chat.roomId
                    ? "bg-primary-50 dark:bg-primary-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => {
                  setSelectedChat(chat)
                  onSelectChat?.()
                }}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <Avatar src={chat.user.avatar || "https://via.placeholder.com/40"} alt={chat.user.name} size="md" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">{chat.user.name}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-1">
                        {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">
                        {chat.lastMessage.sender_id === "system"
                          ? chat.lastMessage.content
                          : chat.lastMessage.sender_id === chat.user.id
                            ? chat.lastMessage.content
                            : `You: ${chat.lastMessage.content}`}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  )
}

export const ChatWindow: React.FC<{ onOpenSidebar?: () => void }> = ({ onOpenSidebar }) => {
  const { user } = useUser()
  const { selectedChat, messages, handleSendMessage, startRandomMatch } = useChatContext()
  const [inputValue, setInputValue] = useState("")
  const [showAttachments, setShowAttachments] = useState(false)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const { showNotification } = useNotification()

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle sending a message
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      handleSendMessage(inputValue.trim())
      setInputValue("")
      setShowAttachments(false)
    }
  }

  // Fallback avatar source
  const avatarSource =
    selectedChat?.user.avatar || `https://ui-avatars.com/api/?name=${selectedChat?.user.name}&background=random`

  // Show notification for new messages
  useEffect(() => {
    if (messages.length > 0 && selectedChat) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.sender_id !== user?.id) {
        showNotification(`New message from ${selectedChat.user.name}`, {
          body: lastMessage.content,
          icon: avatarSource,
          data: { roomId: selectedChat.roomId },
        })
      }
    }
  }, [messages, selectedChat, showNotification, avatarSource, user])

  // If no chat is selected, show a placeholder
  if (!selectedChat || !selectedChat.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-4">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Your Messages</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Send private messages to friends or start a random chat
          </p>
          <button onClick={startRandomMatch} className="btn btn-primary">
            Start a Random Chat
          </button>
        </div>
      </div>
    )
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center">
        <button
          className="md:hidden mr-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          onClick={onOpenSidebar}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center flex-1">
          <div className="relative">
            <Avatar src={avatarSource} alt={selectedChat.user.name} size="md" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </div>
          <div className="ml-3">
            <h3 className="font-medium">{selectedChat.user.name}</h3>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-ghost btn-sm p-2">
            <Phone className="w-5 h-5" />
          </button>
          <button className="btn btn-ghost btn-sm p-2">
            <Video className="w-5 h-5" />
          </button>
          <button className="btn btn-ghost btn-sm p-2">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg, index) => {
          const isUser = msg.sender_id === user?.id
          const isSystem = msg.sender_id === "system"
          const showTimestamp =
            index === 0 ||
            new Date(msg.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 5 * 60 * 1000

          if (isSystem) {
            return (
              <div key={msg.id || msg.timestamp} className="flex justify-center my-4">
                <div className="bg-gray-200 dark:bg-gray-800 rounded-full px-4 py-1 text-xs text-gray-600 dark:text-gray-400">
                  {msg.content}
                </div>
              </div>
            )
          }

          return (
            <React.Fragment key={msg.id || msg.timestamp}>
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
                <div
                  className={`max-w-[75%] rounded-2xl p-3 ${
                    isUser
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70 text-right">{formatTime(msg.timestamp)}</p>
                </div>
              </motion.div>
            </React.Fragment>
          )
        })}
        <div ref={messageEndRef} />
      </div>

      {/* Attachment options */}
      {showAttachments && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 grid grid-cols-4 gap-2">
          <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-1">
              <Image className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-xs">Photo</span>
          </button>
          <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-1">
              <Video className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-xs">Video</span>
          </button>
          <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-1">
              <Paperclip className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs">File</span>
          </button>
          <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
              <Mic className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs">Audio</span>
          </button>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm p-2"
            onClick={() => setShowAttachments(!showAttachments)}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Message..."
            className="input flex-1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          {inputValue.trim() ? (
            <button type="submit" className="btn btn-primary btn-sm p-2 rounded-full">
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm p-2 rounded-full">
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export const RandomMatchPopup: React.FC = () => {
  const {
    isRandomMatching,
    matchingStatus,
    matchedUser,
    matchStatus,
    acceptRandomMatch,
    rejectRandomMatch,
    setIsRandomMatching,
    accepted,
  } = useChatContext()

  function closePopup() {
    setIsRandomMatching(false)
  }

  if (!isRandomMatching) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm mx-4 text-center relative"
      >
        <button className="absolute top-3 right-3 btn btn-ghost btn-sm p-1" onClick={closePopup}>
          <X className="w-5 h-5" />
        </button>

        {!matchedUser ? (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Finding a Match</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{matchingStatus}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">We're looking for someone with similar interests</p>
          </>
        ) : matchStatus === "pending" || matchStatus === "waiting" ? (
          <>
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-yellow-400 to-primary-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 p-0.5">
                <img
                  src={
                    matchedUser.avatar ||
                    `https://ui-avatars.com/api/?name=${matchedUser.name || "/placeholder.svg"}&background=random`
                  }
                  alt={matchedUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Match Found!</h2>
            <p className="text-xl text-primary-500 mb-1">{maskName(matchedUser.name)}</p>
            <div className="flex justify-center gap-2 mb-4">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                {matchedUser.age || "-"} years
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                {matchedUser.location || "-"}
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                {matchedUser.gender || "-"}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {accepted ? "Waiting for response..." : "Would you like to connect?"}
            </p>
            <div className="flex justify-center gap-4">
              <button className="btn btn-outline" onClick={rejectRandomMatch} disabled={accepted}>
                <UserMinus className="w-4 h-4 mr-2" />
                Reject
              </button>
              <button className="btn btn-primary" onClick={acceptRandomMatch} disabled={accepted}>
                {accepted ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Accept
                  </>
                )}
              </button>
            </div>
          </>
        ) : matchStatus === "connected" ? (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Connected!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You can now start chatting with {matchedUser.name.split(" ")[0]}
            </p>
            <button
              onClick={() => {
                setIsRandomMatching(false)
                // Force mobile layout update
                setTimeout(() => window.dispatchEvent(new Event("resize")), 100)
              }}
              className="btn btn-primary"
            >
              Start Chatting
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Finding a Match</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{matchingStatus}</p>
          </>
        )}
      </motion.div>
    </div>
  )
}

