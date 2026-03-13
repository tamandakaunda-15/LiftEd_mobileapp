"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"
import { 
  Download, FileText, FileSpreadsheet, ClipboardList, 
  ShieldCheck, Loader2, Printer, Search, Filter 
} from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HeadteacherReportsPage() {
  const { user } = useAuth()
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [gradeSummary, setGradeSummary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 1. SYNC LIVE DATA FROM SUPABASE & SQL VIEW
  // 1. SYNC LIVE DATA (FILTERED BY SCHOOL)
  useEffect(() => {
    async function fetchReportData() {
      if (!user?.id) return;
      try {
        setLoading(true)
        
        // Step A: Get this Headteacher's school_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single()

        const mySchoolId = profile?.school_id

        if (mySchoolId) {
          // Step B: Fetch only data belonging to THIS school
          const [studentsRes, attendanceViewRes] = await Promise.all([
            supabase.from('students').select('*').eq('school_id', mySchoolId),
            supabase.from('grade_attendance_summary').select('*').eq('school_id', mySchoolId)
          ])

          setAllStudents(studentsRes.data || [])
          setGradeSummary(attendanceViewRes.data || [])
        } else {
          // New school with no ID yet
          setAllStudents([])
          setGradeSummary([])
        }
      } catch (err) {
        console.error("Report Sync Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchReportData()
  }, [user?.id])

  
  // 2. AGGREGATE STATS FOR THE KPI CARDS
const stats = useMemo(() => {
  // Normalize the check to catch "High Risk", "High", or "red"
  const redStudents = allStudents.filter(s => {
    const level = (s.risk_level || "").toLowerCase();
    return level.includes("red") || level.includes("high") || level.includes("critical");
  });

  const red = redStudents.length;
  const total = allStudents.length;
  
  const avgAttendance = gradeSummary.length > 0 
    ? Math.round(gradeSummary.reduce((sum, row) => sum + (row.attendance_pct || 0), 0) / gradeSummary.length) 
    : 0;

  return { red, total, attendance: avgAttendance };
}, [allStudents, gradeSummary]);

  // --- 3. SPECIFIC PDF GENERATORS ---

  // REPORT A: OFFICIAL EMIS MONTHLY RETURN
  const generateEMISReport = () => {
    const doc = new jsPDF()
    doc.setFontSize(18).setTextColor(30, 58, 138).text(`EMIS Monthly Return - ${allStudents[0]?.school_name || 'New School'}`, 14, 20)
    doc.setFontSize(10).setTextColor(100).text(`Reporting Period: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, 28)

    const tableBody = gradeSummary.sort((a,b) => a.standard - b.standard).map(g => [
  `Standard ${g.standard}`, 
  allStudents.filter(s => s.standard === g.standard).length, 
  `${g.attendance_pct}%`
])

    autoTable(doc, {
      startY: 35,
      head: [['Standard', 'Total Enrollment', 'Avg Attendance']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }
    })
    doc.save("EMIS_Monthly_Return.pdf")
    toast.success("EMIS Report Generated")
  }

  // REPORT B: VULNERABLE STUDENT REGISTER
  const generateVulnerabilityRegister = () => {
    const doc = new jsPDF()
    doc.setFontSize(18).setTextColor(30, 58, 138).text("Vulnerable Student Register", 14, 20)
    doc.setFontSize(10).text("Priority List: Students at High Risk of Dropout", 14, 28)

    const redStudents = allStudents
      .filter(s => s.risk_level === 'red')
      .map(s => [`${s.first_name} ${s.last_name}`, `Std ${s.standard}`, "High Risk", "Urgent Intervention"])

    autoTable(doc, {
      startY: 35,
      head: [['Full Name', 'Standard', 'Status', 'Recommendation']],
      body: redStudents,
      headStyles: { fillColor: [239, 68, 68] } // Red header for urgency
    })
    doc.save("Vulnerable_Student_Register.pdf")
    toast.success("Vulnerability Register Generated")
  }

  // REPORT C: PEA ZONE BRIEFING (WITH DRIVERS)
  const generatePEABriefing = () => {
    const doc = new jsPDF()
    doc.setFontSize(18).setTextColor(30, 58, 138).text("PEA Zone Briefing Overview", 14, 20)
    doc.setFontSize(12).text(`School: Kachere Primary | Total Enrollment: ${stats.total}`, 14, 30)

    autoTable(doc, {
      startY: 40,
      head: [['Indicator', 'Current Status', 'Risk Priority']],
      body: [
        ['Total High-Risk Students', stats.red, 'CRITICAL'],
        ['Material Access Gaps', `${Math.round((allStudents.filter(s => s.textbook_access !== 1).length / stats.total) * 100)}%`, 'HIGH'],
        ['Low Home Study Frequency', `${Math.round((allStudents.filter(s => (s.home_study_freq || 0) < 3).length / stats.total) * 100)}%`, 'MEDIUM'],
      ],
      theme: 'striped'
    })
    doc.save("PEA_Zone_Briefing.pdf")
    toast.success("PEA Briefing Generated")
  }

  const reports = [
    { 
        title: "EMIS Monthly Return", 
        description: "Official Ministry of Education enrollment and attendance snapshot.",
        action: generateEMISReport, 
        icon: <FileSpreadsheet className="h-5 w-5 text-emerald-500" />, 
        cat: "Government" 
    },
    { 
        title: "Vulnerable Student Register", 
        description: "Comprehensive list of students requiring feeding and material support.",
        action: generateVulnerabilityRegister, 
        icon: <ShieldCheck className="h-5 w-5 text-blue-500" />, 
        cat: "Welfare" 
    },
    { 
        title: "PEA Zone Briefing", 
        description: "Quarterly summary of dropout trends for the Primary Education Advisor.",
        action: generatePEABriefing, 
        icon: <ClipboardList className="h-5 w-5 text-[#1e3a8a]" />, 
        cat: "Administrative" 
    },
  ]

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-screen pb-10 px-6 font-sans">
      
      {/* HEADER */}
      <div className="pt-8">
        <h1 className="text-4xl font-black tracking-tighter text-[#1e3a8a]">School Reports</h1>
        <p className="mt-1 text-slate-600 font-medium">Generating evidence-based documentation for Kachere Primary.</p>
      </div>

      {/* LIVE DATA KPI SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrollment", val: stats.total, color: "text-[#1e3a8a]" },
          { label: "Avg Attendance", val: `${stats.attendance}%`, color: "text-emerald-500" },
          { label: "High Risk", val: stats.red, color: "text-red-500" },
          { label: "Sync Status", val: "LIVE", color: "text-blue-500" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-5 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <hr className="border-slate-200 mt-4" />

      {/* PROFESSIONAL REPORT CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {reports.map((report) => (
          <Card key={report.title} className="bg-white border-none shadow-sm rounded-3xl hover:shadow-md transition-all group overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 group-hover:scale-105 transition-transform duration-300">
                  {report.icon}
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {report.cat}
                  </span>
                  <CardTitle className="text-lg text-[#1e3a8a] mt-1">{report.title}</CardTitle>
                  <CardDescription className="mt-1 text-slate-500 text-xs leading-relaxed">
                    {report.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
                <Button 
                  onClick={report.action} 
                  className="w-full bg-[#1e3a8a] hover:bg-[#152a66] text-white rounded-xl shadow-lg gap-2 font-bold"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-400 hover:text-[#1e3a8a] text-[10px] font-bold uppercase tracking-widest"
                >
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AUDIT FOOTER */}
      <div className="mt-10 p-6 bg-[#1e3a8a]/5 rounded-3xl border border-[#1e3a8a]/10 flex gap-4 items-center">
        <div className="h-10 w-10 rounded-full bg-[#1e3a8a] flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          <b>Audit Readiness:</b> These reports are dynamically generated using end-to-end encrypted data provided by class teachers. 
          Verified compliance with Malawian Ministry of Education data standards.
        </p>
      </div>
    </div>
  )
}