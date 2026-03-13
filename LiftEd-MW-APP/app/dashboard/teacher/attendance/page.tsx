"use client"

import { createClient } from "@supabase/supabase-js"
import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { 
  Search, Save, Loader2, Calendar, 
  Percent, UserCheck, UserMinus, CheckCircle2, XCircle 
} from "lucide-react"

const SLATE_BORDER = "border-slate-200/60"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AttendancePage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [myStudents, setMyStudents] = useState<any[]>([])
  const [classTitle, setClassTitle] = useState("Standard")
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})

  const today = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  })

  useEffect(() => {
    const loadClassRoster = async () => {
      if (!user?.id) return
      setFetching(true)
      try {
        const res = await fetch(`/api/teacher/students?teacherId=${user.id}`)
        const data = await res.json()
        if (data.students) {
          const formatted = data.students.map((s: any) => ({
            id: s.id,
            firstName: s.first_name,
            lastName: s.last_name,
            gender: s.gender,
            age: s.age
          }))
          setMyStudents(formatted)
          setClassTitle(data.className || "Classroom")
          
          const map: Record<string, boolean> = {}
          formatted.forEach((s: any) => { map[s.id] = true })
          setAttendance(map)
        }
      } catch (err) {
        console.error("Failed to load attendance roster", err)
      } finally {
        setFetching(false)
      }
    }
    loadClassRoster()
  }, [user?.id])

  const filtered = useMemo(() => {
    return myStudents.filter((s) => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
    )
  }, [myStudents, search])

  const toggleStatus = (studentId: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }))
  }

  const markAllFiltered = (status: boolean) => {
    const map = { ...attendance }
    filtered.forEach((s) => { map[s.id] = status })
    setAttendance(map)
    toast.info(`Marked ${filtered.length} students as ${status ? 'present' : 'absent'}`)
  }

  const presentCount = Object.values(attendance).filter(Boolean).length
  const absentCount = myStudents.length - presentCount
  const attendanceRate = myStudents.length > 0 ? Math.round((presentCount / myStudents.length) * 100) : 0

  const handleSaveAttendance = async () => {
    if (!user?.id) return
    setIsSaving(true)
    try {
      const attendanceData = myStudents.map((student) => ({
        student_id: student.id,
        teacher_id: user.id,
        status: attendance[student.id] ? 'present' : 'absent',
        date: new Date().toISOString().split('T')[0] 
      }))

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceData, { onConflict: 'student_id, date' })

      if (error) throw error

      toast.success("Attendance Synced")
    } catch (err: any) {
      toast.error("Sync Failed")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8 px-4 font-sans text-slate-900">
      
      {/* 1. CLEAN HEADER */}
      <div className="space-y-1 px-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Daily Register</h1>
        <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#1e3a8a]" /> {classTitle} • {today}
        </p>
      </div>

      {/* 2. TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Present Today", val: presentCount, icon: UserCheck, color: "text-emerald-600" },
            { label: "Absent Today", val: absentCount, icon: UserMinus, color: "text-red-500" },
            { label: "Attendance Rate", val: `${attendanceRate}%`, icon: Percent, color: "text-[#1e3a8a]" },
          ].map((stat, i) => (
            <Card key={i} className={`bg-white ${SLATE_BORDER} border-[1.5px] shadow-sm rounded-2xl`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold tracking-tighter ${stat.color}`}>{stat.val}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* 3. TABLE CARD */}
      <Card className={`bg-white ${SLATE_BORDER} border-[1.5px] shadow-sm rounded-3xl overflow-hidden`}>
        <CardHeader className="border-b border-slate-50 bg-slate-50/20 px-8 py-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[#1e3a8a]">Roll Call</CardTitle>
            <CardDescription className="text-xs font-semibold uppercase tracking-widest text-slate-400">Manage daily presence</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full md:w-80 bg-white border-slate-200 rounded-xl focus:ring-[#1e3a8a]"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {fetching ? (
            <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-slate-200" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400">
                  <TableHead className="px-8 py-4">Student</TableHead>
                  <TableHead className="text-center">Gender</TableHead>
                  <TableHead className="text-center">Age</TableHead>
                  <TableHead className="text-right px-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#1e3a8a] border-2 border-white shadow-sm uppercase">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <p className="text-sm font-bold text-slate-700 group-hover:text-[#1e3a8a] uppercase tracking-tight transition-colors">
                          {student.firstName} {student.lastName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-black text-slate-400 uppercase text-center">{student.gender}</TableCell>
                    <TableCell className="text-sm font-bold text-slate-500 text-center">{student.age}</TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="inline-flex items-center rounded-xl border border-slate-100 p-1 bg-slate-50/50">
                        <button
                          onClick={() => !attendance[student.id] && toggleStatus(student.id)}
                          className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            attendance[student.id] 
                              ? "bg-white shadow-sm text-emerald-600 border border-slate-100" 
                              : "text-slate-400"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => attendance[student.id] && toggleStatus(student.id)}
                          className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            !attendance[student.id] 
                              ? "bg-white shadow-sm text-red-500 border border-slate-100" 
                              : "text-slate-400"
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* 4. ACTIONS FOOTER */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => markAllFiltered(true)} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-xl">
                <CheckCircle2 className="mr-2 h-4 w-4" /> All Present
              </Button>
              <Button variant="ghost" size="sm" onClick={() => markAllFiltered(false)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl">
                <XCircle className="mr-2 h-4 w-4" /> All Absent
              </Button>
            </div>
            
            <Button 
              onClick={handleSaveAttendance} 
              disabled={isSaving} 
              className="bg-[#1e3a8a] hover:bg-blue-900 text-white rounded-2xl px-16 h-14 font-bold shadow-lg shadow-blue-50 transition-all flex items-center gap-3 uppercase tracking-widest text-xs"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Register
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}