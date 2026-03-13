"use client"

import { useState, useMemo } from "react"
import { 
  Search, Brain, Home, Sparkles, Loader2, 
  Users, Wallet, BookOpen, GraduationCap, AlertCircle, Info,
  ChevronRight, ChevronLeft, Copy, History, ClipboardCheck
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"

const DARK_BLUE_BORDER = "border-[#1e3a8a]/20"

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function StudentPredictorPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isFetching, setIsFetching] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [student, setStudent] = useState<any>(null)

  // 1. DYNAMIC ACADEMIC LABELS (Malawi 3-Term System)
  const termLabels = useMemo(() => {
    // Dynamically grab the number from "Standard 4" or fallback to 8
    const stdString = student?.standard ? String(student.standard) : "8";
    const stdNumber = parseInt(stdString.replace(/\D/g, "")) || 8;
    
    return [
      { year: `Std ${stdNumber - 1}`, term: "Term 2" },
      { year: `Std ${stdNumber - 1}`, term: "Term 3" },
      { year: `Std ${stdNumber}`, term: "Term 1" },
      { year: `Std ${stdNumber}`, term: "Term 2" },
      { year: `Std ${stdNumber}`, term: "Term 3 (Active)" },
    ];
  }, [student]);

  // 2. STATE: 5 Terms of 15 Features for LSTM
  const [currentTermIdx, setCurrentTermIdx] = useState(4); 
  const [history, setHistory] = useState(
    Array(5).fill({}).map(() => ({
      c16_2: 1, c16_4: 1, c19_2: 1, g36a_9: 1, h1: 1,
      g1b_2t: 1, g36a_2: 1, j3: 1, g36c_4: 1, c17: 1,
      g4_a: 1, j5: 1, j7: 1, j2: 1, g4_e: 1
    }))
  );

  const handleUpdate = (factor: string, value: number) => {
    const newHistory = [...history];
    newHistory[currentTermIdx] = { ...newHistory[currentTermIdx], [factor]: value };
    setHistory(newHistory);
  };

  const copyPreviousTerm = () => {
    if (currentTermIdx === 0) return;
    const newHistory = [...history];
    newHistory[currentTermIdx] = { ...newHistory[currentTermIdx - 1] };
    setHistory(newHistory);
    toast.info("Timeline Synced", { 
        description: `Applied observations from previous term to current view.`,
        icon: <ClipboardCheck className="h-4 w-4 text-blue-500" />
    });
  };

  // 3. FETCH STUDENT (Integrated with History)
  const handleFetchStudent = async () => {
    if (!searchQuery.trim() || !user?.id) return;
    setIsFetching(true);
    try {
      const res = await fetch(`/api/teacher/students?teacherId=${user.id}`);
      const data = await res.json();
      if (data.students) {
        const searchLower = searchQuery.toLowerCase();
        const found = data.students.find((s: any) => 
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchLower) || 
          s.id.toString().includes(searchLower)
        );

        if (found) {
          setStudent({
            id: found.id,
            name: `${found.first_name} ${found.last_name}`,
            gender: found.gender,
            age: found.age,
            // Fallback robustly so Standard 4 displays correctly!
            standard: data.className || `Standard ${found.standard || 8}`, 
          });

          // AUTO-FILL: If student has existing records in student_history, load them
          if (found.student_history && found.student_history.length >= 5) {
             const sortedHistory = found.student_history.sort((a: any, b: any) => a.academic_term.localeCompare(b.academic_term));
             const mappedHistory = sortedHistory.map((h: any) => ({
                c16_2: h.c16_2 ?? 1, c16_4: h.c16_4 ?? 1, c19_2: h.c19_2 ?? 1, g36a_9: h.g36a_9 ?? 1, h1: h.h1 ?? 1,
                g1b_2t: h.g1b_2t ?? 1, g36a_2: h.g36a_2 ?? 1, j3: h.j3 ?? 1, g36c_4: h.g36c_4 ?? 1, c17: h.c17 ?? 1,
                g4_a: h.g4_a ?? 1, j5: h.j5 ?? 1, j7: h.j7 ?? 1, j2: h.j2 ?? 1, g4_e: h.g4_e ?? 1
             }));
             setHistory(mappedHistory);
             toast.success("Identity Verified", { description: "Historical records synchronized." });
          } else {
            toast.success("Identity Verified", { description: "Starting new assessment." });
          }
        } else {
          toast.error("Not Found", { description: "Student not found in your class." });
        }
      }
    } catch (error) {
      toast.error("Sync Error", { description: "Failed to reach student roster." });
    } finally {
      setIsFetching(false);
    }
  };

  const runPrediction = async () => {
    if (!student) return;
    setIsPredicting(true);
    try {
      // 1. Call ML Engine
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }) 
      });
      const result = await response.json();

      if (response.ok) {
        // New way: Safely encode the spaces and special characters for the URL
        const factorsString = result.majorFactors && result.majorFactors.length > 0 
          ? result.majorFactors.join('|') 
          : "";
        const factorsParam = encodeURIComponent(factorsString);

        // 2. SAVE RISK SCORE TO STUDENT TABLE
        await supabase
          .from('students')
          .update({ 
            risk_score: result.riskScore / 100, 
            risk_level: result.riskLevel 
          })
          .eq('id', student.id);

        // 3. EXACT TARGET SAVE
        const { error: historyError } = await supabase
          .from('student_history')
          .update({ ...history[4] })
          .eq('student_id', student.id)
          .eq('academic_term', 'Round 5');

        if (historyError) {
           console.error("Failed to update history:", historyError);
        }

        toast.success("LSTM Analysis Synchronized");
        
        // Now factorsParam is defined and passed to the Profile Page
        router.push(`/dashboard/teacher/students/${student.id}?score=${result.riskScore}&level=${result.riskLevel}&factors=${factorsParam}`);
      }
    } catch (error) {
        console.error("Save error:", error);
        toast.error("ML Engine Offline");
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 font-sans text-slate-900">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1e3a8a]">Dropout Predictor</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-500" /> Longitudinal LSTM Analysis
          </p>
        </div>
        <div className="hidden sm:flex gap-1.5">
            {[0,1,2,3,4].map((i) => (
                <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i <= currentTermIdx ? 'bg-[#1e3a8a]' : 'bg-slate-200'}`} />
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Identity Verification */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={`bg-white ${DARK_BLUE_BORDER} border-[1.5px] shadow-sm rounded-2xl`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-[#1e3a8a]">1. Select Student</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search name or ID..." 
                    className="pl-10 rounded-xl border-slate-200 focus:ring-[#1e3a8a]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={student !== null}
                  />
                </div>
                {!student ? (
                  <Button onClick={handleFetchStudent} disabled={isFetching} className="rounded-xl bg-[#1e3a8a] text-white font-bold">
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => {setStudent(null); setSearchQuery("")}} className="rounded-xl font-bold text-slate-600">Reset</Button>
                )}
              </div>

              {student && (
                <div className="mt-6 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4 border-l-4 border-l-emerald-500">
                  <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#1e3a8a] font-bold text-xs shadow-sm">
                    {student.name.split(' ').map((n:any) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{student.name}</p>
                    <p className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mt-0.5">{student.standard}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className={`p-6 rounded-2xl bg-[#1e3a8a]/5 border border-blue-100 shadow-sm transition-opacity ${!student ? 'opacity-50' : ''}`}>
             <div className="flex gap-3">
                <History className="h-5 w-5 text-[#1e3a8a] shrink-0" />
                <div className="text-[11px] leading-relaxed text-slate-600 font-medium">
                  <p className="font-bold text-[#1e3a8a] mb-1 uppercase tracking-widest text-[9px]">The Sequential Method</p>
                  Map observations for each academic term. The AI analyzes the trajectory to predict potential dropout risks.
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Longitudinal Form */}
        <div className="lg:col-span-2">
          <Card className={`bg-white ${DARK_BLUE_BORDER} border-[1.5px] shadow-sm rounded-2xl overflow-hidden transition-all ${!student ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            
            {/* Academic Stepper Tabs */}
            <div className="flex border-b border-slate-50 bg-slate-50/40">
                {termLabels.map((item, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setCurrentTermIdx(idx)}
                        className={`flex-1 py-4 flex flex-col items-center gap-0.5 transition-all border-b-2
                        ${currentTermIdx === idx ? 'text-[#1e3a8a] border-[#1e3a8a] bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}
                        `}
                    >
                        <span className="text-[8px] font-black uppercase tracking-tighter">{item.year}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{item.term}</span>
                    </button>
                ))}
            </div>

            <CardHeader className="pb-4 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-base font-semibold text-[#1e3a8a]">Assessment Indicators</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Period: {termLabels[currentTermIdx].year} - {termLabels[currentTermIdx].term}</CardDescription>
              </div>
              {currentTermIdx > 0 && (
                <Button variant="ghost" size="sm" onClick={copyPreviousTerm} className="text-[#1e3a8a] font-bold text-[9px] uppercase tracking-wider bg-blue-50/50 hover:bg-blue-100 h-7 rounded-lg">
                    <Copy className="h-3 w-3 mr-1" /> Clone Previous Term
                </Button>
              )}
            </CardHeader>

            <CardContent className="pt-2">
              
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                
                {/* 1. FINANCIAL SUPPORT */}
                <div className="col-span-full border-l-2 border-[#1e3a8a] pl-3 py-1 bg-slate-50/80 rounded-r-lg">
                    <span className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5" /> Socio-Economic Indicators
                    </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Financial Capacity for School Uniform</label>
                  <Select value={history[currentTermIdx].c16_2.toString()} onValueChange={(v) => handleUpdate('c16_2', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Reliable / Fully Paid</SelectItem><SelectItem value="0">Struggling / Unpaid</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Household Provision of Daily Nutrition</label>
                  <Select value={history[currentTermIdx].c16_4.toString()} onValueChange={(v) => handleUpdate('c16_4', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Regular Sustenance</SelectItem><SelectItem value="0">Inadequate / None</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Security of Future Tuition Funding</label>
                  <Select value={history[currentTermIdx].c19_2.toString()} onValueChange={(v) => handleUpdate('c19_2', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Guaranteed Sponsor</SelectItem><SelectItem value="0">Highly Uncertain</SelectItem></SelectContent>
                  </Select>
                </div>

                {/* 2. SCHOOL RESOURCES */}
                <div className="col-span-full border-l-2 border-orange-500 pl-3 py-1 bg-orange-50/30 rounded-r-lg mt-2">
                    <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5" /> Academic Resource Availability
                    </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Consistent Access to English Texts</label>
                  <Select value={history[currentTermIdx].g36a_2.toString()} onValueChange={(v) => handleUpdate('g36a_2', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Unrestricted Access</SelectItem><SelectItem value="0">Severely Limited</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Access to Social Studies Materials</label>
                  <Select value={history[currentTermIdx].g36a_9.toString()} onValueChange={(v) => handleUpdate('g36a_9', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Unrestricted Access</SelectItem><SelectItem value="0">Severely Limited</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Mathematical Resource Adequacy</label>
                  <Select value={history[currentTermIdx].g36c_4.toString()} onValueChange={(v) => handleUpdate('g36c_4', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Own/Shared Effectively</SelectItem><SelectItem value="0">Missing or Inadequate</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Compliance with Uniform Standards</label>
                  <Select value={history[currentTermIdx].g4_a.toString()} onValueChange={(v) => handleUpdate('g4_a', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Maintains Full Set</SelectItem><SelectItem value="0">Lacks Basic Attire</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Supply of Essential Writing Materials</label>
                  <Select value={history[currentTermIdx].g4_e.toString()} onValueChange={(v) => handleUpdate('g4_e', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Sufficiently Equipped</SelectItem><SelectItem value="0">Chronically Depleted</SelectItem></SelectContent>
                  </Select>
                </div>

                {/* 3. ACADEMIC ENGAGEMENT */}
                <div className="col-span-full border-l-2 border-emerald-500 pl-3 py-1 bg-emerald-50/30 rounded-r-lg mt-2">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" /> Behavioral & Engagement Metrics
                    </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Perceived Teacher Support & Encouragement</label>
                  <Select value={history[currentTermIdx].h1.toString()} onValueChange={(v) => handleUpdate('h1', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Actively Mentored</SelectItem><SelectItem value="0">Lacks Meaningful Support</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Reliability in Task Completion</label>
                  <Select value={history[currentTermIdx].j3.toString()} onValueChange={(v) => handleUpdate('j3', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Consistently Executes</SelectItem><SelectItem value="0">Frequently Abandoned</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Disciplinary Standing & Peer Respect</label>
                  <Select value={history[currentTermIdx].j5.toString()} onValueChange={(v) => handleUpdate('j5', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Positive Behavioral Record</SelectItem><SelectItem value="0">Recurring Infractions</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Independent Home Study Routines</label>
                  <Select value={history[currentTermIdx].j7.toString()} onValueChange={(v) => handleUpdate('j7', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Maintains Active Routine</SelectItem><SelectItem value="0">No Study Environment</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">In-Class Attentiveness & Focus</label>
                  <Select value={history[currentTermIdx].j2.toString()} onValueChange={(v) => handleUpdate('j2', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Highly Engaged</SelectItem><SelectItem value="0">Passively Withdrawn</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Long-Term Educational Aspirations</label>
                  <Select value={history[currentTermIdx].c17.toString()} onValueChange={(v) => handleUpdate('c17', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Strong Academic Ambition</SelectItem><SelectItem value="0">Apathetic / Resigned</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Historical Grade Progression Stability</label>
                  <Select value={history[currentTermIdx].g1b_2t.toString()} onValueChange={(v) => handleUpdate('g1b_2t', Number(v))}>
                    <SelectTrigger className="rounded-xl h-9 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Stable Advancement</SelectItem><SelectItem value="0">Prior Repetitions/Delays</SelectItem></SelectContent>
                  </Select>
                </div>

              </div>

              {/* Action Area */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={currentTermIdx === 0}
                        onClick={() => setCurrentTermIdx(prev => prev - 1)}
                        className="rounded-lg h-9 font-bold text-[11px] text-slate-400"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentTermIdx === 4}
                        onClick={() => setCurrentTermIdx(prev => prev + 1)}
                        className="rounded-lg h-9 font-bold text-[11px] text-[#1e3a8a] border-slate-200"
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>

                <Button 
                  onClick={runPrediction} 
                  disabled={isPredicting || !student || currentTermIdx < 4}
                  className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-50 transition-all flex items-center gap-3"
                >
                  {isPredicting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Run LSTM Analysis</>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}