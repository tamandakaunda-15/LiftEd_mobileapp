"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { students, monthlyTrends } from "@/lib/mock-data"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, CartesianGrid, Area, AreaChart
} from "recharts"
import { TrendingUp, Users, Target, Activity, BrainCircuit, Info, Lightbulb } from "lucide-react"

export default function PEAAnalyticsPage() {
  const allStudents = useMemo(() => students, [])

  // Thematic risk analysis
  const thematicData = useMemo(() => {
    const atRisk = allStudents.filter((s) => s.riskLevel === "red" || s.riskLevel === "yellow")
    const total = atRisk.length || 1
    return [
      { factor: "Low Attendance", value: Math.round((atRisk.filter((s) => s.predictors.attendanceRate < 75).length / total) * 100) },
      { factor: "Long Distance", value: Math.round((atRisk.filter((s) => s.predictors.distanceToSchool > 5).length / total) * 100) },
      { factor: "Financial Stress", value: Math.round((atRisk.filter((s) => s.predictors.householdIncome === "low").length / total) * 100) },
      { factor: "Manual Labor", value: Math.round((atRisk.filter((s) => s.predictors.manualLaborHours > 2).length / total) * 100) },
      { factor: "No Materials", value: Math.round((atRisk.filter((s) => !s.predictors.hasLearningMaterials).length / total) * 100) },
    ]
  }, [allStudents])

  // Gender breakdown
  const genderData = useMemo(() => {
    const male = allStudents.filter((s) => s.predictors.gender === "male")
    const female = allStudents.filter((s) => s.predictors.gender === "female")
    return [
      {
        gender: "Male",
        total: male.length,
        atRisk: male.filter((s) => s.riskLevel !== "green").length,
        avgRisk: male.length > 0 ? Math.round((male.reduce((sum, s) => sum + s.riskScore, 0) / male.length) * 100) : 0,
      },
      {
        gender: "Female",
        total: female.length,
        atRisk: female.filter((s) => s.riskLevel !== "green").length,
        avgRisk: female.length > 0 ? Math.round((female.reduce((sum, s) => sum + s.riskScore, 0) / female.length) * 100) : 0,
      },
    ]
  }, [allStudents])

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-screen pb-10">
      <div className="p-1">
        <h1 className="text-4xl font-extrabold tracking-tighter text-[#1e3a8a]">Zone Risk Radar</h1>
        <p className="mt-1 text-base text-slate-600 font-medium">
          AI-driven analysis of dropout factors across the entire Lilongwe West Zone.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar chart - Thematic Risks */}
        <Card className="border border-slate-200 shadow-sm rounded-[32px] overflow-hidden bg-white flex flex-col">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6">
            <CardTitle className="text-xl text-[#1e3a8a] flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" /> Primary Risk Drivers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col">
            <div className="h-64 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={thematicData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                  <PolarRadiusAxis hide domain={[0, 100]} />
                  <Radar name="Prevalence %" dataKey="value" stroke="#1e3a8a" strokeWidth={3} fill="#2563eb" fillOpacity={0.15} />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Plain English Insight */}
            <div className="mt-auto bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <BrainCircuit className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-800 mb-1">AI Insight</h4>
                  <p className="text-sm text-amber-900 font-medium leading-relaxed">
                    <span className="font-bold">Long Distance</span> and <span className="font-bold">Manual Labor</span> are the highest drivers of dropout risk in this zone. Allocating bicycles and initiating community dialogues on child labor will yield the highest retention improvements.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gender Analysis */}
        <Card className="border border-slate-200 shadow-sm rounded-[32px] overflow-hidden bg-white flex flex-col">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6">
            <CardTitle className="text-xl text-[#1e3a8a] flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" /> Gender Vulnerability
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col">
            <div className="h-48 w-full mb-6 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderData} barGap={8} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="gender" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 700}} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                  <Bar dataKey="total" name="Total Enrolled" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="atRisk" name="High Risk" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {genderData.map((g) => (
                <div key={g.gender} className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex flex-col items-center text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{g.gender} Avg Risk</p>
                  <p className={`text-3xl font-black ${g.avgRisk > 40 ? 'text-red-500' : 'text-[#1e3a8a]'}`}>{g.avgRisk}%</p>
                </div>
              ))}
            </div>

            {/* Plain English Insight */}
            <div className="mt-auto bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-800 mb-1">Key Observation</h4>
                  <p className="text-sm text-blue-900 font-medium leading-relaxed">
                    Female students currently show a significantly higher average risk score than males. District data suggests this correlates with lack of sanitary facilities in rural schools.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Trends Over Time */}
      <Card className="border border-slate-200 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="text-xl text-[#1e3a8a] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#4ade80]" /> Zone Attendance Patterns
            </CardTitle>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 mt-2 md:mt-0">
            6 Month Trajectory
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-72 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                <YAxis hide domain={[60, 100]} />
                <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="#4ade80" strokeWidth={4} fillOpacity={1} fill="url(#colorAttendance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Plain English Insight */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-1">Seasonal Trend Analysis</h4>
                <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                  Attendance typically drops during the harvest season (March/April) due to students assisting on family farms. However, the current predictive alerts have stabilized the trend, keeping attendance <span className="font-bold">3.2% higher</span> than the district average for this time of year.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}