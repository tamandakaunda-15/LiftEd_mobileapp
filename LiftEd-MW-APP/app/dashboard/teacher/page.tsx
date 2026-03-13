"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Users, CalendarCheck, AlertTriangle, ClipboardList, 
  Brain, Loader2, ArrowRight, TrendingUp, BarChart3 
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, Legend 
} from "recharts"

const MINT_BORDER = "border-[#ccfbf1]"
const SLATE_BORDER = "border-slate-200/60"
const DEEP_BLUE = "text-[#1e3a8a]"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [myStudents, setMyStudents] = useState<any[]>([])
  const [classTitle, setClassTitle] = useState("Standard")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    attendanceToday: "0%",
    activeInterventions: 0,
    genderWeekly: [
      { day: 'Mon', boys: 92, girls: 88 },
      { day: 'Tue', boys: 94, girls: 95 },
      { day: 'Wed', boys: 89, girls: 82 },
      { day: 'Thu', boys: 95, girls: 91 },
      { day: 'Fri', boys: 91, girls: 96 },
    ]
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/teacher/students?teacherId=${user.id}`)
        const rosterData = await res.json()
        const students = rosterData.students || []
        
        const { count: activeInts } = await supabase
          .from('interventions')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id)
          .neq('status', 'completed')

        const today = new Date().toISOString().split('T')[0]
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')
          .eq('teacher_id', user.id)
          .eq('date', today)

        let attendancePct = "0%"
        if (attendanceData && attendanceData.length > 0) {
          const present = attendanceData.filter(a => a.status === 'present').length
          attendancePct = `${Math.round((present / students.length) * 100)}%`
        }

        // --- DATA NORMALIZATION ---
        // This ensures 'HIGH RISK', 'red', and 'Critical' all count as 'red'
        const normalizedStudents = students.map((s: any) => {
          const rawLevel = (s.risk_level || "green").toLowerCase();
          let normalizedLevel = "green";
          
          if (rawLevel.includes('red') || rawLevel.includes('high') || rawLevel.includes('critical')) {
            normalizedLevel = 'red';
          } else if (rawLevel.includes('yellow') || rawLevel.includes('medium')) {
            normalizedLevel = 'yellow';
          }

          return {
            id: s.id,
            firstName: s.first_name,
            lastName: s.last_name,
            riskLevel: normalizedLevel,
            riskScore: s.risk_score ?? 0,
            gender: s.gender?.toLowerCase() || "female",
            gradeLevel: rosterData.className?.replace("Standard ", "") || "N/A"
          }
        })

        setMyStudents(normalizedStudents)
        setClassTitle(rosterData.className || "Classroom")
        setStats(prev => ({
          ...prev,
          attendanceToday: attendancePct,
          activeInterventions: activeInts || 0,
        }))

      } catch (error) { 
        console.error("Dashboard Fetch Error:", error) 
      } finally { 
        setIsLoading(false) 
      }
    }
    fetchDashboardData()
  }, [user?.id])

  // RECENT AT RISK: Pulls students who are Red or Yellow
  const recentAtRisk = useMemo(() => {
    return [...myStudents]
      .filter((s) => s.riskLevel === "red" || s.riskLevel === "yellow")
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
  }, [myStudents])

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="h-6 w-6 animate-spin text-slate-200" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-8 px-4 font-sans text-slate-900">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-slate-600 uppercase">{classTitle} Overview</h1>
          <p className="text-sm text-slate-500 font-medium">Hello, {user?.name}. Here is your briefing.</p>
        </div>
      </div>

      {/* 2. TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Students", val: myStudents.length, icon: Users },
          { label: "High Risk Students", val: myStudents.filter(s => s.riskLevel === "red").length, icon: AlertTriangle, highlight: "text-red-600" },
          { label: "Active Interventions", val: stats.activeInterventions, icon: ClipboardList },
          { label: "Today's Attendance", val: stats.attendanceToday, icon: CalendarCheck, highlight: "text-emerald-600" },
        ].map((stat, i) => (
          <Card key={i} className={`bg-white ${SLATE_BORDER} border-[1.5px] shadow-sm rounded-2xl`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-slate-400" />
              </div>
              <p className={`text-4xl font-bold tracking-tighter ${stat.highlight || DEEP_BLUE}`}>
                {stat.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. CHART GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* WEEKLY GENDER ATTENDANCE */}
        <Card className={`lg:col-span-2 bg-white ${SLATE_BORDER} border-[1.5px] shadow-sm rounded-3xl overflow-hidden`}>
  <CardHeader className="px-8 pt-8 flex flex-row items-center justify-between">
    <div>
      <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
        <BarChart3 className="h-5 w-5 text-blue-500" /> Weekly Attendance Trends
      </CardTitle>
      {/* Tweaked the description below to sound a bit more professional */}
      <CardDescription className="text-xs font-semibold uppercase tracking-widest text-slate-400 italic">
        Participation by Gender
      </CardDescription>
    </div>
  </CardHeader>
  <CardContent className="px-4 pb-6">
    <div className="h-[320px] w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.genderWeekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
          <YAxis hide domain={[0, 100]} />
          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold'}} />
          
          {/* Updated Colors Below! */}
          <Bar dataKey="boys" name="Boys" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
          <Bar dataKey="girls" name="Girls" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={25} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>
        {/* RISK PIE */}
        <Card className={`bg-white ${MINT_BORDER} border-[2.2px] shadow-sm rounded-3xl`}>
          <CardHeader className="px-8 pt-8 text-center">
            <CardTitle className="text-xl font-bold text-slate-900">Risk Distribution</CardTitle>
            <CardDescription className="text-xs font-semibold uppercase text-slate-400 italic font-mono tracking-tighter">AI Predictions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={[
                      { name: 'High Risk', value: myStudents.filter(s => s.riskLevel === 'red').length, fill: '#ff0000' },
                      { name: 'Stable', value: myStudents.filter(s => s.riskLevel !== 'red').length, fill: '#22c55e' }
                    ]} 
                    innerRadius={75} outerRadius={95} dataKey="value" stroke="none" paddingAngle={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-4 px-6 pb-4">
  <div className="flex justify-between items-center text-sm font-bold">
    <span className="flex items-center gap-2 font-semibold text-slate-600">
      <div className="h-2.5 w-2.5 rounded-full bg-red-500" /> High Risk
    </span>
    <span className="text-red-600 font-bold">
      {myStudents.filter(s => s.riskLevel === 'red').length}
    </span>
  </div>
  
  <div className="flex justify-between items-center text-sm font-bold border-t border-slate-50 pt-4">
    <span className="flex items-center gap-2 font-semibold text-slate-600">
      {/* Changed bg-[#1e3a8a] to bg-green-500 below */}
      <div className="h-2.5 w-2.5 rounded-full bg-green-500" /> Stable
    </span>
    {/* Added font-bold here so it matches the weight of the red number */}
    <span className="text-green-600 font-bold">
      {myStudents.filter(s => s.riskLevel !== 'red').length}
    </span>
  </div>
</div>
          </CardContent>
        </Card>

        {/* PRIORITY TRIAGE */}
        <Card className={`lg:col-span-3 bg-white ${SLATE_BORDER} border-[1.5px] shadow-sm rounded-3xl overflow-hidden`}>
          <CardHeader className="px-8 py-6 border-b border-slate-50 bg-slate-50/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#1e3a8a]" /> Critical Alerts
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-400">Immediate Action</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-x divide-slate-50">
              {recentAtRisk.length === 0 ? (
                 <div className="col-span-full py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No critical students detected</div>
              ) : (
                recentAtRisk.map((student) => (
                  <div key={student.id} className="p-8 hover:bg-slate-50/50 transition-all text-center group">
                    <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center font-bold text-[#1e3a8a] mx-auto mb-4 border-2 border-white shadow-md text-sm uppercase">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate mb-1 uppercase tracking-tight">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{Math.round(student.riskScore * 100)}% Risk</p>
                    
                    <Link href={`/dashboard/teacher/students/${student.id}`}>
                      <Button variant="ghost" size="sm" className="w-full text-[11px] font-bold text-slate-400 group-hover:text-[#1e3a8a] mt-4 rounded-xl">
                        Profile <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}