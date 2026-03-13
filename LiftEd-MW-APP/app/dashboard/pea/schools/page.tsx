"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Phone, Search, Plus, X, Activity, Edit2, Users, TrendingUp, CalendarCheck, MoreVertical, Trash2, Archive, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface School {
  id: string; // Internal UUID
  emis_id: string; // The 7-digit code
  name: string;
  phone: string;
  total_students: number;
  retention: number;
  attendance: number;
  zone_id: string;
}

export default function PEASchoolsPage() {
  const [schoolsList, setSchoolsList] = useState<School[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const ZONE_ID = "LIL-RURAL-EAST" 

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    emis_id: "",
    total_students: "",
  })

  // 1. Load real schools on mount
  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/schools')
      const data = await res.json()
      setSchoolsList(data)
    } catch (err) {
      toast.error("Could not load schools")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSchools = useMemo(() => {
    return schoolsList.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.emis_id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [schoolsList, searchTerm])

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)
  
  try {
    const method = isEditMode ? 'PATCH' : 'POST'
    
    // Prepare only the clean data
    const payload: any = {
      name: formData.name,
      emis_id: formData.emis_id,
      phone: formData.phone,
      total_students: parseInt(formData.total_students) || 0,
      zone_id: ZONE_ID,
    }

    // ONLY include the ID if we are editing. 
    // If registering new, let Supabase generate the ID.
    if (isEditMode) {
      payload.id = formData.id
    }

    const res = await fetch('/api/schools', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    // Get the real error message from the server
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || "Failed to save school")

    toast.success(isEditMode ? "School Updated" : "School Registered")
    fetchSchools() 
    setIsModalOpen(false)
  } catch (err: any) {
    // This will now show the EXACT reason (e.g. "duplicate EMIS")
    toast.error("Registration Failed", { description: err.message })
  } finally {
    setIsSubmitting(false)
  }
}
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await fetch(`/api/schools?id=${id}`, { method: 'DELETE' })
      setSchoolsList(prev => prev.filter(s => s.id !== id))
      toast.success("School removed")
    } catch (err) {
      toast.error("Delete failed")
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-white min-h-screen pb-10 bg-[radial-gradient(#ccfbf1_1px,transparent_1px)] [background-size:24px_24px] px-6 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#1e3a8a]">School Portfolio</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage official EMIS registrations for {ZONE_ID}.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search EMIS or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-teal-50 rounded-2xl h-12"
            />
          </div>
          <Button onClick={() => { setIsEditMode(false); setIsModalOpen(true); }} className="rounded-2xl bg-[#1e3a8a] text-white px-6 h-12 font-bold">
            <Plus className="h-4 w-4 mr-2" /> Register School
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-[#1e3a8a]" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredSchools.map((school) => (
            <Card key={school.id} className="border-none shadow-xl rounded-[2rem] bg-white ring-1 ring-slate-100 relative group">
              <CardContent className="p-8">
  <div className="flex justify-between items-start mb-4">
    <div className="flex gap-4 items-center">
      <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#1e3a8a]">
        <Building2 className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#1e3a8a]">{school.name}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EMIS: {school.emis_id}</p>
      </div>
    </div>
    <button onClick={() => handleDelete(school.id)} className="text-slate-300 hover:text-red-500 transition-colors">
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
  
  <div className="flex items-center gap-2 mb-6 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
    <Phone className="h-4 w-4 text-teal-600" /> {school.phone}
  </div>

  {/* Refined 2-column layout */}
  <div className="grid grid-cols-2 gap-0 text-center divide-x divide-slate-100">
     <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Students</p>
        <p className="text-xl font-black text-[#1e3a8a]">{school.total_students}</p>
     </div>
     <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Avg Attendance</p>
        <p className="text-xl font-black text-[#1e3a8a]">{school.attendance}%</p>
     </div>
  </div>
</CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal remains visually the same but binds to real state */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md rounded-[2.5rem] overflow-hidden">
             <div className="bg-[#1e3a8a] p-8 text-white">
                <h2 className="text-2xl font-black">{isEditMode ? "Edit School" : "Register School"}</h2>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-4 bg-white">
                <Input placeholder="School Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="rounded-xl h-12" />
                <Input placeholder="EMIS Code (e.g. 1029384)" value={formData.emis_id} onChange={e => setFormData({...formData, emis_id: e.target.value})} required className="rounded-xl h-12" />
                <Input placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-xl h-12" />
                <Input placeholder="Total Students" type="number" value={formData.total_students} onChange={e => setFormData({...formData, total_students: e.target.value})} className="rounded-xl h-12" />
                <Button type="submit" className="w-full bg-[#1e3a8a] h-14 rounded-2xl font-bold text-white uppercase tracking-widest text-xs" disabled={isSubmitting}>
                   {isSubmitting ? "Processing..." : "Confirm Registration"}
                </Button>
                <Button type="button" onClick={() => setIsModalOpen(false)} variant="ghost" className="w-full">Cancel</Button>
             </form>
          </Card>
        </div>
      )}
    </div>
  )
}