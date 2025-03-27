// src/components/AuthWrapper.tsx
import React, { useEffect, useState } from "react"
import { supabase } from "../lib/SupabaseClient"
import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

function AuthWrapper({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth()
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isLoading && user) {
      const checkProfile = async () => {
        try {
          const { data, error } = await supabase
            .from("user_profiles")
            .select("gender, interests")
            .eq("user_id", user.id)
            .single()

          if (error || !data) {
            setProfileComplete(false)
            return
          }

          const interests = typeof data.interests === "string" ? 
            data.interests.split(",").map(interest => interest.trim()) : 
            data.interests

          const hasRequiredFields = data.gender && interests?.length > 0
          setProfileComplete(!!hasRequiredFields)
        } catch (err) {
          setProfileComplete(false)
        }
      }
      checkProfile()
    } else if (!isLoading && !user) {
      setProfileComplete(true)
    }
  }, [isLoading, user])

  if (isLoading || profileComplete === null) {
    return <div>Loading...</div>
  }

  if (user && !profileComplete) {
    return <Navigate to="/profile-setup" replace />
  }

  return children
}

export default AuthWrapper