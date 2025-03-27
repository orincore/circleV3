import React from "react"
import { Link, useLocation } from "react-router-dom"
import { Home, Search, PlusSquare, MessageCircle, User } from "lucide-react"
import { cn } from "../lib/utils"

const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Explore", href: "/explore", icon: Search },
  { name: "Create", href: "/create", icon: PlusSquare },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Profile", href: "/profile", icon: User },
]

export function Navigation() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
      <div className="max-w-screen-md mx-auto px-4">
        <div className="flex justify-between">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center py-3 px-3",
                  isActive
                    ? "text-primary-500"
                    : "text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400",
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "fill-current text-primary-500")} />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

