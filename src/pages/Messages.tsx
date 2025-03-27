import React, { useEffect, useRef, useState } from "react";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { RandomMatchPopup } from "../components/chat/RandomMatchPopup";
import { useNotification } from "../hooks/useNotification";
import { Menu, X } from "lucide-react";

// Custom hook to detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

export default function Messages() {
  const isMobile = useIsMobile();
  // On mobile, default to hidden sidebar; on desktop, always show.
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const { requestPermission } = useNotification();

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // When screen size changes, automatically show sidebar on desktop.
  useEffect(() => {
    if (!isMobile) {
      setShowSidebar(true);
    }
  }, [isMobile]);

  return (
    <div className="h-[calc(100vh-8rem)] flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Mobile menu button: only render on mobile */}
      {isMobile && (
        <button
          className="md:hidden fixed top-3 left-4 z-50 p-3 bg-primary-500 text-white rounded-full shadow-lg"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:block w-full md:w-80 flex-shrink-0 z-40 md:relative fixed inset-0 transition-transform duration-300 ease-in-out bg-white dark:bg-gray-900`}
      >
        <ChatSidebar onSelectChat={() => isMobile && setShowSidebar(false)} />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <ChatWindow onOpenSidebar={() => isMobile && setShowSidebar(true)} />
      </div>

      <RandomMatchPopup />
    </div>
  );
}
