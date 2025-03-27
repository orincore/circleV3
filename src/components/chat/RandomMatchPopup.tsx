import React from "react"
import { motion } from "framer-motion"
import { Button } from "../ui/Button"
import { useChatContext } from "./ChatProvider"
import { maskName } from "./utils"
import { X, UserPlus, UserMinus, Loader2 } from "lucide-react"

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
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-4 text-center relative"
      >
        <button
          className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={closePopup}
        >
          <X className="w-5 h-5" />
        </button>

        {!matchedUser ? (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Finding a Match</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{matchingStatus}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">We're looking for someone with similar interests</p>
          </>
        ) : matchStatus === "pending" || matchStatus === "waiting" ? (
          <>
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-yellow-400 to-primary-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                <img
                  src={matchedUser.avatar || `https://ui-avatars.com/api/?name=${matchedUser.name}&background=random`}
                  alt={matchedUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Match Found!</h2>
            <p className="text-xl text-primary-500 mb-1">{maskName(matchedUser.name)}</p>
            <div className="flex justify-center gap-2 mb-4">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                {matchedUser.age || "-"} years
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                {matchedUser.location || "-"}
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                {matchedUser.gender || "-"}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {accepted ? "Waiting for response..." : "Would you like to connect?"}
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={rejectRandomMatch}
                disabled={accepted}
                className="rounded-full flex items-center gap-2"
              >
                <UserMinus className="w-4 h-4" />
                Reject
              </Button>
              <Button onClick={acceptRandomMatch} disabled={accepted} className="rounded-full flex items-center gap-2">
                {accepted ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Accept
                  </>
                )}
              </Button>
            </div>
          </>
        ) : matchStatus === "connected" ? (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Connected!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You can now start chatting with {matchedUser.name.split(" ")[0]}
            </p>
            <Button
              onClick={() => {
                setIsRandomMatching(false)
                // Force mobile layout update
                setTimeout(() => window.dispatchEvent(new Event("resize")), 100)
              }}
              className="rounded-full"
            >
              Start Chatting
            </Button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Finding a Match</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{matchingStatus}</p>
          </>
        )}
      </motion.div>
    </div>
  )
}

