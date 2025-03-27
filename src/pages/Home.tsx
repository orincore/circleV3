import React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react"
import { Avatar } from "../components/ui/Avatar"
import { StoryCircle } from "../components/StoryCircle"

const posts = [
  {
    id: 1,
    user: {
      id: "user1",
      name: "Sarah Chen",
      username: "sarahchen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    },
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
    caption: "Exploring new horizons 🌅 #adventure #travel",
    likes: 234,
    comments: 12,
    timestamp: "2h",
  },
  {
    id: 2,
    user: {
      id: "user2",
      name: "Alex Rivera",
      username: "alexrivera",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    },
    image: "https://images.unsplash.com/photo-1682687221038-404670d5f335",
    caption: "Coffee and code, perfect morning ☕️ #developer #coding",
    likes: 156,
    comments: 8,
    timestamp: "4h",
  },
  {
    id: 3,
    user: {
      id: "user3",
      name: "Mia Johnson",
      username: "miajohnson",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    },
    image: "https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1",
    caption: "Weekend vibes 🎵 #music #weekend",
    likes: 312,
    comments: 24,
    timestamp: "6h",
  },
]

// Generate stories from users and add some more
const stories = [
  { id: "story1", user: { ...posts[0].user, hasUnseenStory: true } },
  { id: "story2", user: { ...posts[1].user, hasUnseenStory: true } },
  { id: "story3", user: { ...posts[2].user, hasUnseenStory: true } },
  {
    id: "story4",
    user: {
      id: "user4",
      name: "David Kim",
      username: "davidkim",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      hasUnseenStory: true,
    },
  },
  {
    id: "story5",
    user: {
      id: "user5",
      name: "Emma Wilson",
      username: "emmawilson",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      hasUnseenStory: true,
    },
  },
  {
    id: "story6",
    user: {
      id: "user6",
      name: "James Lee",
      username: "jameslee",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce",
      hasUnseenStory: true,
    },
  },
]

export function Home() {
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [savedPosts, setSavedPosts] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]))
  }

  const toggleSave = (postId: number) => {
    setSavedPosts((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="py-4">
      {/* Stories */}
      <div className="mb-6">
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {stories.map((story) => (
            <StoryCircle key={story.id} user={story.user} />
          ))}
        </div>
      </div>

      {/* Posts */}
      {posts.map((post, index) => (
        <motion.article
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card mb-6 overflow-hidden"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Avatar src={post.user.avatar} alt={post.user.name} size="sm" className="ring-2 ring-primary-500" />
              <div className="ml-3">
                <span className="font-medium text-sm">{post.user.username}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{post.timestamp}</span>
              </div>
            </div>
            <button className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-1">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="aspect-square bg-gray-100 dark:bg-gray-800">
            <img src={post.image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>

          <div className="p-4">
            <div className="flex justify-between mb-2">
              <div className="flex space-x-4">
                <button
                  className={`${
                    likedPosts.includes(post.id) ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                  } hover:scale-110 transition-transform`}
                  onClick={() => toggleLike(post.id)}
                >
                  <Heart className={`w-6 h-6 ${likedPosts.includes(post.id) ? "fill-red-500" : ""}`} />
                </button>
                <button className="text-gray-700 dark:text-gray-300 hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="text-gray-700 dark:text-gray-300 hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
              <button
                className={`${
                  savedPosts.includes(post.id) ? "text-primary-500" : "text-gray-700 dark:text-gray-300"
                } hover:scale-110 transition-transform`}
                onClick={() => toggleSave(post.id)}
              >
                <Bookmark className={`w-6 h-6 ${savedPosts.includes(post.id) ? "fill-primary-500" : ""}`} />
              </button>
            </div>

            <div className="text-sm font-medium">
              {likedPosts.includes(post.id) ? post.likes + 1 : post.likes} likes
            </div>

            <p className="mt-1 text-sm">
              <span className="font-medium">{post.user.username}</span> {post.caption}
            </p>

            <button className="text-gray-500 dark:text-gray-400 text-sm mt-1">View all {post.comments} comments</button>

            <div className="mt-3 flex items-center border-t border-gray-100 dark:border-gray-800 pt-3">
              <Avatar src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde" alt="Your profile" size="xs" />
              <input
                type="text"
                placeholder="Add a comment..."
                className="text-sm bg-transparent flex-1 ml-3 focus:outline-none text-gray-700 dark:text-gray-300"
              />
              <button className="text-primary-500 font-medium text-sm">Post</button>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  )
}

