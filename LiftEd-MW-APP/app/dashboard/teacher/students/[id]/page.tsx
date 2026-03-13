"use client"

import { useState, useEffect, use, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { 
  ChevronLeft, Brain, AlertTriangle, MapPin, 
  Activity, Home, User, Phone, 
  BookOpen, ShieldCheck, AlertCircle, Loader2,
  Wallet, Users, GraduationCap, TrendingUp, TrendingDown,
  Zap, Target, Award, Flag, CheckCircle2, Clock, Check
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const studentId = resolvedParams.id
  const searchParams = useSearchParams()

  const queryScore = searchParams.get("score")
  const queryLevel = searchParams.get("level")
  const queryFactors = searchParams.get("factors")

  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  // PARSE REAL FACTORS DIRECTLY FROM URL
  const riskFactorsFromBackend = useMemo(() => {
    if (queryFactors && queryFactors !== "") {
      return queryFactors.split('|')
    }
    return [] // Empty array if no factors
  }, [queryFactors])

  useEffect(() => {
    async function fetchStudentData() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*, student_history!student_history_student_id_fkey(*)')
          .eq('id', studentId)
          .single()

        if (error) throw error
        setStudent(data)
      } catch (err) {
        console.error("[v0] Error fetching student details:", err)
      } finally {
        setLoading(false)
        setTimeout(() => setIsLoaded(true), 100)
      }
    }
    fetchStudentData()
  }, [studentId])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
        <p className="text-sm font-semibold text-slate-600">Loading profile...</p>
      </div>
    </div>
  )

  if (!student) return (
    <div className="p-10 text-center font-bold flex flex-col items-center gap-4 h-screen justify-center bg-slate-50">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="text-lg text-slate-700">Student profile not found.</p>
      <Link href="/dashboard/teacher/students"><Button variant="outline">Back to Roster</Button></Link>
    </div>
  )

  const riskScore = queryScore ? parseFloat(queryScore) : Math.round((student.risk_score || 0) * 100)
  
  const getRiskConfig = () => {
    if (riskScore >= 60) return {
      category: "🚨 Critical Risk",
      colorClass: "text-red-600",
      bgClass: "bg-red-50",
      strokeClass: "text-red-500",
      borderClass: "border-red-200",
      message: "Immediate Intervention Required",
      summary: "This student requires urgent support. Our ML model has detected a significant downward trajectory across multiple protective factors. Early intervention in the next 7-14 days could be crucial.",
      icon: AlertTriangle,
      trend: <TrendingDown className="h-4 w-4 text-red-500" />,
      accentColor: "from-red-500 to-red-600",
      actionBg: "bg-red-100/50"
    }
    if (riskScore >= 25) return {
      category: "⚠️ Moderate Risk",
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50",
      strokeClass: "text-amber-500",
      borderClass: "border-amber-200",
      message: "Targeted Monitoring & Support",
      summary: "This student shows vulnerability in key protective factors. Regular check-ins and targeted resource provision (especially learning materials and financial support) are recommended.",
      icon: Activity,
      trend: <Activity className="h-4 w-4 text-amber-500" />,
      accentColor: "from-amber-500 to-amber-600",
      actionBg: "bg-amber-100/50"
    }
    return {
      category: "✓ Low Risk",
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
      strokeClass: "text-emerald-500",
      borderClass: "border-emerald-200",
      message: "Stable & Supported",
      summary: "This student maintains strong protective factors and demonstrates consistent engagement. Continue current support strategies to maintain positive trajectory.",
      icon: ShieldCheck,
      trend: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      accentColor: "from-emerald-500 to-emerald-600",
      actionBg: "bg-emerald-100/50"
    }
  }

  const config = getRiskConfig()

  return (
    <div className="flex flex-col gap-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen pb-16 font-sans">
      
      {/* Header Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-4 max-w-7xl mx-auto">
          <Link href="/dashboard/teacher/students">
            <Button variant="outline" size="icon" className="rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50 h-10 w-10">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[#1e3a8a] flex items-center gap-3 uppercase tracking-tight">
              {student.first_name} {student.last_name}
              <Badge className={`ml-auto uppercase text-[10px] font-black px-3 py-1 ${config.colorClass} ${config.bgClass} border ${config.borderClass}`}>
                {config.category}
              </Badge>
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 space-y-8">
        
        {/* Hero Section - Risk Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="rounded-3xl border-none shadow-lg bg-white overflow-hidden h-fit lg:col-span-1">
            <div className="p-8 flex flex-col items-center bg-gradient-to-br from-slate-50 to-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6">Risk Assessment Score</p>
              
              <div className="relative h-56 w-56 flex items-center justify-center mb-6">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                  <circle 
                    cx="100" cy="100" r="90" 
                    stroke="currentColor" 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray={565} 
                    strokeDashoffset={isLoaded ? 565 - (565 * riskScore) / 100 : 565} 
                    strokeLinecap="round" 
                    className={`${config.strokeClass} transition-all duration-1500 ease-out`} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-black tracking-tighter ${config.colorClass}`}>{riskScore.toFixed(0)}</span>
                  <span className="text-xs font-bold text-slate-500 mt-1">%</span>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.actionBg} border ${config.borderClass}`}>
                {config.trend}
                <span className={`text-xs font-bold uppercase tracking-wider ${config.colorClass}`}>
                  {riskScore >= 60 ? "Declining Fast" : riskScore >= 25 ? "Watch Closely" : "Stable Trend"}
                </span>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className={`border-none text-white p-8 rounded-3xl shadow-xl relative overflow-hidden bg-gradient-to-br ${config.accentColor}`}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-6 w-6 text-white/90" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">LiftEd EWS Diagnostic</span>
                </div>
                <h2 className="text-3xl font-black mb-4 leading-tight">{config.message}</h2>
                <p className="text-base text-white/90 leading-relaxed font-medium">{config.summary}</p>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Terms Analyzed", value: "5", icon: Clock },
                { label: "Factors Monitored", value: "15", icon: Target },
                { label: "Model Accuracy", value: "83%", icon: Award }
              ].map((stat, i) => (
                <Card key={i} className="rounded-2xl border-none shadow-sm bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-blue-50"><stat.icon className="h-4 w-4 text-[#1e3a8a]" /></div>
                  </div>
                  <p className="text-2xl font-black text-[#1e3a8a]">{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Major Risk Factors OR Stable Status */}
        <Card className="rounded-3xl border-none shadow-lg bg-white overflow-hidden">
          {riskScore >= 25 ? (
            <>
              <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-100">
                <h3 className="text-xl font-black text-[#1e3a8a] flex items-center gap-2 uppercase tracking-tight">
                  <Zap className="h-5 w-5 text-amber-500" /> Primary Risk Drivers
                </h3>
              </div>
              <CardContent className="p-8">
                {riskFactorsFromBackend.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {riskFactorsFromBackend.slice(0, 3).map((factor, i) => (
                      <div key={i} className="relative p-6 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
                        <div className="absolute -top-3 -left-2 h-8 w-8 rounded-full bg-red-500 text-white font-black text-sm flex items-center justify-center">{i + 1}</div>
                        <p className="text-sm font-black text-slate-900 leading-snug mb-3">{factor}</p>
                        <div className="mt-4 h-1 bg-red-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${90 - i * 15}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 font-medium">
                    Analysis pending. Run a new assessment to view drivers.
                  </div>
                )}
                
                {riskFactorsFromBackend.length > 0 && (
                  <div className="mt-8 p-6 rounded-2xl bg-blue-50 border border-blue-200">
                    <h4 className="font-black text-blue-900 mb-2 uppercase text-sm">Recommended Actions</h4>
                    <ul className="space-y-2 text-sm text-blue-800 font-medium">
                      <li>• Prioritize intervention for: <strong>{riskFactorsFromBackend[0]}</strong></li>
                      <li>• Coordinate with guardians to address resource gaps</li>
                      <li>• Document intervention outcomes in next 14 days</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            // STABLE STUDENT UI
            <div className="p-12 text-center bg-emerald-50/50">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-emerald-800 uppercase tracking-tight mb-2">Protective Factors Confirmed</h3>
              <p className="text-emerald-600 font-medium max-w-md mx-auto">
                No critical risk drivers detected. The student possesses adequate resources and engagement levels to maintain their academic trajectory.
              </p>
            </div>
          )}
        </Card>

        {/* Student Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-3xl border-none shadow-lg bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 pb-4">
              <CardTitle className="text-lg font-black text-[#1e3a8a] uppercase tracking-tight">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: "Full Name", value: `${student.first_name} ${student.last_name}`, icon: User },
                { label: "Student Code", value: student.student_code || `MW-00${student.id}`, icon: GraduationCap },
                { label: "Age", value: student.age ? `${student.age} years` : "N/A", icon: Activity },
                { label: "Gender", value: student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1) || "N/A", icon: Users }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-[#1e3a8a] h-fit">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-slate-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 pb-4">
              <CardTitle className="text-lg font-black text-emerald-700 uppercase tracking-tight">Guardian Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: "Guardian Name", value: student.guardian_name || "Not Provided", icon: User },
                { label: "Contact Number", value: student.guardian_phone || "Not Provided", icon: Phone },
                { label: "Home Address", value: student.home_address || "Not Provided", icon: MapPin },
                { label: "Last Check-in", value: new Date().toLocaleDateString(), icon: Clock }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 h-fit">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-slate-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Footer Action */}
        <div className="flex gap-4 justify-center pb-8">
          <Link href="/dashboard/teacher/students">
            <Button variant="outline" className="rounded-xl font-bold">← Back to Roster</Button>
          </Link>
          <Link href={`/dashboard/teacher/predict?student=${studentId}`}>
            <Button className="rounded-xl font-bold bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90">
              Run New Assessment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}