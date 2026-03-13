"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts"
import { GraduationCap, AlertTriangle, TrendingUp, Loader2 } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function GradeBreakdownPage() {
  const { user } = useAuth()
  const [gradeData, setGradeData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGradeSummary = async () => {
      if (!user?.id) return
      setIsLoading(true)
      try {
        // 1. GET THE HEADTEACHER'S SCHOOL ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single()

        const mySchoolId = profile?.school_id

        if (mySchoolId) {
          // 2. FETCH FROM THE VIEW & TABLE (STRICTLY FILTERED)
          const [viewRes, stuRes] = await Promise.all([
            supabase.from('grade_attendance_summary').select('*').eq('school_id', mySchoolId),
            supabase.from('students').select('standard, risk_level, risk_score').eq('school_id', mySchoolId)
          ])

          if (viewRes.data && stuRes.data) {
            const grades = [1, 2, 3, 4, 5, 6, 7, 8]
            
            const finalData = grades.map(g => {
              const viewEntry = viewRes.data.find(v => Number(v.standard) === g)
              const studentsInGrade = stuRes.data.filter(s => Number(s.standard) === g)
              
              const avgRisk = studentsInGrade.length > 0
                ? Math.round((studentsInGrade.reduce((sum, s) => sum + (s.risk_score || 0), 0) / studentsInGrade.length) * 100)
                : 0

              return {
                grade: `Std ${g}`,
                total: studentsInGrade.length,
                red: studentsInGrade.filter(s => s.risk_level === 'red' || s.risk_level === 'high').length,
                yellow: studentsInGrade.filter(s => s.risk_level === 'yellow' || s.risk_level === 'medium').length,
                green: studentsInGrade.filter(s => s.risk_level === 'green' || !s.risk_level).length,
                avgAttendance: viewEntry ? viewEntry.attendance_pct : 0,
                avgRiskScore: avgRisk
              }
            })
            setGradeData(finalData)
          }
        } else {
          // Fallback for new school with no data
          setGradeData([])
        }
      } catch (err) {
        console.error("Grade breakdown sync failed:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchGradeSummary()
  }, [user?.id])

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-screen pb-10 font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="px-6 pt-10">
        <h1 className="text-4xl font-black tracking-tighter text-[#1e3a8a]">Grade Intelligence</h1>
        <p className="mt-2 text-slate-500 font-medium">Aggregated via SQL View for high-performance school oversight.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6">
        
        {/* ATTENDANCE CHART (Using View Data) */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 px-8 py-6">
            <CardTitle className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#4ade80]" /> Attendance by Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 px-4 pb-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: "12px", border: "none" }} />
                  <Bar dataKey="avgAttendance" name="Attendance %" fill="#1e3a8a" radius={[6, 6, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* RISK TREND CHART */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 px-8 py-6">
            <CardTitle className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Dropout Risk Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 px-4 pb-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                  <Line type="monotone" dataKey="avgRiskScore" name="Risk %" stroke="#ef4444" strokeWidth={4} dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* GRADE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
        {gradeData.map((g) => (
          <Card key={g.grade} className="bg-white border-none shadow-sm rounded-3xl border-b-[6px] border-b-[#4ade80]">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[#1e3a8a] text-xl font-bold">{g.grade}</CardTitle>
                <GraduationCap className="h-6 w-6 text-slate-200" />
              </div>
              <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{g.total} Students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mt-4 px-1">
                <div className="text-center">
                  <p className="text-2xl font-black text-red-500">{g.red}</p>
                  <p className="text-[9px] font-black uppercase text-slate-300">High</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-amber-500">{g.yellow}</p>
                  <p className="text-[9px] font-black uppercase text-slate-300">Med</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-[#4ade80]">{g.green}</p>
                  <p className="text-[9px] font-black uppercase text-slate-300">Stable</p>
                </div>
              </div>
              <div className="mt-8 pt-5 border-t border-slate-50 flex flex-col gap-3">
                 <div className="flex justify-between text-[11px] font-black uppercase text-slate-400">
                    <span>Avg Attendance per  day</span>
                    <span className="text-[#1e3a8a]">{g.avgAttendance}%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5">
                    <div className="bg-[#1e3a8a] h-full rounded-full transition-all duration-1000" style={{ width: `${g.avgAttendance}%` }} />
                 </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}