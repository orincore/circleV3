
// src/hooks/useNotification.ts
import React from "react"
import { useEffect } from "react"
import { useChatContext } from "../components/chat/ChatProvider"

export const useNotification = () => {
  const { selectedChat, chatList, setSelectedChat } = useChatContext()

  // Check if notifications are supported
  const isNotificationSupported = () => {
    return "Notification" in window
  }

  // Check if the environment is Android
  const isAndroid = () => {
    return /Android/i.test(navigator.userAgent)
  }

  // Request notification permission
  const requestPermission = async () => {
    if (isNotificationSupported()) {
      try {
        const permission = await Notification.requestPermission()
        console.log("Notification permission:", permission)
      } catch (error) {
        console.error("Error requesting notification permission:", error)
      }
    } else {
      console.warn("Notifications are not supported in this browser.")
    }
  }

  // Show a notification
  const showNotification = (title: string, options?: NotificationOptions) => {
    if (isNotificationSupported() && Notification.permission === "granted") {
      // Android-specific handling
      if (isAndroid() && "serviceWorker" in navigator) {
        // Use Service Worker for Android notifications
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, options)
        })
      } else {
        // Standard notification for non-Android or non-Service Worker environments
        const notification = new Notification(title, options)

        // Handle notification click
        notification.onclick = () => {
          window.focus()
          const chat = chatList.find((c) => c.roomId === options?.data?.roomId)
          if (chat) {
            setSelectedChat(chat)
          }
        }
      }
    } else {
      // Fallback for unsupported browsers (e.g., iOS, older Android browsers)
      console.warn("Notifications are not supported or permission is not granted.")
      alert(title + ": " + (options?.body || ""))
    }
  }

  // Automatically request permission when the hook is used
  useEffect(() => {
    if (isNotificationSupported()) {
      requestPermission()
    }
  }, [])

  return { requestPermission, showNotification, isNotificationSupported }
}

