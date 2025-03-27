
import React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { X, Smile, MapPin, Tag, Image, Video, ArrowLeft } from "lucide-react"

export function Create() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [activeTab, setActiveTab] = useState<"photo" | "video">("photo")

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <button className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back</span>
        </button>
        <h1 className="text-lg font-semibold">Create New Post</h1>
        <button className="btn btn-primary btn-sm" disabled={!selectedImage || !caption.trim()}>
          Share
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
        <button
          className={`flex-1 py-3 font-medium text-sm ${
            activeTab === "photo"
              ? "text-primary-500 border-b-2 border-primary-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("photo")}
        >
          Photo
        </button>
        <button
          className={`flex-1 py-3 font-medium text-sm ${
            activeTab === "video"
              ? "text-primary-500 border-b-2 border-primary-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("video")}
        >
          Video
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {!selectedImage ? (
          <label className="block w-full aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
            <div className="flex flex-col items-center justify-center h-full">
              {activeTab === "photo" ? (
                <Image className="w-16 h-16 text-gray-400 mb-4" />
              ) : (
                <Video className="w-16 h-16 text-gray-400 mb-4" />
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Tap to upload {activeTab === "photo" ? "a photo" : "a video"}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 px-4 text-center">
                Share content that will appear on your profile
              </span>
              <input
                type="file"
                className="hidden"
                accept={activeTab === "photo" ? "image/*" : "video/*"}
                onChange={handleImageChange}
              />
            </div>
          </label>
        ) : (
          <div className="relative">
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Selected"
              className="w-full aspect-square object-cover rounded-lg"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="input min-h-[100px] w-full resize-none"
            rows={4}
          />
        </div>

        <div className="space-y-4">
          {/* Additional options */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
              <span className="text-gray-700 dark:text-gray-300">Add location</span>
            </div>
            <button className="text-primary-500">Add</button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center">
              <Tag className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
              <span className="text-gray-700 dark:text-gray-300">Tag people</span>
            </div>
            <button className="text-primary-500">Tag</button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center">
              <Smile className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
              <span className="text-gray-700 dark:text-gray-300">Add emoji</span>
            </div>
            <button className="text-primary-500">Add</button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">{caption.length}/2200</span>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm">Draft</button>
              <button className="btn btn-primary btn-sm" disabled={!selectedImage || !caption.trim()}>
                Share
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

