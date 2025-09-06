"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type UserProfile = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: "admin" | "operator" | "customer" | "supplier"
  status: "active" | "suspended" | "pending"
}

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  role: string
  canManageStatus: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
}

type SignUpData = {
  email: string
  password: string
  firstName: string
  lastName: string
  role: "customer" | "supplier"
}

// Create default context value to prevent null errors
const defaultContextValue: AuthContextType = {
  user: null,
  profile: null,
  loading: true,
  role: "customer",
  canManageStatus: false,
  signIn: async () => { throw new Error('Auth not initialized') },
  signUp: async () => { throw new Error('Auth not initialized') },
  signOut: async () => { throw new Error('Auth not initialized') },
  refreshRole: async () => { throw new Error('Auth not initialized') },
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ALL HOOKS FIRST
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string>("customer")
  const [canManageStatus, setCanManageStatus] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const router = useRouter()

  // ALL FUNCTION DEFINITIONS NEXT (BEFORE ANY RETURNS)
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in:", email)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        throw error
      }

      console.log("Sign in successful")

      // Redirect based on role
      setTimeout(() => {
        if (email === "admin@example.com") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }, 1000)
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  const signUp = async (data: SignUpData) => {
    // ... your existing signUp implementation
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setRole("customer")
      setCanManageStatus(false)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleUserProfile = async (user: User) => {
    try {
      console.log('Fetching user profile for:', user.id)
      
      // Fetch user profile from the database
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // Set default profile if none exists
        const defaultProfile: UserProfile = {
          id: user.id,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          role: 'customer',
          status: 'active'
        }
        setProfile(defaultProfile)
        setRole('customer')
        setCanManageStatus(false)
      } else {
        setProfile(profileData)
        setRole(profileData.role)
        setCanManageStatus(profileData.role === 'admin' || profileData.role === 'operator')
      }
    } catch (error) {
      console.error('Error in handleUserProfile:', error)
      setInitError('Failed to load user profile')
    }
  }

  const initializeAuth = async () => {
    try {
      console.log('Initializing authentication...')
      setLoading(true)
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setInitError('Failed to initialize authentication')
        setLoading(false)
        return
      }

      if (session?.user) {
        console.log('User session found:', session.user.id)
        setUser(session.user)
        await handleUserProfile(session.user)
      } else {
        console.log('No active session found')
        setUser(null)
        setProfile(null)
        setRole('customer')
        setCanManageStatus(false)
      }

      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id)
          
          if (session?.user) {
            setUser(session.user)
            await handleUserProfile(session.user)
          } else {
            setUser(null)
            setProfile(null)
            setRole('customer')
            setCanManageStatus(false)
          }
        }
      )

      // Cleanup function will be handled by the component unmount
      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      setInitError('Failed to initialize authentication')
    } finally {
      setLoading(false)
    }
  }

  const refreshRole = async () => {
    if (user) {
      await handleUserProfile(user)
    }
  }

  // ALL useEffect HOOKS
  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && user) {
        setUser(null)
        setProfile(null)
        router.push('/auth/login')
      }
    }, 60000)
    
    return () => clearInterval(interval)
  }, [user])

  // CONDITIONAL LOGIC LAST (AFTER ALL HOOKS)
  const contextValue = {
    user: initError ? null : user,
    profile: initError ? null : profile,
    loading: initError ? false : loading,
    role: initError ? "customer" : role,
    canManageStatus: initError ? false : canManageStatus,
    signIn: initError ? async () => { throw new Error('Auth not available') } : signIn,
    signUp: initError ? async () => { throw new Error('Auth not available') } : signUp,
    signOut: initError ? async () => { throw new Error('Auth not available') } : signOut,
    refreshRole: initError ? async () => { throw new Error('Auth not available') } : refreshRole,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    console.error('useAuth called outside AuthProvider')
    return defaultContextValue
  }
  return context
}
