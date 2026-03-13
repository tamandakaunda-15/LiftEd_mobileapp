"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RiskBadge } from "@/components/risk-badge"
import { useAuth } from "@/lib/auth-context"
import { Search, Loader2 } from "lucide-react"
import Link from "next/link"
import type { RiskLevel } from "@/lib/types"

export default function StudentsPage() {
  const { user } = useAuth()
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)
  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all")

  // Replace your existing useEffect with this:

useEffect(() => {
  const loadStudents = async () => {
    // Check for user ID specifically
    if (!user?.id) return;

    setFetching(true)
    try {
      // Use the teacher-specific endpoint that you know works on the dashboard
      const res = await fetch(`/api/teacher/students?teacherId=${user.id}`)
      const data = await res.json()
      
      if (data.students) {
        const formatted = data.students.map((s: any) => {
          // 1. Calculate the true percentage first
          const rawScore = s.risk_score ?? 0;
          const percentage = rawScore <= 1 ? rawScore * 100 : rawScore; // Failsafe just in case it saved as 88 instead of 0.88
          
          // 2. Map exactly to your UI colors based on our Python thresholds
          let uiColor = "green";
          if (percentage >= 60) uiColor = "red";
          else if (percentage >= 25) uiColor = "yellow";

          return {
            id: s.id,
            firstName: s.first_name,
            lastName: s.last_name,
            riskLevel: uiColor, // Now it is perfectly "red", "yellow", or "green"
            riskScore: rawScore,
            predictors: {
              age: s.age,
              gender: s.gender,
              gradeLevel: data.className?.replace("Standard ", "") || s.standard,
              attendanceRate: s.attendance_rate || 95 
            }
          }
        })
        setAllStudents(formatted)
      }
    } catch (err) {
      console.error("Failed to load students", err)
    } finally {
      setFetching(false)
    }
  }
  loadStudents()
}, [user?.id]) // Dependency on user.id is more reliable

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase()
      const matchesSearch = fullName.includes(search.toLowerCase())
      const matchesRisk = riskFilter === "all" || s.riskLevel === riskFilter
      return matchesSearch && matchesRisk
    })
  }, [allStudents, search, riskFilter])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {/* Automatically shows the correct Standard for any teacher */}
          Standard {(user as any)?.standard || "Unassigned"} • {allStudents.length} Students
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Student Roster</CardTitle>
              <CardDescription>Managing Standard {(user as any)?.standard}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskLevel | "all")}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="red">High Risk</SelectItem>
                  <SelectItem value="yellow">Medium Risk</SelectItem>
                  <SelectItem value="green">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            {fetching ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-blue-900" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead className="text-right">Risk Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No students assigned to this class.</TableCell></TableRow>
                  ) : (
                    filtered.map((student) => (
                      <TableRow key={student.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell>
                          <Link href={`/dashboard/teacher/students/${student.id}`}>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-900 text-xs font-bold">
                                {student.firstName[0]}{student.lastName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium hover:underline">{student.firstName} {student.lastName}</p>
                                <p className="text-[10px] uppercase text-muted-foreground">{student.predictors.gender}</p>
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{student.predictors.age}</TableCell>
                        <TableCell className="text-sm">Std {student.predictors.gradeLevel}</TableCell>
                        <TableCell><RiskBadge level={student.riskLevel} /></TableCell>
                        <TableCell className="text-right font-mono text-sm">{Math.round(student.riskScore * 100)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}