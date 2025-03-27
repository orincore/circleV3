import React from "react"
import { cn } from "../../lib/utils"

interface AvatarProps {
  src: string
  alt: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  hasStory?: boolean
}

export function Avatar({ src, alt, size = "md", className = "", hasStory = false }: AvatarProps) {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  }

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden",
        hasStory && "p-0.5 bg-gradient-to-tr from-yellow-400 to-primary-500",
        sizeClasses[size],
        className,
      )}
    >
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className="w-full h-full rounded-full object-cover"
        onError={(e) => {
          ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${alt}&background=random`
        }}
      />
    </div>
  )
}

