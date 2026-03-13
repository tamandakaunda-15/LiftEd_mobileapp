"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { 
  PieChart as PieIcon, Activity, ListChecks, Filter, 
  Search, ShieldAlert, Loader2, ArrowUpRight 
} from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const typeLabels: Record<string, string> = {
  academic_support: "Academic Support",
  feeding_program: "Feeding Program",
  material_provision: "Material Provision",
  counseling: "Counseling",
  home_visit: "Home Visit",
  financial_aid: "Financial Aid",
}

const statusColors: Record<string, string> = {
  planned: "bg-slate-100 text-slate-600 border-slate-200",
  active: "bg-blue-50 text-[#1e3a8a] border-blue-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-red-50 text-red-700 border-red-100",
}

const BRAND_COLORS = ["#1e3a8a", "#4ade80", "#f59e0b", "#94a3b8", "#6366f1", "#06b6d4"]

export default function HeadteacherInterventionsPage() {
  const { user } = useAuth()
  const [interventions, setInterventions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
  const fetchInterventionData = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      // 1. GET THE HEADTEACHER'S SCHOOL ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

      if (profile?.school_id) {
        // 2. FETCH INTERVENTIONS FILTERED BY SCHOOL ID
        // Note: We pass the schoolId to your API
        const res = await fetch(`/api/admin/interventions?schoolId=${profile.school_id}`)
        const data = await res.json()
        setInterventions(data)
      } else {
        setInterventions([])
      }
    } catch (err) {
      console.error("Intervention sync failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  fetchInterventionData()

  // 3. SECURE REAL-TIME SYNC
  const channel = supabase
    .channel('interventions-realtime')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'interventions' 
    }, async (payload) => {
      // Re-verify the new intervention belongs to this school before adding to UI
      const { data } = await supabase
        .from('interventions')
        .select('*, student:students(first_name, last_name, standard, school_id)')
        .eq('id', payload.new.id)
        .single()
      
      // Only update if student belongs to the headteacher's school
      // fetch the schoolId from profile once outside this callback
      
      if (data && data.student?.school_id === user?.schoolId) { 
      setInterventions((prev) => [data, ...prev])
}
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [user?.id, user?.schoolId])

  const filteredInterventions = useMemo(() => {
    return interventions.filter(item => {
      const studentName = `${item.student?.first_name} ${item.student?.last_name}`.toLowerCase()
      const matchesGrade = gradeFilter === "all" || String(item.student?.standard) === gradeFilter
      const matchesSearch = studentName.includes(searchTerm.toLowerCase())
      return matchesGrade && matchesSearch
    })
  }, [interventions, gradeFilter, searchTerm])

  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = { planned: 0, active: 0, completed: 0, cancelled: 0 }
    interventions.forEach((i) => { if (map[i.status] !== undefined) map[i.status]++ })
    return Object.entries(map).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }))
  }, [interventions])

  const topProgram = useMemo(() => {
    if (interventions.length === 0) return { name: "None", pct: 0 }
    const counts: Record<string, number> = {}
    interventions.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1 })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return { 
      name: typeLabels[sorted[0][0]] || sorted[0][0], 
      pct: Math.round((sorted[0][1] / interventions.length) * 100) 
    }
  }, [interventions])

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-screen pb-10 font-sans">
      <div className="p-1 px-6 pt-8">
        <h1 className="text-4xl font-black tracking-tighter text-[#1e3a8a]">Intervention Tracking</h1>
        <p className="mt-1 text-base text-slate-500 font-medium">Overseeing support programs synced directly from class teacher logs.</p>
      </div>

      {/* KPI SECTION - SYNCED WITH DASHBOARD STYLE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 px-6">
        <Card className="lg:col-span-1 border-none shadow-sm rounded-3xl bg-white">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-[#4ade80]" /> Support Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-6">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 w-full gap-3 mt-4">
              {statusBreakdown.map((item, i) => (
                <div key={item.name} className="flex flex-col p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.name}</span>
                  <span className="text-xl font-black text-[#1e3a8a]">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" /> Administrative Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl mb-8 flex gap-5">
              <div className="h-12 w-12 bg-[#1e3a8a] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-[#1e3a8a] text-lg">Operational Summary</h4>
                <p className="text-sm text-slate-600 leading-relaxed mt-1">
                  Managing <b>{interventions.filter(i => i.status === 'active').length}</b> active plans school-wide. 
                  Efficiency is at <b>{interventions.length > 0 ? Math.round((interventions.filter(i => i.status === 'completed').length / interventions.length) * 100) : 0}%</b>.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Program</span>
                  <p className="text-2xl font-black text-[#1e3a8a] mt-1">{topProgram.name}</p>
                  <p className="text-xs font-bold text-slate-400 mt-2">{topProgram.pct}% Intensity</p>
               </div>
               <div className="p-6 bg-blue-900 rounded-3xl border-none">
                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Total Logs</span>
                  <p className="text-4xl font-black text-white mt-1">{interventions.length}</p>
                  <p className="text-xs font-bold text-blue-200 mt-2 flex items-center gap-1">Live Sync Active <ArrowUpRight className="h-3 w-3" /></p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOG LIST */}
      <Card className="border-none shadow-sm rounded-3xl mx-6 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-8 py-6">
          <CardTitle className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-emerald-500" /> Support Log (Institutional)
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search student..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-none rounded-2xl h-11 text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 rounded-2xl border border-slate-100 w-full sm:w-auto h-11">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="border-none bg-transparent h-8 text-xs font-black text-slate-600 focus:ring-0 uppercase tracking-widest">
                  <SelectValue placeholder="Standards" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Standards</SelectItem>
                  {[1,2,3,4,5,6,7,8].map(g => <SelectItem key={g} value={String(g)}>Standard {g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {filteredInterventions.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm text-[10px] font-black text-[#1e3a8a]">
                    Std {item.student?.standard || '?'}
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#1e3a8a]">{item.student?.first_name} {item.student?.last_name}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {typeLabels[item.type] || item.type}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={`${statusColors[item.status]} px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}