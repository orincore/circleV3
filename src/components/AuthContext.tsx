// src/contexts/AuthContext.tsx
import React from 'react'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/SupabaseClient'
import { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getCurrentSession = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Error getting session:', error)
      setSession(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    getCurrentSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [getCurrentSession])


  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      setUser(data.user)
      setSession(data.session)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      if (error) throw error
      setUser(data.user ?? null)
      setSession(data.session ?? null)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
    } catch (error) {
      console.error('Session refresh error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      isLoading, 
      login, 
      register, 
      logout,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}