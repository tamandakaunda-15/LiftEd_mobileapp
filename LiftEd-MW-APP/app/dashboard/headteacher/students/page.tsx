"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { Search, UserPlus, MapPin, Phone, Users, Pencil, MoreVertical, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HeadteacherStudentsPage() {
  const { user } = useAuth()
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null)
  
  const [search, setSearch] = useState("")
  const [gradeFilter, setGradeFilter] = useState<string>("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [district, setDistrict] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [parentName, setParentName] = useState("")
  const [parentPhone, setParentPhone] = useState("")
  const [homeAddress, setHomeAddress] = useState("")

  // 1. DATA FETCHING
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return
      setFetching(true)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single()

        if (profile?.school_id) {
          setActiveSchoolId(profile.school_id)
          const res = await fetch(`/api/students?schoolId=${profile.school_id}`)
          if (res.ok) {
            const data = await res.json()
            const dbStudents = data.students || []
            setAllStudents(dbStudents.map((s: any) => ({
              id: s.id,
              firstName: s.first_name,
              lastName: s.last_name,
              riskLevel: s.risk_level || "green",
              riskScore: s.risk_score || 0.1,
              guardianName: s.guardian_name,
              guardianPhone: s.guardian_phone,
              homeAddress: s.home_address,
              predictors: {
                gradeLevel: Number(s.standard), 
                gender: s.gender,
                age: Number(s.age),
                districtOfOrigin: s.district || "Unknown"
              }
            })))
          }
        }
      } catch (err) {
        console.error("Fetch Error:", err)
      } finally {
        setFetching(false)
      }
    }
    fetchStudents()
  }, [user?.id])

  // 2. LOGIC VARIABLES (Fixes 'Cannot find name' errors)
  const filtered = useMemo(() => {
    return allStudents.filter((s: any) => {
      const fullName = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase()
      const matchesSearch = fullName.includes(search.toLowerCase()) || 
                           (s.guardianName || "").toLowerCase().includes(search.toLowerCase())
      const matchesGrade = gradeFilter === "all" || s.predictors?.gradeLevel === Number(gradeFilter)
      return matchesSearch && matchesGrade
    })
  }, [allStudents, search, gradeFilter])

  const grades = useMemo(
    () => [...new Set(allStudents.map((s: any) => s.predictors?.gradeLevel || 0))].sort((a: any, b: any) => a - b),
    [allStudents]
  )

  const handleEditClick = (student: any) => {
    setEditingId(student.id)
    setFirstName(student.firstName)
    setLastName(student.lastName)
    setAge(String(student.predictors?.age || ""))
    setGender(student.predictors?.gender === "male" ? "Male" : "Female")
    setDistrict(student.predictors?.districtOfOrigin || "")
    setGradeLevel(String(student.predictors?.gradeLevel || ""))
    setParentName(student.guardianName || "")
    setParentPhone(student.guardianPhone || "")
    setHomeAddress(student.homeAddress || "")
    setIsFormOpen(true)
  }

  const handleSaveStudent = async () => {
    if (!activeSchoolId) {
      toast.error("Error: Valid School ID not found.")
      return
    }

    if (!firstName || !lastName || !gradeLevel) {
      toast.error("Please fill in required fields.")
      return
    }

    setLoading(true)

    const studentData = {
      firstName, lastName, standard: gradeLevel, gender, age, district,
      guardianName: parentName, guardianPhone: parentPhone, homeAddress,
      schoolId: activeSchoolId
    }

    const payload = editingId ? { ...studentData, id: editingId } : studentData

    try {
      const response = await fetch('/api/students', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Save failed")

      const s = result.student
      const uiStudent = {
        id: s.id, firstName: s.first_name, lastName: s.last_name,
        riskLevel: s.risk_level || "green", riskScore: s.risk_score || 0.1,
        guardianName: s.guardian_name, guardianPhone: s.guardian_phone,
        homeAddress: s.home_address,
        predictors: { gradeLevel: s.standard, gender: s.gender, age: s.age, districtOfOrigin: s.district }
      }

      if (editingId) {
        setAllStudents(prev => prev.map(item => item.id === editingId ? uiStudent : item))
        toast.success("Profile Updated")
      } else {
        setAllStudents(prev => [uiStudent, ...prev])
        toast.success("Student Enrolled")
      }

      setIsFormOpen(false); setEditingId(null); setFirstName(""); setLastName(""); setAge(""); setGender(""); 
      setDistrict(""); setGradeLevel(""); setParentName(""); setParentPhone(""); setHomeAddress("");
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-screen pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-1">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#1e3a8a]">Student Directory</h1>
          <p className="mt-1 text-base text-slate-600">Secure student enrollment and guardian database.</p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={(val) => { setIsFormOpen(val); if(!val) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a8a] hover:bg-[#152a66] text-white shadow-md rounded-full px-6 transition-all">
              <UserPlus className="h-4 w-4 mr-2" /> Enroll New Student
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 text-slate-950 sm:max-w-[600px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#1e3a8a]">
                {editingId ? "Edit Student Profile" : "New Student Registration"}
              </DialogTitle>
              <DialogDescription>Maintain accurate records for your school's students.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input placeholder="Surname" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <Input placeholder="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
              </Select>
              <Input placeholder="Guardian Full Name" value={parentName} onChange={(e) => setParentName(e.target.value)} className="col-span-2" />
              <Input placeholder="Phone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
              <Input placeholder="Home Area" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
              <Input placeholder="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger><SelectValue placeholder="Standard" /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (<SelectItem key={g} value={String(g)}>Standard {g}</SelectItem>))}</SelectContent>
              </Select>
              <Button onClick={handleSaveStudent} disabled={loading} className="col-span-2 bg-[#1e3a8a] text-white mt-4 h-12 rounded-xl">
                {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />} {editingId ? "Update" : "Register"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden border-t-4 border-t-[#1e3a8a]">
        <CardHeader className="bg-white border-b border-slate-50 pb-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg text-[#1e3a8a] font-bold">Roster Directory ({filtered.length})</CardTitle>
            <div className="flex items-center gap-3">
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 bg-slate-50 rounded-full" />
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-40 bg-slate-50 rounded-full"><SelectValue placeholder="Standard" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Classes</SelectItem>{grades.map((g: any) => (<SelectItem key={g} value={String(g)}>Standard {g}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {fetching ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a]" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow><TableHead className="pl-6 font-bold text-[10px]">Student</TableHead><TableHead className="font-bold text-[10px]">Standard</TableHead><TableHead className="font-bold text-[10px]">Guardian</TableHead><TableHead className="text-right pr-6 font-bold text-[10px]">Options</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6 py-4 font-bold text-[#1e3a8a] text-sm">{s.firstName} {s.lastName}</TableCell>
                    <TableCell><span className="px-3 py-1 bg-blue-50 text-[#1e3a8a] rounded-full text-[10px] font-bold">Std {s.predictors?.gradeLevel}</span></TableCell>
                    <TableCell><div className="text-xs font-bold">{s.guardianName}</div><div className="text-[10px] text-slate-400">{s.guardianPhone}</div></TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(s)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}