import React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Search, TrendingUp, Users } from "lucide-react"
import { Avatar } from "../components/ui/Avatar"

const categories = ["For You", "Travel", "Art", "Food", "Music", "Sports", "Technology"]

const trendingTopics = [
  { id: 1, name: "Photography", posts: 1234 },
  { id: 2, name: "Travel", posts: 987 },
  { id: 3, name: "Technology", posts: 856 },
  { id: 4, name: "Food", posts: 743 },
]

const suggestedUsers = [
  {
    id: 1,
    name: "Emma Wilson",
    username: "emmaw",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    followers: 12.5,
  },
  {
    id: 2,
    name: "James Rodriguez",
    username: "jamesr",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    followers: 8.2,
  },
  {
    id: 3,
    name: "Sophia Lee",
    username: "sophial",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    followers: 9.7,
  },
]

// Generate explore grid images
const exploreImages = Array.from({ length: 15 }).map((_, index) => ({
  id: `img-${index}`,
  url: `https://source.unsplash.com/random/600x600?sig=${index}`,
  likes: Math.floor(Math.random() * 1000) + 100,
  comments: Math.floor(Math.random() * 100) + 10,
}))

export function Explore() {
  const [activeCategory, setActiveCategory] = useState("For You")
  const [followedUsers, setFollowedUsers] = useState<number[]>([])

  const toggleFollow = (userId: number) => {
    setFollowedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  return (
    <div className="py-4">
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="input pl-10 w-full bg-gray-100 dark:bg-gray-800 border-0"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto py-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                activeCategory === category
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Explore Grid */}
      <div className="grid grid-cols-3 gap-1 mb-8">
        {exploreImages.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="aspect-square relative group overflow-hidden"
          >
            <img
              src={image.url || "/placeholder.svg"}
              alt=""
              className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="text-white flex space-x-4">
                <div className="flex items-center">
                  <Heart className="w-5 h-5 mr-1 fill-white" />
                  <span>{image.likes}</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-1 fill-white" />
                  <span>{image.comments}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="mb-8">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-primary-500 mr-2" />
          <h2 className="text-lg font-semibold">Trending Topics</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {trendingTopics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-3"
            >
              <h3 className="font-medium text-primary-500">#{topic.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{topic.posts.toLocaleString()} posts</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-primary-500 mr-2" />
          <h2 className="text-lg font-semibold">Suggested Users</h2>
        </div>
        <div className="space-y-3">
          {suggestedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-3 flex items-center"
            >
              <Avatar src={user.avatar} alt={user.name} size="md" />
              <div className="ml-3 flex-1 min-w-0">
                <h3 className="font-medium text-sm">@{user.username}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.followers}k followers</p>
              </div>
              <button
                className={`btn btn-sm ${followedUsers.includes(user.id) ? "btn-outline" : "btn-primary"}`}
                onClick={() => toggleFollow(user.id)}
              >
                {followedUsers.includes(user.id) ? "Following" : "Follow"}
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

// Missing imports
import { Heart, MessageCircle } from "lucide-react"

