"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  Search, UserPlus, Loader2, Trash2, ShieldAlert, MoreVertical, Edit2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface Teacher {
  id: string;
  name: string;
  email: string;
  standard: string;
  password?: string;
}

export default function StaffManagementPage() {
  const { user } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // Provisioning State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newStandard, setNewStandard] = useState("")

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editStandard, setEditStandard] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // FETCH TEACHERS
  const fetchStaff = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/teachers?headteacherId=${user.id}`)
      const data = await res.json()
      
      if (data.teachers) {
        const formatted: Teacher[] = data.teachers.map((t: any) => ({
          id: t.id,
          name: t.name || "Unknown",
          email: "Verified Account",
          standard: t.classes?.[0]?.name?.replace("Standard ", "") || "Unassigned",
        }))
        setTeachers(formatted)
      }
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchStaff() }, [user?.id])

  const schoolTeachers = useMemo(() => {
    return teachers.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [teachers, searchTerm])

  // PROVISION TEACHER
  const handleAddTeacher = async () => {
    if (!newName || !newEmail || !newStandard) return toast.error("Fill all details.")
    setIsProvisioning(true)
    const tempPassword = "LE" + Math.random().toString(36).substring(2, 8).toUpperCase() + "!"

    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName, email: newEmail, standard: newStandard, password: tempPassword, headteacherId: user?.id
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Provisioning failed")

      const newEntry: Teacher = {
        id: data.teacherId, name: newName, email: newEmail, standard: newStandard, password: tempPassword,
      }
      setTeachers(prev => [newEntry, ...prev])
      toast.success("Teacher Provisioned!")
      setNewName(""); setNewEmail(""); setNewStandard("");
      setIsAddOpen(false)
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    } finally {
      setIsProvisioning(false)
    }
  }

  // UPDATE TEACHER PROFILE & ASSIGNMENT
  const handleUpdateProfile = async () => {
    if (!editingTeacher || !editStandard || !editName) return;
    setIsUpdating(true)

    try {
      const res = await fetch('/api/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teacherId: editingTeacher.id, 
          newStandard: editStandard,
          newName: editName,
          newEmail: editEmail || undefined // Only send if they typed a new email
        })
      })
      
      if (!res.ok) throw new Error("Failed to update profile")

      setTeachers(prev => prev.map(t => 
        t.id === editingTeacher.id ? { ...t, standard: editStandard, name: editName } : t
      ))
      
      toast.success("Profile Updated", { description: `${editName}'s account has been successfully modified.` })
      setIsEditOpen(false)
    } catch (err: any) {
      toast.error("Error", { description: err.message })
    } finally {
      setIsUpdating(false)
    }
  }

  // DELETE TEACHER
  const handleRevokeAccess = async (teacherId: string, teacherName: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${teacherName}? This will delete their account and class assignments.`)) return;

    try {
      const res = await fetch(`/api/teachers?teacherId=${teacherId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Failed to revoke access")

      setTeachers(prev => prev.filter(t => t.id !== teacherId))
      toast.success("Access Revoked", { description: `${teacherName} has been removed.` })
    } catch (err: any) {
      toast.error("Error", { description: err.message })
    }
  }

  // COPY AND HIDE PASSWORD
  const handleCopyAndHide = (teacherId: string, password: string) => {
    navigator.clipboard.writeText(password)
    toast.success("Password Copied & Secured")
    setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, password: undefined } : t))
  }

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Faculty Management</h1>
          <p className="text-sm text-slate-500 mt-1">Provision educator accounts and manage assignments.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a8a] hover:bg-blue-900 text-white shadow-sm">
              <UserPlus className="h-4 w-4 mr-2" /> Provision Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">New Educator Account</DialogTitle>
              <DialogDescription>Auto-generates a secure, confirmed Supabase identity.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input placeholder="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Email Address" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Select value={newStandard} onValueChange={setNewStandard}>
                <SelectTrigger><SelectValue placeholder="Assign Standard" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>Standard {s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleAddTeacher} disabled={isProvisioning} className="bg-[#1e3a8a] hover:bg-blue-900 text-white w-full mt-2">
                {isProvisioning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Generate Credentials"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Educator Profile</DialogTitle>
              <DialogDescription>Update details or reassign standard.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Email Address (Optional)</label>
                <Input type="email" placeholder="Enter new email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Class Assignment</label>
                <Select value={editStandard} onValueChange={setEditStandard}>
                  <SelectTrigger><SelectValue placeholder="Select New Standard" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>Standard {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateProfile} disabled={isUpdating} className="bg-[#1e3a8a] hover:bg-blue-900 text-white w-full mt-2">
                {isUpdating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Search faculty..." className="w-full pl-9 bg-white shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {schoolTeachers.map((teacher) => (
            <Card key={teacher.id} className="bg-white shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm shrink-0">
                    {teacher.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold">{teacher.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Standard {teacher.standard}</CardDescription>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 data-[state=open]:bg-slate-100">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    
                    {/* EDIT PROFILE TRIGGER */}
                    <DropdownMenuItem 
                      className="text-sm cursor-pointer"
                      onClick={() => {
                        setEditingTeacher(teacher)
                        setEditName(teacher.name)
                        setEditEmail("") // Leave blank unless they want to change it
                        setEditStandard(teacher.standard)
                        setIsEditOpen(true)
                      }}
                    >
                      <Edit2 className="mr-2 h-4 w-4 text-slate-500" /> Edit Profile
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                      onClick={() => handleRevokeAccess(teacher.id, teacher.name)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Revoke Access
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

              </CardHeader>
              <CardContent>
                {teacher.password ? (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> Temporary Key
                        </span>
                        <code className="text-slate-900 font-mono text-sm font-semibold">{teacher.password}</code>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleCopyAndHide(teacher.id, teacher.password!)} className="h-8 text-xs">
                        Copy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                     <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 font-medium">
                       Active Account
                     </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}