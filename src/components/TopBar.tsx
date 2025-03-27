import React from "react"
import { useTheme } from "./ThemeProvider"
import { Sun, Moon, CircleUser } from "lucide-react"
import { Link } from "react-router-dom"

export function TopBar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
      <div className="container flex h-14 max-w-screen-md items-center">
        <div className="flex flex-1 items-center justify-between">
          <Link to="/home" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">Circle</span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-full w-9 h-9 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <Link
              to="/profile"
              className="rounded-full w-9 h-9 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Profile"
            >
              <CircleUser size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

