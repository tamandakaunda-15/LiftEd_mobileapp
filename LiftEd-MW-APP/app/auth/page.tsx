"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, ChevronRight, Mail, User, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner" 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const [formData, setFormData] = useState({ name: "", email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login, isAuthenticated, user } = useAuth()
  const router = useRouter()

  // --- AUTOMATIC REDIRECTION LOGIC ---
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase()
      
      if (!role || role === 'pending') {
        router.push('/setup')
      } else {
        router.push(`/dashboard/${role}`)
      }
    }
  }, [isAuthenticated, user, router])

  if (isAuthenticated && user) return null

  // --- UNIVERSAL SIGNUP ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name } }
      })

      if (authError) throw authError

      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        setError("This email is already registered. Please sign in instead.")
        setIsLoading(false)
        return
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          { id: authData.user.id, name: formData.name, role: 'PENDING' }
        ])
        if (profileError) throw profileError
      }

      if (!authData.session) {
        toast.success("Check your email!", {
          description: `We sent a verification link to ${formData.email}.`,
          duration: 10000,
        })
        setMode("login")
        setFormData({ ...formData, password: "" })
      } else {
        // PASS THE REAL ID TO LOGIN
        login("PENDING" as any, formData.email, formData.name, authData.user!.id)
        router.push("/setup")
      }

    } catch (err: any) {
      setError(err.message || "Failed to create account.")
    } finally {
      setIsLoading(false)
    }
  }

  // --- UNIVERSAL LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name, school_id')
        .eq('id', authData.user?.id)
        .single()

      const userName = authData.user?.user_metadata?.name || "User"
      const userRole = profile?.role ? profile.role.toLowerCase() : "pending"

      // PASS THE REAL ID TO LOGIN
      login(userRole.toUpperCase() as any, formData.email, userName, authData.user!.id)

      if (userRole === 'pending') {
        router.push('/setup')
      } else {
        router.push(`/dashboard/${userRole}`)
      }

    } catch (err: any) {
      if (err.message.includes("Email not confirmed")) {
        setError("Please check your email and verify your account.")
      } else {
        setError("Invalid email or password.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-[#98FBCB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#1e3a8a]">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1e3a8a]">LiftEd Malawi</span>
          </Link>
          <Link href="/">
            <Button variant="outline" className="text-gray-900 border-gray-300 hover:bg-gray-50">Back Home</Button>
          </Link>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Left Side Branding */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center p-12 bg-[#1e3a8a]">
          <h2 className="text-5xl font-bold text-white mb-8 leading-tight">
            {mode === 'signup' ? "Let's get started" : "Welcome Back"}
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-12">
            Join LiftEd Malawi to track student progress and prevent dropout. Secure, simple, and impactful.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#98FBCB]">
                <span className="text-blue-900 font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Sign in securely</h3>
                <p className="text-white/70 text-sm">Use your email and password</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#98FBCB]">
                <span className="text-blue-900 font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Automatic Routing</h3>
                <p className="text-white/70 text-sm">We'll direct you to your designated school portal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#1e3a8a]">
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </h1>
              <p className="text-gray-600 mt-2">Access your LiftEd workspace</p>
            </div>

            <form onSubmit={mode === 'signup' ? handleSignup : handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 font-medium text-sm">{error}</p>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98FBCB] transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98FBCB] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === 'signup' ? "Create a password" : "Enter your password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98FBCB] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-base font-medium py-3 text-blue-900 bg-[#98FBCB] hover:opacity-90"
                >
                  {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      {mode === 'signup' ? 'Create Account' : 'Sign In'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  {mode === 'signup' ? "Already have an account? " : "Don't have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signup' ? 'login' : 'signup')
                      setFormData({ name: "", email: "", password: "" })
                      setError("")
                    }}
                    className="font-medium text-[#1e3a8a] hover:opacity-80"
                  >
                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}