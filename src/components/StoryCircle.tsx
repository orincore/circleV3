import React from "react"
import { Avatar } from "./ui/Avatar"

interface User {
  id: string
  name: string
  username: string
  avatar: string
  hasUnseenStory?: boolean
}

interface StoryCircleProps {
  user: User
}

export function StoryCircle({ user }: StoryCircleProps) {
  return (
    <div className="flex flex-col items-center space-y-1 flex-shrink-0">
      <Avatar src={user.avatar} alt={user.name} size="lg" hasStory={user.hasUnseenStory} />
      <span className="text-xs truncate w-16 text-center">{user.username}</span>
    </div>
  )
}

