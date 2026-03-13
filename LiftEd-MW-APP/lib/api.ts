// =============================================
// API Abstraction Layer - LiftEd Malawi
// =============================================

import type {
  Student,
  School,
  AttendanceRecord,
  Intervention,
  PredictionResponse,
  TeacherDashboardSummary,
  Gender,
} from "./types"
import {
  students as mockStudents,
  schools as mockSchools,
  attendanceRecords as mockAttendance,
  interventions as mockInterventions,
} from "./mock-data"
import { predictRisk as localSimulation } from "./prediction"

// FastAPI URL for Python ML Engine
const ML_API_URL = "http://127.0.0.1:8000"

/**
 * Helper: mapDbStudentToUi
 * Maps Supabase snake_case columns to Frontend camelCase Student Interface.
 * This ensures 100% compliance with your lib/types.ts file.
 */
const mapDbStudentToUi = (s: any): Student => ({
  id: s.id,
  firstName: s.first_name,
  lastName: s.last_name,
  schoolId: s.school_id,
  riskLevel: s.risk_level || "green",
  riskScore: s.risk_score || 0.1,
  riskFactors: s.risk_factors || [],
  guardianName: s.guardian_name,
  guardianPhone: s.guardian_phone,
  homeAddress: s.home_address,
  classId: `class-${s.standard}`, 
  predictors: {
    // 1. Data created by Headteacher Enrollment
    gradeLevel: s.standard,
    gender: (s.gender?.toLowerCase() as Gender) || "female",
    age: Number(s.age) || 12,
    districtOfOrigin: s.district || "Lilongwe",
    enrollmentDate: s.created_at || new Date().toISOString(),
    isActive: s.is_active ?? true,

    // 2. The 10 MSAS Factors for Teacher's Prediction Page
    home_study_freq: s.home_study_freq ?? 0,         
    exercise_books: s.exercise_books ?? 0,          
    teacher_respect: s.teacher_respect ?? 0,        
    task_completion: s.task_completion ?? 0,        
    uniform_ownership: s.uniform_ownership ?? 0,    
    uniform_paid: s.uniform_paid ?? 0,               
    teacher_encouragement: s.teacher_encouragement ?? 0, 
    textbook_access: s.textbook_access ?? 0,        
    aspire_to_continue: s.aspire_to_continue ?? 0,  
    snack_money: s.snack_money ?? 0,

    // 3. System Required Predictors (Safety fallbacks for Demo)
    attendanceRate: s.attendance_rate || 100,
    distanceToSchool: s.distance_to_school || 1,
    householdIncome: (s.household_income as "low" | "medium" | "high") || "medium",
    manualLaborHours: s.manual_labor_hours || 0,
    previousDropout: s.previous_dropout || false,
    parentalEducation: (s.parental_education as "none" | "primary" | "secondary" | "tertiary") || "primary",
    mealFrequency: s.meal_frequency || 3,
    hasLearningMaterials: s.has_learning_materials ?? true,
    isOrphaned: s.is_orphaned || false,
    healthIssues: s.health_issues || false,
  }
})

// ---- Risk Prediction (The Bridge to your Python main.py) ----

export async function getMLPrediction(factors: any): Promise<PredictionResponse> {
  try {
    const res = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(factors), // Sending the 10 factors: home_study_freq, etc.
    })
    
    if (!res.ok) throw new Error("ML Engine Error")
    const data = await res.json()
    
    return {
      riskScore: data.riskScore,
      riskLevel: data.riskLevel,
      riskFactors: data.riskFactors || [], 
    }
  } catch (error) {
    console.error("FastAPI unreachable, falling back to local simulation:", error)
    // Fallback to local prediction logic if the Python server is offline
    return localSimulation(factors)
  }
}

// ---- Students (Supabase Persistence Layer) ----

export async function getStudentsBySchool(schoolId: string): Promise<Student[]> {
  try {
    const res = await fetch(`/api/students?schoolId=${schoolId}`)
    if (!res.ok) throw new Error("Database fetch failed")
    const data = await res.json()
    return data.students.map(mapDbStudentToUi)
  } catch (e) {
    console.warn("API Error: Showing mock data for demo safety.")
    return mockStudents.filter((s) => s.schoolId === schoolId)
  }
}

export async function getStudentById(studentId: string): Promise<Student | undefined> {
  try {
    const res = await fetch(`/api/students/${studentId}`)
    if (!res.ok) return undefined
    const data = await res.json()
    return mapDbStudentToUi(data.student)
  } catch (e) { 
    return mockStudents.find((s) => s.id === studentId) 
  }
}

// ---- Dashboard Summaries ----

export async function getTeacherSummary(schoolId: string, classIds: string[]): Promise<TeacherDashboardSummary> {
  try {
    const allStudents = await getStudentsBySchool(schoolId)
    const classStudents = allStudents.filter((s) => classIds.includes(s.classId))
    
    const activeInterventions = mockInterventions.filter(
      (i) => i.status === "active" && classStudents.some((s) => s.id === i.studentId)
    )

    return {
      totalStudents: classStudents.length,
      presentToday: Math.round(classStudents.length * 0.94), // Demo calculation
      atRiskRed: classStudents.filter((s) => s.riskLevel === "red").length,
      atRiskYellow: classStudents.filter((s) => s.riskLevel === "yellow").length,
      activeInterventions: activeInterventions.length,
      attendanceRate: classStudents.length > 0
        ? Math.round(classStudents.reduce((sum, s) => sum + s.predictors.attendanceRate, 0) / classStudents.length)
        : 0,
    }
  } catch (e) {
    return {
      totalStudents: 0, presentToday: 0, atRiskRed: 0, atRiskYellow: 0, activeInterventions: 0, attendanceRate: 0
    }
  }
}

export async function getSchools(): Promise<School[]> { return mockSchools }

export async function getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
  return mockAttendance.filter((a) => a.studentId === studentId)
}