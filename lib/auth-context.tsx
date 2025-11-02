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
    try {
      // Basic client-side validation (redundant with form but defensive)
      if (!data.email || !data.password) {
        throw new Error('Email and password are required')
      }

      // Perform Supabase sign up with user metadata
      const { data: signUpResult, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/confirmed`,
        },
      })

      if (error) {
        console.error('Sign up error:', error)
        throw error
      }

      // If sign-up succeeded, trigger confirmation email via API (custom flow)
      const createdUser = signUpResult.user
      const email = createdUser?.email || data.email

      try {
        await fetch('/api/auth/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: createdUser?.id,
            email,
            userName: data.firstName || email,
          }),
        })
      } catch (mailErr) {
        // Non-blocking: log but continue to check-email page
        console.warn('Failed to trigger confirmation email:', mailErr)
      }

      // Navigate user to the check-email page
      router.push(`/auth/check-email?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      // Map common errors to clearer messages
      const msg = err?.message || 'Registration failed'
      if (msg.toLowerCase().includes('already registered')) {
        throw new Error('This email is already registered. Please sign in or use a different email.')
      }
      throw err
    }
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
      const startTime = performance.now()
      console.log('🔍 Fetching user profile for:', user.id)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      )
      
      // Fetch user profile from the database with timeout
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      const { data: profileData, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any

      const endTime = performance.now()
      const duration = endTime - startTime
      console.log(`⏱️ Profile fetch completed in ${duration.toFixed(2)}ms`)
      
      if (error) {
        console.error('❌ Error fetching profile:', error)
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
        console.log('✅ Using default profile for user')
      } else {
        setProfile(profileData)
        setRole(profileData.role)
        setCanManageStatus(profileData.role === 'admin' || profileData.role === 'operator')
        console.log(`✅ Profile loaded: ${profileData.role} user`)
      }
    } catch (error) {
      console.error('❌ Error in handleUserProfile:', error)
      if (error instanceof Error && error.message === 'Profile fetch timeout') {
        console.error('🚨 Profile fetch timed out after 10 seconds')
      }
      
      // Don't set initError for profile failures - use default profile instead
      console.log('⚠️ Profile fetch failed, using default profile')
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
    }
  }

  const initializeAuth = async () => {
    try {
      const initStartTime = performance.now()
      console.log('🚀 Initializing authentication...')
      setLoading(true)
      
      // Get current session with timeout
      console.log('📡 Getting current session...')
      const sessionStartTime = performance.now()
      const { data: { session }, error } = await supabase.auth.getSession()
      const sessionEndTime = performance.now()
      console.log(`⏱️ Session fetch completed in ${(sessionEndTime - sessionStartTime).toFixed(2)}ms`)
      
      if (error) {
        console.error('❌ Error getting session:', error)
        console.log('⚠️ Session fetch failed, continuing with logged-out state')
        // Don't set initError - just continue with no session
        setUser(null)
        setProfile(null)
        setRole('customer')
        setCanManageStatus(false)
        setLoading(false)
        return
      }

      if (session?.user) {
        console.log('✅ User session found:', session.user.id)
        setUser(session.user)
        console.log('👤 Loading user profile...')
        await handleUserProfile(session.user)
      } else {
        console.log('ℹ️ No active session found')
        setUser(null)
        setProfile(null)
        setRole('customer')
        setCanManageStatus(false)
      }

      // Set up auth state change listener
      console.log('🔄 Setting up auth state listener...')
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state changed:', event, session?.user?.id)
          
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
      
      const initEndTime = performance.now()
      console.log(`🎉 Auth initialization completed in ${(initEndTime - initStartTime).toFixed(2)}ms`)

      // Cleanup function will be handled by the component unmount
      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error)
      console.log('⚠️ Auth initialization failed, continuing with logged-out state')
      // Don't set initError - just ensure clean logged-out state
      setUser(null)
      setProfile(null)
      setRole('customer')
      setCanManageStatus(false)
    } finally {
      setLoading(false)
    }
  }

  const refreshRole = async () => {
    if (user) {
      await handleUserProfile(user)
    }
  }

  useEffect(() => {
    initializeAuth()
  }, [])

  // PROVIDER RETURN LAST
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        role,
        canManageStatus,
        signIn,
        signUp,
        signOut,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
