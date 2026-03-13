"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Plus, Building2, Calendar, CheckCircle2, Search, X, Activity, Server } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

// Mock data for the ledger
const initialLogs = [
  { id: 1, date: "2026-03-05", school: "Lilongwe LEA Primary", item: "Standard 8 Math Textbooks", quantity: "150 units", provider: "Ministry of Education", status: "Delivered" },
  { id: 2, date: "2026-03-02", school: "Bunda Community", item: "Maize Flour & Likuni Phala", quantity: "500 kg", provider: "World Food Programme", status: "Active" },
  { id: 3, date: "2026-02-28", school: "Chiwamba Model", item: "Bicycles (Long-Distance Learners)", quantity: "25 units", provider: "World Vision", status: "Delivered" },
  { id: 4, date: "2026-02-20", school: "Mchitanjiru Primary", item: "Sanitary Pad Kits", quantity: "200 packs", provider: "UNICEF", status: "Delivered" },
]

export default function PEAResourceLedgerPage() {
  const [logs, setLogs] = useState(initialLogs)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ school: "", item: "", quantity: "", provider: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    setTimeout(() => {
      const newLog = {
        id: logs.length + 1,
        date: new Date().toISOString().split("T")[0],
        school: formData.school || "Lilongwe LEA Primary",
        item: formData.item,
        quantity: formData.quantity,
        provider: formData.provider || "Ministry of Education",
        status: "Just Added"
      }
      
      setLogs([newLog, ...logs])
      setIsSubmitting(false)
      setIsModalOpen(false)
      setFormData({ school: "", item: "", quantity: "", provider: "" })
      toast.success("Resource Synced to Ledger", {
        description: "New allocation securely recorded in the zone database."
      })
    }, 800)
  }

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-screen pb-10 relative">
      
      {/* Header with Tech Glow */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-1">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4ade80]"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#4ade80]">Live Ledger Network</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#1e3a8a] to-blue-500">
            Resource Allocation
          </h1>
          <p className="mt-1 text-base text-slate-500 font-medium">
            Immutable tracking of supplies delivered across the zone.
          </p>
        </div>
        
        {/* Tech-Savvy Animated Button */}
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-gradient-to-r from-[#1e3a8a] to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(30,58,138,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 px-6 h-12"
        >
          <Plus className="h-5 w-5 mr-2" />
          <span className="font-bold tracking-wide">Log New Resource</span>
        </Button>
      </div>

      {/* Stats Summary with subtle borders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-slate-200 shadow-sm rounded-[24px] bg-white/80 backdrop-blur-md hover:border-blue-300 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-100">
              <Server className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Deliveries</p>
              <p className="text-2xl font-black text-[#1e3a8a]">{logs.length + 120}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm rounded-[24px] bg-white/80 backdrop-blur-md hover:border-blue-300 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center border border-blue-100">
              <Activity className="h-5 w-5 text-[#1e3a8a]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zone Coverage</p>
              <p className="text-2xl font-black text-[#1e3a8a]">100%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm rounded-[24px] bg-white/80 backdrop-blur-md hover:border-blue-300 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-100">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest Sync</p>
              <p className="text-2xl font-black text-[#1e3a8a]">Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Ledger Table */}
      <Card className="border border-slate-200 shadow-lg shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 bg-slate-50/50">
          <div>
            <CardTitle className="text-xl font-bold text-[#1e3a8a]">Decentralized Ledger</CardTitle>
            <CardDescription>Verified resource tracking system.</CardDescription>
          </div>
          <div className="relative w-full md:w-72 group">
            <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-20 rounded-full blur transition-opacity duration-300"></div>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
            <Input 
              placeholder="Search by school or item..." 
              className="pl-9 bg-white border border-slate-200 focus:border-blue-400 rounded-full h-11 text-sm shadow-sm relative z-10 transition-colors" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-50/80 border-b border-slate-100">
                   <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / ID</th>
                   <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">School</th>
                   <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Logged</th>
                   <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Provider</th>
                   <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {logs.map((log, i) => (
                   <tr key={i} className="group hover:bg-blue-50/50 transition-colors duration-200">
                     <td className="p-5">
                       <p className="text-sm font-bold text-slate-600">{log.date}</p>
                       <p className="text-[10px] font-mono text-slate-400 mt-1">TX-{Math.floor(Math.random() * 90000) + 10000}</p>
                     </td>
                     <td className="p-5 text-sm font-bold text-[#1e3a8a]">{log.school}</td>
                     <td className="p-5">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{log.item}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded-md">Qty: {log.quantity}</p>
                     </td>
                     <td className="p-5 text-sm font-medium text-slate-600">
                        <span className="bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-md text-[11px] font-bold">
                          {log.provider}
                        </span>
                     </td>
                     <td className="p-5 text-right">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          log.status === "Just Added" ? "bg-blue-50 text-blue-600 border border-blue-200 animate-pulse" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}>
                          <CheckCircle2 className="h-3 w-3" /> {log.status}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </CardContent>
      </Card>

      {/* Modern Glassmorphism Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#1e3a8a] p-6 relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Log Resource</h2>
              <p className="text-blue-200 text-xs">Enter data into the secure zone ledger.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Resource Item</label>
                <Input 
                  required
                  placeholder="e.g. Bicycles, Textbooks" 
                  className="rounded-xl border-slate-200 focus:border-blue-500"
                  value={formData.item}
                  onChange={e => setFormData({...formData, item: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quantity</label>
                  <Input 
                    required
                    placeholder="e.g. 50 units" 
                    className="rounded-xl border-slate-200 focus:border-blue-500"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Provider</label>
                  <Input 
                    placeholder="e.g. UNICEF" 
                    className="rounded-xl border-slate-200 focus:border-blue-500"
                    value={formData.provider}
                    onChange={e => setFormData({...formData, provider: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Target School</label>
                <select 
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500"
                  value={formData.school}
                  onChange={e => setFormData({...formData, school: e.target.value})}
                >
                  <option value="">Select a school...</option>
                  <option value="Lilongwe LEA Primary">Lilongwe LEA Primary</option>
                  <option value="Bunda Community">Bunda Community</option>
                  <option value="Chiwamba Model">Chiwamba Model</option>
                </select>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(30,58,138,0.2)] transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 animate-spin" /> Securing Block...
                  </span>
                ) : (
                  "Commit to Ledger"
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}