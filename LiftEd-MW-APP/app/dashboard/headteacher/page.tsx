"use client"

import { useMemo, useEffect, useState } from "react"
import { 
  Users, TrendingUp, AlertTriangle, Activity, 
  FileText, CalendarCheck, ChevronRight, ShieldAlert, Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid
} from "recharts"

const RISK_COLORS = { red: "#ef4444", yellow: "#f59e0b", green: "#22c55e" }
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function HeadteacherDashboard() {
  const { user } = useAuth()
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [allTeachers, setAllTeachers] = useState<any[]>([]) 
  const [attendanceRate, setAttendanceRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<any[]>([])
  const [schoolName, setSchoolName] = useState("Loading School...")
  useEffect(() => {
    async function fetchOverseerData() {
      if (!user?.id) return;
      try {
        setLoading(true)
        
       // First, get the Headteacher's linked school_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const mySchoolId = profile?.school_id

  // 2. Now fetch data ONLY for that school
  const [teacherRes, studentsRes, attendanceViewRes, profileRes] = await Promise.all([
    fetch(`/api/teachers?headteacherId=${user.id}`).then(res => res.json()),
    
    // THE FIX: Add the .eq filter here!
    supabase.from('students').select('*').eq('school_id', mySchoolId),
    
    // THE FIX: Add the .eq filter here too!
    supabase.from('grade_attendance_summary').select('attendance_pct').eq('school_id', mySchoolId),
    
    supabase.from('profiles').select('schools(name)').eq('id', user.id).single()
  ])

        // 2. SET THE DYNAMIC SCHOOL NAME
        if (profileRes.data?.schools) {
  // Add the [0] or a check to access the object inside the returned array
  const schoolData = Array.isArray(profileRes.data.schools) 
    ? profileRes.data.schools[0] 
    : profileRes.data.schools;

  setSchoolName(schoolData?.name || "Kachere Primary");
}

        // ... rest of your existing logic for attendance and students ...
        // 2. CALCULATE SCHOOL-WIDE ATTENDANCE FROM VIEW (Restored your exact working logic)
        if (attendanceViewRes.data && attendanceViewRes.data.length > 0) {
          const totalPct = attendanceViewRes.data.reduce((sum, row) => sum + (row.attendance_pct || 0), 0)
          const avg = Math.round(totalPct / attendanceViewRes.data.length)
          setAttendanceRate(avg)
        }

        // 3. NORMALIZE STUDENT DATA (Keeps the Risk Alerts working perfectly)
        if (studentsRes.data) {
          const rawStudents = studentsRes.data;
          
          const normalized = rawStudents.map((s: any) => {
            const rawLevel = (s.risk_level || "green").toLowerCase();
            let normalizedLevel = "green";
            
            if (rawLevel.includes('red') || rawLevel.includes('high') || rawLevel.includes('critical')) {
              normalizedLevel = 'red';
            } else if (rawLevel.includes('yellow') || rawLevel.includes('medium')) {
              normalizedLevel = 'yellow';
            }

            return {
              ...s,
              risk_level: normalizedLevel,
              risk_score: s.risk_score ?? 0 
            }
          });

          const total = normalized.length
          setDrivers([
            { factor: "Low Home Study", pct: total > 0 ? Math.round((normalized.filter(s => (s.home_study_freq || 0) < 3).length / total) * 100) : 0, color: "bg-red-500" },
            { factor: "Uniform Gaps", pct: total > 0 ? Math.round((normalized.filter(s => (s.uniform_paid || 0) < 3).length / total) * 100) : 0, color: "bg-[#1e3a8a]" },
            { factor: "Economic Pressure", pct: total > 0 ? Math.round((normalized.filter(s => s.risk_level === 'red').length / total) * 100) : 0, color: "bg-[#1e3a8a]" },
            { factor: "Material Access", pct: total > 0 ? Math.round((normalized.filter(s => s.textbook_access !== 1).length / total) * 100) : 0, color: "bg-amber-500" }
          ])

          setAllStudents(normalized)
        }

        setAllTeachers(teacherRes.teachers || [])
      } catch (err) {
        console.error("Dashboard Sync Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOverseerData()
  }, [user?.id])
  // --- Aggregate Data for Charts ---
  const stats = useMemo(() => {
    const red = allStudents.filter((s) => s.risk_level === "red").length
    const yellow = allStudents.filter((s) => s.risk_level === "yellow").length
    const green = allStudents.filter((s) => s.risk_level === "green").length
    return { red, yellow, green }
  }, [allStudents])

  const pieData = [
    { name: "High Risk", value: stats.red, color: RISK_COLORS.red },
    { name: "Moderate", value: stats.yellow, color: RISK_COLORS.yellow },
    { name: "Stable", value: stats.green, color: RISK_COLORS.green },
  ]

  const gradeBreakdown = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7, 8].map((grade) => {
      const gradeStudents = allStudents.filter((s) => s.standard === grade)
      return {
        grade: `Std ${grade}`,
        high: gradeStudents.filter((s) => s.risk_level === "red").length,
        med: gradeStudents.filter((s) => s.risk_level === "yellow").length,
        low: gradeStudents.filter((s) => s.risk_level === "green").length,
      }
    })
  }, [allStudents])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing Institutional Data...</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-8 w-full pb-10 max-w-7xl mx-auto px-4 font-sans text-slate-900">
      
      {/* 1. EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6 mt-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#1e3a8a]">{schoolName} Overview</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1 italic">
            Institutional Oversight <ChevronRight className="h-4 w-4" /> {user?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/headteacher/attendance">
            <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 gap-2 font-bold text-xs h-11 text-slate-600">
              <CalendarCheck className="h-4 w-4" /> Attendance Logs
            </Button>
          </Link>
          <Button className="bg-[#1e3a8a] hover:bg-blue-900 rounded-xl gap-2 shadow-lg font-bold text-xs text-white h-11">
            <FileText className="h-4 w-4" /> Generate Report
          </Button>
        </div>
      </div>

      {/* 2. KPI GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Enrollment" value={allStudents.length} subtitle="Live Student Count" icon={Users} />
        <StatCard title="Avg Attendance" value={`${attendanceRate}%`} subtitle="Synced via LiftEd API" icon={TrendingUp} />
        <StatCard title="Critical Alerts" value={stats.red} subtitle="High Risk Index" icon={ShieldAlert} />
        <StatCard title="Active Staff" value={allTeachers.length} subtitle="Total Educators" icon={Activity} />
      </div>

      {/* 3. MAIN CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-md rounded-[24px] bg-white">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-lg font-bold text-[#1e3a8a]">Risk Profile by Standard</CardTitle>
            <CardDescription className="font-medium text-slate-400">Aggregated vulnerability per grade</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] px-6 pb-6 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} fontSize={12} fontWeight={600} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="high" stackId="a" fill={RISK_COLORS.red} barSize={40} />
                <Bar dataKey="med" stackId="a" fill={RISK_COLORS.yellow} />
                <Bar dataKey="low" stackId="a" fill={RISK_COLORS.green} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-[24px] bg-white">
          <CardHeader className="px-8 pt-8 text-center">
            <CardTitle className="text-lg font-bold text-[#1e3a8a]">Total Risk Census</CardTitle>
            <CardDescription className="font-medium text-slate-400 italic">Predictive Summary</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-10">
              <p className="text-center">
                <span className="block text-3xl font-black text-[#1e3a8a]">{allStudents.length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Students</span>
              </p>
            </div>
          </CardContent>
          <div className="px-8 pb-8 space-y-3">
             {pieData.map(item => (
               <div key={item.name} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                   <span className="font-bold text-slate-500">{item.name}</span>
                 </div>
                 <span className="font-black text-[#1e3a8a]">{item.value}</span>
               </div>
             ))}
          </div>
        </Card>
      </div>

      {/* 4. DRIVERS & FACULTY SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        <Card className="border-none shadow-md rounded-[24px] bg-white">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-lg font-bold text-[#1e3a8a]">Vulnerability Drivers</CardTitle>
            <CardDescription className="font-medium text-slate-400">Impact of MSAS predictors school-wide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 px-8 pb-8">
            {drivers.map((p) => (
              <div key={p.factor} className="space-y-2">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <span>{p.factor}</span>
                  <span className="text-[#1e3a8a] font-black">{p.pct}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} transition-all duration-1000 shadow-sm`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-[24px] bg-[#1e3a8a] text-white">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-lg font-bold text-blue-100">Faculty Insight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8">
             <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Active Staff</span>
                  <span className="text-2xl font-black">{allTeachers.length}</span>
                </div>
                <p className="text-sm text-blue-100/70 italic font-medium">Accounts provisioned and active.</p>
             </div>
             <div className="pt-2">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-3">Institutional Tasks</p>
                <ul className="space-y-2 text-sm font-medium">
                   <li className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5 text-blue-100">
                     <div className="h-1.5 w-1.5 rounded-full bg-blue-300" /> Review teacher intervention logs
                   </li>
                   <li className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5 text-blue-100">
                     <div className="h-1.5 w-1.5 rounded-full bg-blue-300" /> Validate attendance data sync
                   </li>
                </ul>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}