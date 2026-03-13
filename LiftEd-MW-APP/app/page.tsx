"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { GraduationCap, BarChart3, Users, Shield, Zap, Globe, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function HomePage() {
  const { isAuthenticated, user, logout } = useAuth()
  const router = useRouter()

  // POLISHED REDIRECT: Automatically handles the flow to setup or dashboard based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase()
      if (!role || role === 'pending') {
        router.replace('/setup')
      } else {
        router.replace(`/dashboard/${role}`)
      }
    }
  }, [isAuthenticated, user, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // MODERN SHADCN LOADING STATE: Replaces the selection cards to eliminate the "1-second flash"
  if (isAuthenticated && user) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-white tracking-tight">LiftEd Malawi</h2>
            <p className="text-slate-400 text-sm animate-pulse mt-1">Entering your workspace...</p>
          </div>
        </div>
      </main>
    )
  }

  // LANDING PAGE: Flow and content maintained exactly as originally provided
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-white/20 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-900">LiftEd Malawi</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" className="text-blue-900 hover:bg-white/50">
                Home
              </Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-emerald-400 hover:bg-emerald-500 text-gray-900 font-semibold" style={{ backgroundColor: '#98FBCB' }}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-blue-900 mb-6 leading-tight">
              Prevent Student <span style={{ color: '#98FBCB' }}>Dropout</span> with AI
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              <strong>LiftEd Malawi</strong> uses machine learning to predict and prevent student dropout in Malawian primary schools. Empowering educators with actionable, real-time insights.
            </p>
            <div className="flex gap-4">
              <Link href="/auth">
                <Button size="lg" className="text-gray-900 text-lg px-8 font-bold hover:opacity-90" style={{ backgroundColor: '#98FBCB' }}>
                  Get Started
                </Button>
              </Link>
              
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-slate text-blue-900 hover:bg-blue-50 text-lg px-8">
                  Learn More
                </Button>
              </Link>
          </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl blur-3xl opacity-30 transition-opacity group-hover:opacity-50" style={{ background: 'radial-gradient(circle, rgba(152, 251, 203, 0.3) 0%, transparent 70%)' }} />
            <div className="relative bg-[#f0fff4]/80 backdrop-blur-xl border border-emerald-100/50 rounded-2xl p-6 shadow-2xl overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-8 border-b pb-4" style={{ borderColor: '#98FBCB' }}>
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                </div>
                <div className="h-6 w-32 rounded-full flex items-center justify-center" style={{ backgroundColor: '#98FBCB' }}>
                  <span className="text-[10px] text-blue-900 font-bold tracking-wider">LiftEd Malawi</span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Student A", risk: "High", color: "text-red-600", bg: "bg-red-50", bdr: "border-red-100" },
                  { name: "Student B", risk: "Medium", color: "text-amber-600", bg: "bg-amber-50", bdr: "border-amber-100" },
                  { name: "Student C", risk: "Low", color: "text-green-700", bg: "bg-white", bdr: "border-emerald-400" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#1e3a8a] rounded-xl border border-blue-400/20 shadow-xl transform transition-all hover:scale-[1.01]">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                        <Users className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        <div className="h-1.5 w-12 bg-slate-200 rounded-full mt-1" />
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${item.bg} ${item.color} ${item.bdr}`}>
                      {item.risk} Risk
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl shadow-lg" style={{ backgroundColor: '#1e3a8a' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">Dropout Trends by Class</span>
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-end gap-1.5 h-16">
                  {[20, 60, 45, 140, 55, 75, 40].map((h, i) => (
                    <div key={i} className="flex-1 bg-white/100 rounded-t-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-blue-900 mb-4 text-center">Powerful Features</h2>
        <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto">
          A data-driven ecosystem powered by machine learning to identify dropout triggers early, enabling teachers, headteachers, and PEAs to collaborate on targeted support for every at-risk student in Malawi.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: BarChart3, title: "Real-time Analytics", description: "Track student progress with advanced ML-powered risk scoring and predictions" },
            { icon: Zap, title: "Quick Interventions", description: "Identify at-risk students and deploy targeted interventions immediately" },
            { icon: Users, title: "Multi-role Platform", description: "Teachers, headteachers, and NGOs collaborate on one unified platform" },
          ].map((feature, i) => (
            <div key={i} className="group relative">
              <div className="relative bg-white/80 backdrop-blur-sm border-2 rounded-xl p-8 group-hover:shadow-xl transition-all duration-300" style={{ borderColor: '#98FBCB' }}>
                <feature.icon className="h-12 w-12 mb-4 transition-colors duration-300" style={{ color: '#1e3a8a' }} />
                <h3 className="text-xl font-bold text-blue-900 mb-2">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { label: "Schools", value: "3+" },
            { label: "Students Tracked", value: "500+" },
            { label: "Accuracy", value: "92%" },
            { label: "Interventions", value: "1000+" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm border-2 rounded-xl p-6 text-center shadow-lg" style={{ borderColor: '#98FBCB' }}>
              <div className="text-4xl font-bold text-blue-900 mb-2">{stat.value}</div>
              <div className="text-gray-700 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' }}>
          <div className="relative px-8 py-16 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Make a Difference?</h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join educators using LiftEd Malawi to prevent student dropout and improve educational outcomes.
            </p>
            <Link href="/auth">
              <Button size="lg" className="text-gray-900 hover:opacity-90 text-lg px-8 font-semibold" style={{ backgroundColor: '#98FBCB' }}>
                Start Free Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Full Footer restored */}
      <footer className="border-t bg-white/50 backdrop-blur-sm" style={{ borderColor: '#98FBCB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-blue-900">LiftEd Malawi</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">Using AI to predict and prevent student dropout in Malawian primary schools.</p>
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/auth" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Get Started</Link></li>
                <li><a href="#" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Features</a></li>
                <li><a href="#" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">About Us</a></li>
                <li><a href="#" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between" style={{ borderTop: '1px solid #98FBCB' }}>
            <div className="text-gray-700 text-sm font-medium">© 2026 LiftEd Malawi. All rights reserved.</div>
            <div className="flex gap-6 text-gray-700 text-sm mt-4 md:mt-0">
              <a href="#" className="hover:text-blue-900 transition-colors font-medium">Twitter</a>
              <a href="#" className="hover:text-blue-900 transition-colors font-medium">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}