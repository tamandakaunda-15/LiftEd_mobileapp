"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import { 
  Plus, MoreHorizontal, CheckCircle2, XCircle, PlayCircle, 
  Trash2, BookOpen, Utensils, Package, HeartHandshake, 
  Home, Wallet, Filter, Loader2, Calendar, Target, Pencil, ArrowRight
} from "lucide-react"

// UI Constants
const MINT_ACCENT = "border-[#ccfbf1]"
const DARK_BLUE_BORDER = "border-[#1e3a8a]/20 shadow-sm hover:border-[#1e3a8a]/40 transition-all duration-300"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const typeLabels: Record<string, { label: string, icon: any }> = {
  academic_support: { label: "Academic Support", icon: BookOpen },
  feeding_program: { label: "Feeding Program", icon: Utensils },
  material_provision: { label: "Material Provision", icon: Package },
  counseling: { label: "Counseling", icon: HeartHandshake },
  home_visit: { label: "Home Visit", icon: Home },
  financial_aid: { label: "Financial Aid", icon: Wallet },
}

// DATE FORMATTER: "07 Mar 2026"
const formatDateReadable = (dateStr: string | null) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export default function InterventionsPage() {
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [interventionsList, setInterventionsList] = useState<any[]>([])
  const [myStudents, setMyStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formStudent, setFormStudent] = useState("")
  const [formType, setFormType] = useState("")
  const [formDesc, setFormDesc] = useState("")

  useEffect(() => {
    const loadAllData = async () => {
      if (!user?.id) return
      setLoading(true)
      try {
        const res = await fetch(`/api/teacher/students?teacherId=${user.id}`)
        const rosterData = await res.json()
        if (rosterData.students) {
          setMyStudents(rosterData.students.map((s: any) => ({ id: s.id, name: `${s.first_name} ${s.last_name}` })))
        }
        const { data: intData, error } = await supabase.from('interventions').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false })
        if (error) throw error
        setInterventionsList(intData || [])
      } catch (err) { toast.error("Sync failed") } finally { setLoading(false) }
    }
    loadAllData()
  }, [user?.id])

  const displayedInterventions = useMemo(() => {
    return interventionsList.filter((i) => statusFilter === "all" || i.status === statusFilter)
  }, [interventionsList, statusFilter])

  const getStudentName = (studentId: string) => {
    const s = myStudents.find((st) => st.id === studentId)
    return s ? s.name : "Student"
  }

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formStudent || !formType || !formDesc) return
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('interventions')
        .insert([{
          student_id: formStudent,
          teacher_id: user?.id,
          type: formType,
          description: formDesc,
          status: 'planned',
          start_date: new Date().toISOString().split('T')[0]
        }])
        .select()
      if (error) throw error
      setInterventionsList([data[0], ...interventionsList])
      setDialogOpen(false)
      toast.success("Intervention logged")
      setFormStudent(""); setFormType(""); setFormDesc("");
    } catch (err) { toast.error("Save failed") } finally { setIsSaving(false) }
  }

  const handleUpdateIntervention = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setIsSaving(true)
    try {
      const { error } = await supabase.from('interventions').update({ type: formType, description: formDesc }).eq('id', editingId)
      if (error) throw error
      setInterventionsList(prev => prev.map(i => i.id === editingId ? { ...i, type: formType, description: formDesc } : i))
      setEditDialogOpen(false)
      toast.success("Record updated")
    } catch (err) { toast.error("Update failed") } finally { setIsSaving(false) }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus }
      // If marking complete, set the end date.
      if (newStatus === 'completed') {
        updates.end_date = new Date().toISOString().split('T')[0]
      } else {
        // If moving back to Active/Planned, CLEAR the end date
        updates.end_date = null
      }

      const { error } = await supabase.from('interventions').update(updates).eq('id', id)
      if (error) throw error
      setInterventionsList(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
      toast.success(`Action marked as ${newStatus}`)
    } catch (err) { toast.error("Update failed") }
  }

  const deleteIntervention = async (id: string) => {
    if (!confirm("Delete record?")) return
    try {
      const { error } = await supabase.from('interventions').delete().eq('id', id)
      if (error) throw error
      setInterventionsList(prev => prev.filter(i => i.id !== id))
      toast.error("Removed")
    } catch (err) { toast.error("Delete failed") }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#1e3a8a]">Active Interventions</h1>
          <p className="text-sm text-slate-500 font-medium italic">Monitoring support for {user?.name}'s learners.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a8a] hover:bg-blue-900 text-white rounded-xl px-8 font-bold shadow-md h-11">
              <Plus className="mr-2 h-5 w-5" /> Log New Action
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl">
            <DialogHeader><DialogTitle className="text-xl font-bold text-[#1e3a8a]">New Intervention</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateIntervention} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Student</Label>
                <Select value={formStudent} onValueChange={setFormStudent} required>
                  <SelectTrigger className="rounded-xl border-slate-200"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {myStudents.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</Label>
                <Select value={formType} onValueChange={setFormType} required>
                  <SelectTrigger className="rounded-xl border-slate-200"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(typeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Notes</Label>
                <Textarea placeholder="Details..." className="rounded-xl border-slate-200 font-medium" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} required />
              </div>
              <Button type="submit" disabled={isSaving} className="w-full bg-[#1e3a8a] rounded-xl font-bold h-12">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Save Intervention"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Intervention Grid */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
          {displayedInterventions.map((item) => {
            const config = typeLabels[item.type];
            const Icon = config?.icon || BookOpen;
            return (
              <Card key={item.id} className={`bg-white ${MINT_ACCENT} ${DARK_BLUE_BORDER} border-[1.8px] rounded-2xl flex flex-col group`}>
                <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-50 bg-slate-50/20">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-[#1e3a8a] leading-tight">{getStudentName(item.student_id)}</CardTitle>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        <Icon className="h-4 w-4 text-blue-400" /> {config?.label}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-white"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl font-semibold min-w-[170px]">
                        <DropdownMenuItem onClick={() => updateStatus(item.id, "active")} className="cursor-pointer py-2.5"><PlayCircle className="mr-2 h-4 w-4 text-blue-500" /> Start Action</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(item.id, "completed")} className="cursor-pointer py-2.5"><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Complete</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(item.id, "cancelled")} className="cursor-pointer py-2.5"><XCircle className="mr-2 h-4 w-4 text-slate-400" /> Cancel</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setEditingId(item.id); setFormType(item.type); setFormDesc(item.description); setEditDialogOpen(true); }} className="cursor-pointer py-2.5 text-blue-600"><Pencil className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteIntervention(item.id)} className="text-red-600 cursor-pointer py-2.5 font-bold"><Trash2 className="mr-2 h-4 w-4" /> Delete Block</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="px-6 py-5 flex-1 space-y-5">
                  <div className="flex items-center justify-between">
                    <Badge className={`rounded-lg font-bold text-[10px] uppercase tracking-wider border-none px-3 py-1 ${item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : item.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                      {item.status}
                    </Badge>
                    
                    {/* ENHANCED DATE DISPLAY */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDateReadable(item.start_date)}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-slate-300" />
                      <span className={item.end_date ? "text-[#1e3a8a]" : "text-slate-400 italic font-medium"}>
                        {item.end_date ? formatDateReadable(item.end_date) : "Ongoing"}
                      </span>
                    </div>
                  </div>

                  <p className="text-[14px] font-medium text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4 py-0.5">
                    "{item.description}"
                  </p>
                  
                  {item.outcome && (
                    <div className="mt-4 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/50">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-1.5"><Target className="h-3.5 w-3.5" /> Impact Summary</p>
                      <p className="text-xs font-semibold text-emerald-900 leading-snug">{item.outcome}</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-slate-50/50 border-t border-slate-50 p-4 px-6 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Record {item.id.split('-')[0]}</p>
                  {item.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold text-[#1e3a8a]">Edit Intervention</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateIntervention} className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</Label>
              <Select value={formType} onValueChange={setFormType} required>
                <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(typeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Notes</Label>
              <Textarea placeholder="Details..." className="rounded-xl border-slate-200 font-medium min-h-[120px]" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isSaving} className="w-full bg-[#1e3a8a] rounded-xl font-bold h-12">Update Record</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}