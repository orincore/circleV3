import React from "react"
import { Outlet } from "react-router-dom"
import { Navigation } from "./Navigation"
import { TopBar } from "./TopBar"

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 max-w-screen-md w-full mx-auto pb-16 px-4">
        <Outlet />
      </main>
      <Navigation />
    </div>
  )
}

