// src/components/chat/ChatProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "../AuthContext";
import { supabase } from "../../lib/SupabaseClient";

/**
 * getRoomId: Generates a consistent text-based room identifier by sorting the user IDs.
 */
const getRoomId = (user1: string, user2: string): string => {
  return [user1, user2].sort().join("-");
};

/**
 * ensureChatRoomExists: Checks whether a chat room exists in public.chat_rooms.
 * If not, it creates one, setting both the id and room_identifier to the generated roomId.
 */
async function ensureChatRoomExists(roomId: string) {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (!data) {
    const { error: insertError } = await supabase
      .from("chat_rooms")
      .insert([{ id: roomId, room_identifier: roomId }]);
    if (insertError) {
      console.error("Error creating chat room:", insertError);
    }
  }
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Message {
  id?: string;
  chat_room_id?: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  timestamp: string;
  client_id?: string; // For deduplication
  deleted?: boolean; // Flag to indicate deletion in UI
  edited?: boolean; // Flag to indicate editing
  replyTo?: string; // Optional: ID of message being replied to
  reactions?: Reaction[];
}

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  age?: number | string;
  location?: string;
  gender?: string;
}

export interface Chat {
  roomId: string;
  partnerId: string;
  user: ChatUser;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

type MatchStatus = "waiting" | "pending" | "connected" | "rejected" | null;

interface ChatContextValue {
  socket: Socket | null;
  chatList: Chat[];
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  selectedChat: Chat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  isRandomMatching: boolean;
  setIsRandomMatching: React.Dispatch<React.SetStateAction<boolean>>;
  matchingStatus: string;
  setMatchingStatus: React.Dispatch<React.SetStateAction<string>>;
  matchedUser: ChatUser | null;
  setMatchedUser: React.Dispatch<React.SetStateAction<ChatUser | null>>;
  matchStatus: MatchStatus;
  setMatchStatus: React.Dispatch<React.SetStateAction<MatchStatus>>;
  accepted: boolean;
  setAccepted: React.Dispatch<React.SetStateAction<boolean>>;
  matchRoomId: string | null;
  setMatchRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  handleSendMessage: (text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  unsendMessage: (messageId: string) => Promise<void>;
  fetchExistingChats: () => void;
  startRandomMatch: () => void;
  acceptRandomMatch: () => void;
  rejectRandomMatch: () => void;
  createOrGetChatRoom: (userId1: string, userId2: string) => Promise<string>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context)
    throw new Error("useChatContext must be used within a ChatProvider");
  return context;
}

// Helper to generate a unique client id for messages.
const generateClientId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

// Helper to generate a unique key for deduplication.
const getMessageKey = (msg: Message) => `${msg.client_id || ""}`;

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isRandomMatching, setIsRandomMatching] = useState(false);
  const [matchingStatus, setMatchingStatus] = useState("Matching you with someone...");
  const [matchedUser, setMatchedUser] = useState<ChatUser | null>(null);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>(null);
  const [accepted, setAccepted] = useState(false);
  const [matchRoomId, setMatchRoomId] = useState<string | null>(null);
  const socketServerUrl = "https://circlebackendv1.onrender.com";

  // New function: Create or get existing chat room
  const createOrGetChatRoom = async (userId1: string, userId2: string): Promise<string> => {
    try {
      // Generate consistent room ID (using UUID strings)
      const roomId = getRoomId(userId1, userId2);
      
      // First check if chat room exists using the room_identifier
      const { data: existingRooms, error: findError } = await supabase
        .from("chat_rooms")
        .select("id, user1_id, user2_id")
        .eq("room_identifier", roomId);

      if (findError) throw findError;

      // If room exists, return its ID
      if (existingRooms && existingRooms.length > 0) {
        return existingRooms[0].id;
      }

      // Create new chat room
      const { data: newRoom, error: createError } = await supabase
        .from("chat_rooms")
        .insert({
          room_identifier: roomId, // Store the UUID string version
          user1_id: userId1,
          user2_id: userId2,
          // Let Supabase auto-generate the integer ID
        })
        .select("id, room_identifier")
        .single();

      if (createError) throw createError;
      
      // Fetch partner details
      const partnerId = userId1 === user?.id ? userId2 : userId1;
      const { data: partnerProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("username, first_name, last_name, profile_picture, age, location, gender")
        .eq("user_id", partnerId)
        .single();

      if (profileError) {
        console.warn("Could not fetch partner profile:", profileError);
      }

      const partnerName =
        partnerProfile && (partnerProfile.first_name || partnerProfile.last_name)
          ? `${partnerProfile.first_name || ""} ${partnerProfile.last_name || ""}`.trim()
          : `User ${partnerId.slice(-4)}`;
      const partnerAvatar =
        partnerProfile?.profile_picture ||
        `https://ui-avatars.com/api/?name=${partnerName}&background=random`;

      // Create new chat in local state
      const newChat: Chat = {
        roomId: newRoom.room_identifier || newRoom.id.toString(), // Use the identifier if available
        partnerId,
        user: {
          id: partnerId,
          name: partnerName,
          avatar: partnerAvatar,
          age: partnerProfile?.age || "-",
          location: partnerProfile?.location || "-",
          gender: partnerProfile?.gender || "-",
        },
        messages: [],
        lastMessage: {
          sender_id: "system",
          recipient_id: user?.id || "",
          content: "Chat started",
          timestamp: new Date().toISOString(),
          chat_room_id: newRoom.room_identifier || newRoom.id.toString(),
        },
        unreadCount: 0,
      };

      // Update local state
      setChatList(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
      setMessages([]);

      return newRoom.room_identifier || newRoom.id.toString();
    } catch (error) {
      console.error("Error in createOrGetChatRoom:", error);
      throw new Error(`Failed to create/get chat room: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Initialize socket connection once the user is loaded
  useEffect(() => {
    if (loading || !user?.id) return;

    const newSocket = io(socketServerUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => newSocket.emit("join", user.id));

    newSocket.on("privateMessage", async (data: any) => {
      // Avoid processing messages sent by self
      if (!user?.id || !data.senderId || !data.message || data.senderId === user.id) {
        return;
      }
    
      const roomId = getRoomId(user.id, data.senderId);
      await ensureChatRoomExists(roomId);
    
      const timestamp = data.timestamp || new Date().toISOString();
      const clientId = data.client_id || generateClientId();
    
      const transformedMessage: Message = {
        sender_id: data.senderId,
        recipient_id: user.id,
        content: data.message,
        timestamp,
        chat_room_id: roomId,
        client_id: clientId,
      };
    
      const messageKey = getMessageKey(transformedMessage);
    
      // Check if message already exists before updating state
      setChatList(prev => {
        const existingChat = prev.find(chat => chat.roomId === roomId);
        if (existingChat?.messages.some(m => getMessageKey(m) === messageKey)) {
          return prev; // Message already exists, no update needed
        }
    
        return prev.map(chat => {
          if (chat.roomId === roomId) {
            return {
              ...chat,
              messages: [...chat.messages, transformedMessage],
              lastMessage: transformedMessage,
              unreadCount: selectedChat?.roomId === roomId ? 0 : chat.unreadCount + 1,
            };
          }
          return chat;
        });
      });
    
      if (selectedChat?.roomId === roomId) {
        setMessages(prev => {
          if (prev.some(m => getMessageKey(m) === messageKey)) {
            return prev;
          }
          return [...prev, transformedMessage];
        });
      }
    });

    newSocket.on("randomMatchStatus", (data: any) => {
      setMatchStatus(data.status);
      if (data.roomId) setMatchRoomId(String(data.roomId));
      if (data.matchedUser) {
        if (data.status === "pending") {
          (async () => {
            const { data: partnerProfile, error } = await supabase
              .from("user_profiles")
              .select("username, first_name, last_name, profile_picture, age, location, gender")
              .eq("user_id", data.matchedUser.id)
              .single();
            let fullMatchedUser = data.matchedUser;
            if (!error && partnerProfile) {
              const partnerName = `${partnerProfile.first_name || ""} ${partnerProfile.last_name || ""}`.trim() || data.matchedUser.name;
              fullMatchedUser = {
                ...data.matchedUser,
                name: partnerName,
                avatar: partnerProfile.profile_picture || `https://ui-avatars.com/api/?name=${partnerName}&background=random`,
                age: partnerProfile.age || "-",
                location: partnerProfile.location || "-",
                gender: partnerProfile.gender || "-",
              };
            }
            setMatchedUser(fullMatchedUser);
          })();
        } else {
          setMatchedUser(data.matchedUser);
        }
      }
      if (data.status === "rejected") setAccepted(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [loading, user?.id, selectedChat, socketServerUrl]);

  // Force transition from pending to connected if both sides have accepted
  useEffect(() => {
    if (matchStatus === "pending" && accepted && matchedUser && user?.id) {
      const timer = setTimeout(() => {
        setMatchStatus("connected");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [matchStatus, accepted, matchedUser, user?.id]);

  // When a match is connected, fetch full partner details and update the chat list.
  useEffect(() => {
    if (matchStatus === "connected" && matchedUser && user?.id) {
      const roomId = getRoomId(user.id, matchedUser.id);
      (async () => {
        await ensureChatRoomExists(roomId);

        const { data: partnerProfile, error } = await supabase
          .from("user_profiles")
          .select("username, first_name, last_name, profile_picture, age, location, gender")
          .eq("user_id", matchedUser.id)
          .single();

        if (error) {
          console.error("Error fetching partner profile:", error);
          return;
        }

        const partnerName =
          partnerProfile && (partnerProfile.first_name || partnerProfile.last_name)
            ? `${partnerProfile.first_name || ""} ${partnerProfile.last_name || ""}`.trim()
            : matchedUser.name || `User ${matchedUser.id.slice(-4)}`;
        const partnerAvatar =
          partnerProfile?.profile_picture ||
          `https://ui-avatars.com/api/?name=${partnerName}&background=random`;

        const newChat: Chat = {
          roomId,
          partnerId: matchedUser.id,
          user: {
            id: matchedUser.id,
            name: partnerName,
            avatar: partnerAvatar,
            age: partnerProfile?.age || "-",
            location: partnerProfile?.location || "-",
            gender: partnerProfile?.gender || "-",
          },
          messages: [
            {
              sender_id: "system",
              recipient_id: user.id,
              content: "You are now connected!",
              timestamp: new Date().toISOString(),
              chat_room_id: roomId,
            },
          ],
          lastMessage: {
            sender_id: "system",
            recipient_id: user.id,
            content: "You are now connected!",
            timestamp: new Date().toISOString(),
            chat_room_id: roomId,
          },
          unreadCount: 1,
        };

        setChatList((prev) => {
          const exists = prev.some((chat) => chat.roomId === roomId);
          return exists ? prev : [newChat, ...prev];
        });
        setSelectedChat(newChat);
        setMessages(newChat.messages);
        setIsRandomMatching(false);
        setMatchRoomId(null);
        setMatchStatus(null);
        setMatchingStatus("");
        fetchExistingChats();
      })();
    }
  }, [matchStatus, matchedUser, user?.id]);

  async function fetchExistingChats() {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("timestamp", { ascending: true });

      if (error || !data) return;

      const chatMap: Record<string, Message[]> = {};
      data.forEach((msg: Message) => {
        if (!msg.sender_id || !msg.recipient_id) {
          console.warn("Skipping invalid message:", msg);
          return;
        }
        const roomId =
          msg.chat_room_id !== undefined && msg.chat_room_id !== null
            ? msg.chat_room_id
            : getRoomId(
                user.id,
                msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
              );
        chatMap[roomId] = [...(chatMap[roomId] || []), { ...msg, chat_room_id: roomId }];
      });

      const chats: Chat[] = await Promise.all(
        Object.entries(chatMap).map(async ([roomId, msgs]) => {
          const lastMsg = msgs[msgs.length - 1];
          const partnerId =
            lastMsg.sender_id === user.id
              ? lastMsg.recipient_id
              : lastMsg.sender_id;

          const { data: partnerProfile } = await supabase
            .from("user_profiles")
            .select("username, first_name, last_name, profile_picture, age, location, gender")
            .eq("user_id", partnerId)
            .single();

          const partnerName =
            partnerProfile && (partnerProfile.first_name || partnerProfile.last_name)
              ? `${partnerProfile.first_name || ""} ${partnerProfile.last_name || ""}`.trim()
              : `User ${partnerId.slice(-4)}`;
          const partnerAvatar =
            partnerProfile?.profile_picture ||
            `https://ui-avatars.com/api/?name=${partnerName}&background=random`;

          return {
            roomId,
            partnerId,
            user: {
              id: partnerId,
              name: partnerName,
              avatar: partnerAvatar,
              age: partnerProfile?.age || "-",
              location: partnerProfile?.location || "-",
              gender: partnerProfile?.gender || "-",
            },
            messages: msgs,
            lastMessage: lastMsg,
            unreadCount: 0,
          };
        })
      );

      // Sort chats with the most recent on top.
      chats.sort(
        (a, b) =>
          new Date(b.lastMessage.timestamp).getTime() -
          new Date(a.lastMessage.timestamp).getTime()
      );

      setChatList(chats);
      if (!selectedChat && chats.length) {
        setSelectedChat(chats[0]);
        setMessages(chats[0].messages);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    fetchExistingChats();
  }, [user?.id]);

  // New function: Delete message from UI (mark as deleted) without removing from backend.
  async function deleteMessage(messageId: string) {
    // Update the message in Supabase to mark as deleted, e.g. set deleted flag and change content.
    const { error } = await supabase
      .from("messages")
      .update({ content: "[deleted]", deleted: true })
      .eq("id", messageId);
    if (error) {
      console.error("Error deleting message:", error);
      return;
    }
    // Update local state to reflect deletion.
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content: "[deleted]", deleted: true } : msg
      )
    );
    setChatList((prevChats) =>
      prevChats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((msg) =>
          msg.id === messageId ? { ...msg, content: "[deleted]", deleted: true } : msg
        ),
        lastMessage:
          chat.lastMessage.id === messageId
            ? { ...chat.lastMessage, content: "[deleted]", deleted: true }
            : chat.lastMessage,
      }))
    );
  }

  // New function: Edit a message
  async function editMessage(messageId: string, newContent: string) {
    const { error } = await supabase
      .from("messages")
      .update({ content: newContent, edited: true })
      .eq("id", messageId);
    if (error) {
      console.error("Error editing message:", error);
      return;
    }
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content: newContent, edited: true } : msg
      )
    );
    setChatList((prevChats) =>
      prevChats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((msg) =>
          msg.id === messageId ? { ...msg, content: newContent, edited: true } : msg
        ),
        lastMessage:
          chat.lastMessage.id === messageId
            ? { ...chat.lastMessage, content: newContent, edited: true }
            : chat.lastMessage,
      }))
    );
  }

  // New function: React to a message
  async function reactToMessage(messageId: string, emoji: string) {
    // Get the current reactions for the message, then add new reaction.
    const message = messages.find((msg) => msg.id === messageId);
    const currentReactions = message?.reactions || [];
    const newReaction = { emoji, userId: user!.id };
    const updatedReactions = [...currentReactions, newReaction];

    const { error } = await supabase
      .from("messages")
      .update({ reactions: updatedReactions })
      .eq("id", messageId);
    if (error) {
      console.error("Error reacting to message:", error);
      return;
    }
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg
      )
    );
    setChatList((prevChats) =>
      prevChats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((msg) =>
          msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg
        ),
        lastMessage:
          chat.lastMessage.id === messageId
            ? { ...chat.lastMessage, reactions: updatedReactions }
            : chat.lastMessage,
      }))
    );
  }

  // New function: Unsend message (alias to delete for sender)
  async function unsendMessage(messageId: string) {
    // For unsend, we perform the same UI deletion (mark as deleted)
    await deleteMessage(messageId);
  }

  async function handleSendMessage(text: string) {
    if (!socket || !selectedChat || !user?.id) return;
    
    const roomId = selectedChat.roomId;
    const clientId = generateClientId();
    const msg: Message = {
      sender_id: user.id,
      recipient_id: selectedChat.partnerId,
      content: text,
      timestamp: new Date().toISOString(),
      chat_room_id: roomId,
      client_id: clientId,
    };
  
    const messageKey = getMessageKey(msg);
  
    // Optimistically update state - but only if message doesn't exist
    setChatList(prev => {
      const existingChat = prev.find(chat => chat.roomId === roomId);
      if (existingChat?.messages.some(m => getMessageKey(m) === messageKey)) {
        return prev;
      }
  
      return prev.map(chat => 
        chat.roomId === roomId
          ? {
              ...chat,
              messages: [...chat.messages, msg],
              lastMessage: msg,
            }
          : chat
      );
    });
  
    setMessages(prev => {
      if (prev.some(m => getMessageKey(m) === messageKey)) {
        return prev;
      }
      return [...prev, msg];
    });
  
    // Send via socket and Supabase
    socket.emit("privateMessage", {
      recipientId: selectedChat.partnerId,
      message: text,
      chat_room_id: roomId,
      client_id: clientId,
    });
  
    const { error } = await supabase.from("messages").insert([msg]);
    if (error) {
      console.error("Error inserting message:", error);
      // Optionally roll back optimistic update
    }
  }

  function startRandomMatch() {
    setIsRandomMatching(true);
    setMatchedUser(null);
    setMatchStatus(null);
    setAccepted(false);
    setMatchRoomId(null);
    setMatchingStatus("Matching you with someone who shares your interests...");
    socket?.emit("findRandomMatch");
  }

  function acceptRandomMatch() {
    if (matchedUser && socket && matchRoomId !== null && !accepted) {
      socket.emit("randomMatchAccept", { chat_room_id: matchRoomId });
      setAccepted(true);
      setMatchingStatus("Please wait till the other user accepts your request.");
    }
  }

  function rejectRandomMatch() {
    if (socket && matchedUser && matchRoomId !== null) {
      socket.emit("randomMatchReject", { chat_room_id: matchRoomId });
    }
    setMatchedUser(null);
    setAccepted(false);
    startRandomMatch();
  }

  const value: ChatContextValue = {
    socket,
    chatList,
    setChatList,
    messages,
    setMessages,
    selectedChat,
    setSelectedChat,
    isRandomMatching,
    setIsRandomMatching,
    matchingStatus,
    setMatchingStatus,
    matchedUser,
    setMatchedUser,
    matchStatus,
    setMatchStatus,
    accepted,
    setAccepted,
    matchRoomId,
    setMatchRoomId,
    handleSendMessage,
    deleteMessage,
    editMessage,
    reactToMessage,
    unsendMessage,
    fetchExistingChats,
    startRandomMatch,
    acceptRandomMatch,
    rejectRandomMatch,
    createOrGetChatRoom, // Added the new function to context value
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;