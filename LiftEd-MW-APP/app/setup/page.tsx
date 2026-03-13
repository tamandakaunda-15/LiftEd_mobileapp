"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  MapPin, ArrowRight, Loader2, ShieldCheck, 
  Building2, ChevronRight, School as SchoolIcon 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { createClient } from "@supabase/supabase-js"

const MALAWI_ZONES = [
  { id: "LIL-RURAL-EAST", name: "Lilongwe Rural East" },
  { id: "LIL-RURAL-WEST", name: "Lilongwe Rural West" },
  { id: "LLW-CITY-CENTRE", name: "Lilongwe City Centre" },
  { id: "BT-URBAN-01", name: "Blantyre Urban" },
  { id: "ZA-CENTRAL", name: "Zomba Central" },
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export default function SetupPage() {
  const { user, login } = useAuth()
  const router = useRouter()

  const [selectedRole, setSelectedRole] = useState<"headteacher" | "pea" | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [emisId, setEmisId] = useState("")
  const [zoneId, setZoneId] = useState("")

  const handleVerification = async () => {
    if (!selectedRole || !zoneId) {
      toast.error("Required fields missing", { description: "Please select a role and zone." });
      return;
    }
    
    setIsVerifying(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const realUuid = session?.user?.id

      if (!realUuid) throw new Error("No active session. Please log in again.")

      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: realUuid,
          role: selectedRole,
          emisId: selectedRole === 'headteacher' ? emisId : null,
          zoneId: zoneId,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Verification failed")

      toast.success("Identity Verified!", { description: `Workspace initialized for ${zoneId}` })
      login(selectedRole.toUpperCase() as any, user?.email || "", user?.name || "", realUuid)
      router.push(`/dashboard/${selectedRole}`)

    } catch (err: any) {
      toast.error("Verification Failed", { description: err.message })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 bg-[radial-gradient(#ccfbf1_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="max-w-5xl w-full space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-mint-100 rounded-2xl mb-4 border border-teal-100">
            <SchoolIcon className="h-8 w-8 text-[#1e3a8a]" />
          </div>
          <h1 className="text-4xl font-black text-[#1e3a8a] tracking-tight sm:text-5xl">
            Admin Account Setup
          </h1>
          <p className="text-slate-500 text-lg max-w-lg mx-auto font-medium">
            Initialize your administrative credentials for the zone dashboard.
          </p>
          <div className="bg-teal-50 border border-teal-100 inline-block px-4 py-1.5 rounded-full mt-4">
            <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest">
              Staff Only Verification
            </p>
          </div>
        </div>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { id: 'pea', label: 'PEA (District)', icon: MapPin, desc: 'Zone-wide Oversight' },
            { id: 'headteacher', label: 'Headteacher', icon: Building2, desc: 'School Management' }
          ].map((role) => (
            <Card 
              key={role.id}
              onClick={() => setSelectedRole(role.id as any)}
              className={`relative cursor-pointer transition-all duration-300 group hover:shadow-lg border-[2.5px] rounded-3xl ${
                selectedRole === role.id 
                  ? `border-[#1e3a8a] bg-teal-50/30 shadow-md` 
                  : 'hover:border-teal-200 border-slate-100'
              }`}
            >
              <CardContent className="p-8">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                  selectedRole === role.id ? `bg-[#1e3a8a] text-white` : 'bg-slate-50 text-slate-400'
                }`}>
                  <role.icon className="h-7 w-7" />
                </div>
                <h3 className={`font-bold text-2xl ${selectedRole === role.id ? 'text-[#1e3a8a]' : 'text-slate-700'}`}>
                  {role.label}
                </h3>
                <p className="text-sm font-medium text-slate-400 mt-1">{role.desc}</p>
                {selectedRole === role.id && (
                  <div className="absolute top-6 right-6">
                    <div className="h-6 w-6 rounded-full bg-[#1e3a8a] flex items-center justify-center">
                      <ChevronRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dynamic Verification Form */}
        {selectedRole && (
          <Card className="max-w-md mx-auto border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <div className="h-2 w-full bg-[#1e3a8a]" />
            <CardHeader className="pt-8 px-8">
              <CardTitle className="text-2xl font-bold text-slate-900">Verification</CardTitle>
              <CardDescription className="font-medium">
                Link your account to your assigned zone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-10">
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Education Zone</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-[#1e3a8a]" />
                  <select 
                    className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-700 focus:border-[#1e3a8a] focus:ring-0 outline-none appearance-none transition-all"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                  >
                    <option value="">Choose your zone...</option>
                    {MALAWI_ZONES.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedRole === "headteacher" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">School EMIS ID</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-3.5 h-4 w-4 text-[#1e3a8a]" />
                    <Input 
                      placeholder="e.g. 1029384" 
                      className="pl-10 h-12 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold focus-visible:ring-0 focus-visible:border-[#1e3a8a]" 
                      value={emisId}
                      onChange={(e) => setEmisId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleVerification}
                disabled={isVerifying || !zoneId}
                className="w-full h-14 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-900/10 transition-all hover:translate-y-[-2px] active:translate-y-0"
              >
                {isVerifying ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Finalizing...</>
                ) : (
                  <>Complete Setup <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}