"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { schools, students, interventions } from "@/lib/mock-data"
import { Download, FileText, Printer, ShieldCheck, Database, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function PEAReportsPage() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  // Using zone-wide mock data
  const zoneSchools = schools
  const zoneStudents = students
  const activeInterventions = interventions.filter(i => i.status === "active")

  // Official Malawian Context Reports
  const reports = [
    {
      id: "emis-return",
      title: "Termly EMIS Zone Return",
      description: "Official MoE format. Consolidates enrollment, attendance, and dropout rates.",
      scope: `${zoneSchools.length} Schools`,
      lastGenerated: "2026-03-01",
      official: true
    },
    {
      id: "ovc-index",
      title: "OVC & Vulnerability Index",
      description: "Cross-references child labor, meal frequency, and poverty predictors.",
      scope: `${zoneStudents.length} Students`,
      lastGenerated: "2026-02-28",
      official: true
    },
    {
      id: "gender-parity",
      title: "Gender Parity & Risk Analysis",
      description: "Disaggregated data focusing on girl-child retention and localized risks.",
      scope: "Zone-Wide",
      lastGenerated: "2026-02-15",
      official: false
    },
    {
      id: "feeding-logistics",
      title: "Feeding Program Logistics",
      description: "Ledger export of all nutritional resources allocated vs. attendance impact.",
      scope: "Intervention Log",
      lastGenerated: "2026-03-05",
      official: false
    },
    {
      id: "intervention-impact",
      title: "AI Intervention Impact",
      description: "Measures the success rate of automated risk alerts and subsequent actions.",
      scope: `${activeInterventions.length} Active Cases`,
      lastGenerated: "2026-03-02",
      official: false
    },
    {
      id: "staffing-capacity",
      title: "Zone Staffing & Capacity",
      description: "Analyzes Teacher-to-Pupil ratios against school dropout hotspots.",
      scope: "All Staff",
      lastGenerated: "2026-01-30",
      official: true
    },
  ]

  const handleGenerate = (id: string, format: "PDF" | "Print") => {
    setIsGenerating(id)
    setTimeout(() => {
      setIsGenerating(null)
      toast.success(`${format} Generated Successfully`, {
        description: "The official report has been securely compiled and downloaded."
      })
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-screen pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-1">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#1e3a8a]">Official Reports</h1>
          <p className="mt-1 text-base text-slate-600 font-medium">
            Generate compliant data exports for the District Education Manager (DEM).
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-[#4ade80] animate-pulse"></div>
           <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Data Vault Synced</span>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-gradient-to-br from-[#1e3a8a] to-blue-800 text-white relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="h-32 w-32" />
        </div>
        <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-6 p-8 relative z-10">
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
            <ShieldCheck className="h-8 w-8 text-[#98FBCB]" />
          </div>
          <div>
            <p className="text-xl font-black text-white mb-1">
              Zone Data Warehouse
            </p>
            <p className="text-sm text-blue-200 font-medium mb-3">
              All reports are cryptographically hashed for government compliance.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-bold">
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {zoneSchools.length} Schools Verified
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {zoneStudents.length} Students Tracked
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {activeInterventions.length} Active Interventions
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="border-none shadow-sm rounded-[32px] bg-white hover:shadow-lg transition-all duration-300 group flex flex-col">
            <CardHeader className="pb-3 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="rounded-2xl bg-blue-50 p-3 group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors">
                  <FileText className="h-6 w-6 text-[#1e3a8a] group-hover:text-white" />
                </div>
                {report.official && (
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">
                    MoE Compliant
                  </span>
                )}
              </div>
              <CardTitle className="text-lg font-bold text-[#1e3a8a] leading-tight mb-2">
                {report.title}
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 font-medium">
                {report.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="flex items-center gap-1"><Database className="h-3 w-3" /> {report.scope}</span>
                <span>Last: {report.lastGenerated}</span>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-full border-slate-200 text-[#1e3a8a] font-bold hover:bg-blue-50 h-11" 
                  onClick={() => handleGenerate(report.id, "Print")}
                  disabled={isGenerating !== null}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button 
                  className="flex-1 rounded-full bg-[#1e3a8a] hover:bg-[#152a66] text-white font-bold h-11 shadow-md" 
                  onClick={() => handleGenerate(report.id, "PDF")}
                  disabled={isGenerating !== null}
                >
                  {isGenerating === report.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" /> Export PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}