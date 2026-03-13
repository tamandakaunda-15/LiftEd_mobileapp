"use client"

import { useState, useEffect } from "react"
import { 
  Users, School, AlertTriangle, TrendingDown, MapPin, 
  Database, BrainCircuit, FileText, Loader2, CheckCircle2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SchoolData {
  id: string;
  emis_id: string;
  name: string;
  sync_status: string;
  last_sync: string;
  total_students: number;
  at_risk_count: number;
}

export default function PEADashboard() {
  const [schoolsData, setSchoolsData] = useState<SchoolData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const ZONE_ID = "LIL-RURAL-EAST" 

  useEffect(() => {
    const fetchSchoolsData = async () => {
      try {
        // 1. Fetch using the Zone ID to filter the schools
        const response = await fetch(`/api/schools?zoneId=${ZONE_ID}`) 
        const data = await response.json()
        
        // 2. Map data to the correct state (setSchoolsData, not setAllStudents)
        if (Array.isArray(data)) {
          setSchoolsData(data)
        } else if (data.schools && Array.isArray(data.schools)) {
          setSchoolsData(data.schools)
        } else {
          setSchoolsData([])
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err)
        setSchoolsData([]) // Fixes the 'setAllStudents' error
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchoolsData()
  }, [])

  // Aggregated Zone Stats
  const totalSchools = schoolsData.length;

  const totalAtRisk = schoolsData.reduce((sum, school: any) => {
    // This now looks for the 'actual_at_risk' field we just created in the SQL view
    return sum + Number(school.actual_at_risk || 0);
  }, 0);

  const totalStudents = schoolsData.reduce((sum, school: any) => {
    // This now looks for the 'actual_students' field from the SQL view
    return sum + Number(school.actual_students || 0);
  }, 0);
  return (
    <div className="flex flex-col gap-6 bg-white min-h-screen pb-10 bg-[radial-gradient(#ccfbf1_1px,transparent_1px)] [background-size:24px_24px] px-6 pt-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-teal-50 text-teal-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-teal-100">
              Zone: {ZONE_ID}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#1e3a8a]">Zone Intelligence</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Live school data synchronized via Headteacher portals.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/dashboard/pea/schools">
            <Button className="rounded-2xl bg-[#1e3a8a] text-white shadow-lg px-6 h-12 transition-all font-bold text-xs uppercase tracking-widest">
               Manage Portfolio
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Schools" value={isLoading ? "..." : totalSchools} subtitle="Active Registrations" icon={School} />
        <StatCard title="Zone Enrollment" value={isLoading ? "..." : totalStudents} subtitle="Total Students" icon={Users} />
        <StatCard title="Critical Alerts" value={isLoading ? "..." : totalAtRisk} subtitle="Students At-Risk" icon={AlertTriangle} />
        <StatCard title="Data Health" value="100%" subtitle="Verified Sync" icon={Database} />
      </div>

      {/* Main Ledger */}
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
        <div className="bg-teal-50/30 border-b border-teal-50 p-6">
          <h2 className="text-xl font-bold text-[#1e3a8a]">Auto-Sync Registry</h2>
          <p className="text-sm text-slate-500 font-medium">Aggregated metrics from Headteacher databases.</p>
        </div>
        
        <CardContent className="p-0">
           <div className="overflow-x-auto">
             {isLoading ? (
               <div className="p-20 text-center text-[#1e3a8a] font-bold">
                 <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                 Connecting to Zone Data...
               </div>
             ) : (
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-white border-b border-slate-50">
                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">School Name</th>
                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</th>
                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">At-Risk Summary</th>
                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Last Sync</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
  {schoolsData.map((school: any) => {
    // Match the Headteacher's dynamic counting
    const schoolEnrollment = Number(school.actual_students ?? school.total_students ?? 0);
    const schoolAtRisk = Number(school.actual_at_risk ?? school.at_risk_count ?? 0);

    return (
      <tr key={school.id} className="group hover:bg-teal-50/20 transition-colors">
        <td className="p-6">
          <p className="text-sm font-bold text-[#1e3a8a]">{school.name}</p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">EMIS: {school.emis_id}</p>
        </td>
        <td className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-black text-slate-700">{schoolEnrollment}</span>
          </div>
        </td>
        <td className="p-6">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${schoolAtRisk > 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className={`text-sm font-black ${schoolAtRisk > 5 ? 'text-red-600' : 'text-slate-700'}`}>
              {schoolAtRisk} Students
            </span>
          </div>
        </td>
        <td className="p-6 text-right">
          <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            {school.last_sync ? new Date(school.last_sync).toLocaleDateString() : 'Active Now'}
          </span>
        </td>
      </tr>
    );
  })}
</tbody>
             </table>
             )}
           </div>
        </CardContent>
      </Card>
    </div>
  )
}