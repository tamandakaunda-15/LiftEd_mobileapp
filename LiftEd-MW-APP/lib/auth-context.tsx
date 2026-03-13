"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User, UserRole } from "./types"
// Import the actual Supabase client to check the session
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (role: UserRole, email: string, name: string, id: string) => void // 1. Added ID here
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Sync state with localStorage and Supabase session on load
  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem("lifted-user")
      if (stored) {
        setUser(JSON.parse(stored) as User)
      }
      
      // Also check if Supabase session is still active
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        logout()
      }
    }
    initAuth()
  }, [])

  // 2. Updated login to accept the REAL UUID from Supabase
  const login = useCallback((role: UserRole, email: string, name: string, id: string) => {
    const newUser: User = {
      id: id, // NO MORE RANDOM STRINGS! This is now the real Supabase UUID
      name: name,
      email: email,
      role: role,
      schoolId: "", // This will be updated by the setup process
      classIds: [], 
    }

    setUser(newUser)
    localStorage.setItem("lifted-user", JSON.stringify(newUser))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("lifted-user")
    supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}