import type {
  Student,
  School,
  ClassGroup,
  User,
  AttendanceRecord,
  Intervention,
  Teacher,
  ReportRequest,
} from "./types"

// ---- Schools ----
export const schools: School[] = [
  {
    id: "sch-1",
    name: "Lilongwe LEA Primary",
    district: "Lilongwe",
    zone: "Lilongwe West",
    totalStudents: 420,
    totalTeachers: 14,
    retentionRate: 78.5,
  },
  {
    id: "sch-2",
    name: "Blantyre Model Primary",
    district: "Blantyre",
    zone: "Blantyre City",
    totalStudents: 380,
    totalTeachers: 12,
    retentionRate: 82.1,
  },
  {
    id: "sch-3",
    name: "Mzuzu Community Primary",
    district: "Mzuzu",
    zone: "Mzuzu Central",
    totalStudents: 290,
    totalTeachers: 10,
    retentionRate: 74.3,
  },
]

// ---- Teachers ----
export const teachers: Teacher[] = [
  { id: "t1", name: "Chifundo Phiri", email: "phiri@lifted.mw", standard: 4, schoolId: "sch-1", lastActive: "2026-02-25" },
  { id: "t2", name: "Lumbani Banda", email: "banda@lifted.mw", standard: 5, schoolId: "sch-1", lastActive: "2026-02-24" },
  { id: "t3", name: "Memory Mtambo", email: "mtambo@lifted.mw", standard: 1, schoolId: "sch-1", lastActive: "2026-02-25" }
]

// ---- Users ----
export const users: User[] = [
  { id: "usr-teacher", name: "Grace Banda", email: "grace.banda@lifeed.mw", role: "teacher", schoolId: "sch-1", classIds: ["cls-1a", "cls-1b"] },
  { id: "usr-head", name: "James Phiri", email: "james.phiri@lifeed.mw", role: "headteacher", schoolId: "sch-1" },
  { id: "usr-pea", name: "Dr. Chimwemwe Nyasa", email: "pea@mined.mw", role: "pea", schoolIds: ["sch-1", "sch-2", "sch-3"] },
]

// ---- Classes ----
export const classGroups: ClassGroup[] = [
  { id: "cls-1a", schoolId: "sch-1", grade: 8, section: "A", teacherId: "usr-teacher", studentCount: 15 },
  { id: "cls-1b", schoolId: "sch-1", grade: 8, section: "B", teacherId: "usr-teacher", studentCount: 5 },
]

// ---- Students (Updated with 10 ML Predictors) ----
export const students: Student[] = [
  {
    id: "stu-1", firstName: "Chikondi", lastName: "Phiri", schoolId: "sch-1", classId: "cls-1a", riskLevel: "red", riskScore: 0.88,
    guardianName: "Benson Phiri", guardianPhone: "+265 881 234 567", homeAddress: "Area 25, Lilongwe",
    riskFactors: ["Low attendance (42%)", "High Manual Labor"],
    predictors: { 
        age: 14, gender: "male", gradeLevel: 8, attendanceRate: 42, previousDropout: true, 
        householdIncome: "low", parentalEducation: "none", distanceToSchool: 8.5, 
        mealFrequency: 1, hasLearningMaterials: false, enrollmentDate: "2025-01-15", 
        isActive: true, manualLaborHours: 6, districtOfOrigin: "Lilongwe",
        isOrphaned: false, healthIssues: false,
        // MSAS 10 Factors
        home_study_freq: 1, exercise_books: 0, teacher_respect: 1, task_completion: 1,
        uniform_ownership: 0, uniform_paid: 6, teacher_encouragement: 0,
        textbook_access: 0, aspire_to_continue: 0, snack_money: 6
    }
  },
  {
    id: "stu-2", firstName: "Tawina", lastName: "Banda", schoolId: "sch-1", classId: "cls-1a", riskLevel: "green", riskScore: 0.12,
    guardianName: "Mary Banda", guardianPhone: "+265 999 432 100", homeAddress: "Area 47, Lilongwe",
    riskFactors: [],
    predictors: { 
        age: 13, gender: "female", gradeLevel: 8, attendanceRate: 98, previousDropout: false, 
        householdIncome: "high", parentalEducation: "tertiary", distanceToSchool: 1.2, 
        mealFrequency: 3, hasLearningMaterials: true, enrollmentDate: "2025-01-15", 
        isActive: true, manualLaborHours: 0, districtOfOrigin: "Lilongwe",
        isOrphaned: false, healthIssues: false,
        // MSAS 10 Factors
        home_study_freq: 2, exercise_books: 1, teacher_respect: 2, task_completion: 2,
        uniform_ownership: 1, uniform_paid: 5, teacher_encouragement: 2,
        textbook_access: 1, aspire_to_continue: 1, snack_money: 5
    }
  },
  {
    id: "stu-3", firstName: "Lumbani", lastName: "Mwale", schoolId: "sch-1", classId: "cls-1a", riskLevel: "yellow", riskScore: 0.45,
    guardianName: "Gift Mwale", guardianPhone: "+265 884 111 222", homeAddress: "Area 3, Lilongwe",
    riskFactors: ["Distance to school (7km)"],
    predictors: { 
        age: 14, gender: "male", gradeLevel: 8, attendanceRate: 75, previousDropout: false, 
        householdIncome: "medium", parentalEducation: "primary", distanceToSchool: 7.0, 
        mealFrequency: 2, hasLearningMaterials: true, enrollmentDate: "2025-01-15", 
        isActive: true, manualLaborHours: 2, districtOfOrigin: "Dedza",
        isOrphaned: true, healthIssues: false,
        // MSAS 10 Factors
        home_study_freq: 1, exercise_books: 1, teacher_respect: 2, task_completion: 1,
        uniform_ownership: 1, uniform_paid: 5, teacher_encouragement: 1,
        textbook_access: 1, aspire_to_continue: 1, snack_money: 5
    }
  }
]

// ---- Attendance ----
export const attendanceRecords: AttendanceRecord[] = students.flatMap((student) => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return {
      id: `att-${student.id}-${i}`,
      studentId: student.id,
      date: date.toISOString().split("T")[0],
      present: Math.random() < (student.predictors.attendanceRate / 100),
    }
  })
})

// ---- Interventions ----
export const interventions: Intervention[] = students
  .filter((s) => s.riskLevel === "red")
  .map((s, i) => ({
    id: `int-${i + 1}`,
    studentId: s.id,
    schoolId: s.schoolId,
    type: "feeding_program",
    description: `Daily porridge support provided to ${s.firstName}.`,
    startDate: "2026-02-01",
    status: "active",
    createdBy: "usr-teacher",
  }))

// ---- Reports ----
export const reportRequests: ReportRequest[] = [
  { 
    id: "req1", 
    fromId: "usr-head", 
    toId: "t1", 
    message: "Standard 8 Dropout Analysis Needed.", 
    status: "pending", 
    timestamp: "2026-02-25T10:00:00Z" 
  }
]

// ---- Trends ----
export const monthlyTrends = [
  { month: "Sep", retention: 85, attendance: 78, interventions: 12 },
  { month: "Oct", retention: 83, attendance: 76, interventions: 18 },
  { month: "Nov", retention: 81, attendance: 74, interventions: 24 },
  { month: "Dec", retention: 80, attendance: 72, interventions: 28 },
  { month: "Jan", retention: 82, attendance: 77, interventions: 32 },
  { month: "Feb", retention: 84, attendance: 80, interventions: 35 },
]