"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { UserPlus, Mail, Key, ShieldCheck } from "lucide-react"

export function StaffManagement() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [standard, setStandard] = useState("")

  // Load teachers from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("liftEd_staff")
    if (saved) setTeachers(JSON.parse(saved))
  }, [])

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Generate a random temporary password
    const tempPassword = "LE" + Math.random().toString(36).substring(2, 8).toUpperCase() + "!"
    
    const newTeacher = {
      id: Date.now().toString(),
      name,
      email,
      assignedStandard: standard,
      password: tempPassword, // In a real app, this would be hashed
      role: "teacher",
      createdAt: new Date().toISOString()
    }

    const updatedTeachers = [...teachers, newTeacher]
    setTeachers(updatedTeachers)
    localStorage.setItem("liftEd_staff", JSON.stringify(updatedTeachers))

    // 2. Success Notification
    toast.success("Teacher Account Created!", {
      description: `Password ${tempPassword} has been generated for ${name}.`,
    })

    // Reset Form
    setName("")
    setEmail("")
    setStandard("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1e3a8a]">
            <UserPlus className="h-5 w-5" />
            Provision New Teacher
          </CardTitle>
          <CardDescription>
            Register a class teacher and assign them a Standard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Mr. Phiri" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="teacher@school.mw" />
            </div>
            <div className="space-y-2">
              <Label>Assigned Standard</Label>
              <Select value={standard} onValueChange={setStandard} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={num.toString()}>Standard {num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="bg-[#1e3a8a] text-white">Create Account</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#1e3a8a]">Active Class Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Temporary Password</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>Standard {t.assignedStandard}</TableCell>
                  <TableCell className="text-muted-foreground">{t.email}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{t.password}</code>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                      <ShieldCheck className="h-3 w-3" /> Active
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {teachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No teachers registered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}