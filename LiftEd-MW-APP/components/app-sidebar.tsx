"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  ClipboardList,
  LayoutDashboard,
  BarChart3,
  FileText,
  Building2,
  PresentationIcon,
  LogOut,
  UserPlus,
  GraduationCap,
  ShieldAlert,
  Brain 
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

// FIXED: Updated hrefs to include /dashboard/ to match your actual folder structure
const navByRole: Record<string, { label: string; items: NavItem[] }[]> = {
  teacher: [
    {
      label: "Classroom",
      items: [
        { title: "My Standards", href: "/dashboard/teacher", icon: LayoutDashboard },
        { title: "Student Roster", href: "/dashboard/teacher/students", icon: Users },
        { title: "Attendance", href: "/dashboard/teacher/attendance", icon: CalendarCheck },
      ],
    },
    {
      label: "AI Diagnostics",
      items: [
        { title: "Dropout Predictor", href: "/dashboard/teacher/predict", icon: Brain }, 
        { title: "Active Interventions", href: "/dashboard/teacher/interventions", icon: ClipboardList },
      ],
    },
  ],
  headteacher: [
    {
      label: "School Overview",
      items: [
        { title: "Dashboard", href: "/dashboard/headteacher", icon: LayoutDashboard },
        { title: "Students", href: "/dashboard/headteacher/students", icon: Users },
        { title: "Grade Breakdown", href: "/dashboard/headteacher/grades", icon: BarChart3 },
        { title: "Staff Management", href: "/dashboard/headteacher/staff", icon: UserPlus }, // Changed to UserPlus icon per your provisioning logic
      ],
    },
    {
      label: "Management",
      items: [
        { title: "Interventions", href: "/dashboard/headteacher/interventions", icon: ClipboardList },
        { title: "Reports", href: "/dashboard/headteacher/reports", icon: FileText },
      ],
    },
  ],
  pea: [
    {
      label: "Zone Intelligence",
      items: [
        { title: "Dashboard", href: "/dashboard/pea", icon: LayoutDashboard },
        { title: "Schools Portfolio", href: "/dashboard/pea/schools", icon: Building2 }, 
      ],
    },
    {
      label: "Monitoring",
      items: [
        { title: "Risk Analysis", href: "/dashboard/pea/interventions", icon: ShieldAlert},
        { title: "Reports", href: "/dashboard/pea/reports", icon: FileText },
        { title: "Resource Allocation", href: "/dashboard/pea/resources", icon: PresentationIcon }
      ],
    },
  ],
  ngo: [
    {
      label: "NGO Dashboard",
      items: [
        { title: "Overview", href: "/dashboard/pea", icon: LayoutDashboard },
      ]
    }
  ]
}

const roleLabels: Record<string, string> = {
  teacher: "Teacher",
  headteacher: "Headteacher",
  pea: "Primary Education Advisor",
  ngo: "NGO Portal",
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const groups = navByRole[user.role?.toLowerCase()] || []

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-gradient-to-b from-blue-600 to-[#1e3a8a] shadow-xl z-50">
      <SidebarHeader className="p-5">
        <Link href={`/dashboard/${user.role?.toLowerCase() === "pea" || user.role?.toLowerCase() === "ngo" ? "pea" : user.role?.toLowerCase()}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-md transform transition-transform hover:scale-105">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-black tracking-tight text-white drop-shadow-sm">LiftEd Malawi</span>
            <span className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">
              {(roleLabels[user.role?.toLowerCase()]) || "User"} Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="bg-white/10 mx-4" />

      <SidebarContent className="px-3 pt-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="mb-2">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-black text-blue-200 mb-2 px-2 opacity-80">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href} className="mb-1">
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link 
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 transition-all duration-300 rounded-xl px-3 py-2.5",
                            isActive 
                              ? "bg-white/15 text-[#98FBCB] font-bold shadow-sm backdrop-blur-sm border border-white/10 translate-x-1" 
                              : "text-blue-100 hover:bg-white/10 hover:text-white font-medium hover:translate-x-1"
                          )}
                        >
                          <item.icon className={cn(
                            "h-4 w-4 shrink-0 transition-all duration-300", 
                            isActive ? "text-[#98FBCB] drop-shadow-[0_0_8px_rgba(152,251,203,0.5)]" : "text-blue-200 group-hover:text-white"
                          )} />
                          <span className="text-sm tracking-wide">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10 bg-black/10 mt-auto">
        <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center px-1">
          {/* User Avatar & Info */}
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden overflow-hidden flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-blue-50 text-xs font-black text-blue-700 shadow-md border border-white/20">
              {user.name?.split(" ").map((n) => n[0]).join("") || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate leading-tight">{user.name}</span>
              <span className="text-[9px] font-bold text-blue-300/80 truncate uppercase tracking-tighter">
                Session Active
              </span>
            </div>
          </div>

          {/* Styled Logout Button */}
          <button
            onClick={logout}
            className={cn(
              "flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 group/logout",
              "text-blue-200 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]",
              "group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10"
            )}
            title="Sign out of LiftEd"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover/logout:translate-x-0.5" />
            <span className="ml-2 text-xs font-bold group-data-[collapsible=icon]:hidden">
              Exit
            </span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}