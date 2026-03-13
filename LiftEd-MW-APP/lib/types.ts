export type UserRole = "teacher" | "headteacher" | "pea" | "ngo" | "pending";
export type RiskLevel = "red" | "yellow" | "green";
export type Gender = "male" | "female";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  classIds?: string[];
  schoolIds?: string[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  standard: number;
  schoolId: string;
  lastActive?: string;
}

export interface ReportRequest {
  id: string;
  fromId: string;
  toId: string;
  message: string;
  status: "pending" | "replied";
  timestamp: string;
  replyMessage?: string;
  replyAttachmentUrl?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  classId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactors: string[];
  guardianName?: string;
  guardianPhone?: string;
  homeAddress?: string;
  predictors: {
    age: number;
    attendanceRate: number;
    previousDropout: boolean;
    householdIncome: "low" | "medium" | "high";
    parentalEducation: "none" | "primary" | "secondary" | "tertiary";
    distanceToSchool: number;
    mealFrequency: number;
    hasLearningMaterials: boolean;
    gender: Gender;
    gradeLevel: number;
    enrollmentDate: string; 
    isActive: boolean;
    manualLaborHours: number; 
    districtOfOrigin: string;
    
    // --- 10 MSAS Factors for Teacher's Prediction Page ---
    home_study_freq: number;       // J7
    exercise_books: number;        // G4
    teacher_respect: number;       // J5
    task_completion: number;       // J3
    uniform_ownership: number;     // G4
    uniform_paid: number;          // C16
    teacher_encouragement: number; // H1
    textbook_access: number;       // G4
    aspire_to_continue: number;    // C17
    snack_money: number;           // C16

    // --- Additional Demo Fields ---
    isOrphaned: boolean;
    healthIssues: boolean;
  };
}

export interface School {
  id: string;
  name: string;
  district: string;
  zone: string;
  totalStudents: number;
  totalTeachers: number;
  retentionRate: number;
}

export interface ClassGroup {
  id: string;
  schoolId: string;
  grade: number;
  section: string;
  teacherId: string;
  studentCount: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  present: boolean;
  reason?: string;
}

export interface Intervention {
  id: string;
  studentId: string;
  schoolId: string;
  type: "academic_support" | "feeding_program" | "material_provision" | "counseling" | "home_visit" | "financial_aid";
  description: string;
  startDate: string;
  endDate?: string;
  status: "planned" | "active" | "completed" | "cancelled";
  outcome?: string;
  createdBy: string;
}

export interface PredictionResponse {
  riskScore: number;
  riskLevel: "red" | "yellow" | "green";
  riskFactors: string[];
}

// ---- Dashboard Summary Types ----

export interface TeacherDashboardSummary {
  totalStudents: number;
  presentToday: number;
  atRiskRed: number;
  atRiskYellow: number;
  activeInterventions: number;
  attendanceRate: number;
}

export interface HeadteacherDashboardSummary {
  totalStudents: number;
  totalTeachers: number;
  retentionRate: number;
  atRiskRed: number;
  atRiskYellow: number;
  atRiskGreen: number;
  activeInterventions: number;
  completedInterventions: number;
  gradeBreakdown: {
    grade: number;
    total: number;
    atRisk: number;
    retention: number;
  }[];
}

export interface PeaDashboardSummary {
  totalSchools: number;
  totalStudents: number;
  overallRetention: number;
  avgAttendance: number;
  totalInterventions: number;
  schoolComparisons: {
    schoolId: string;
    name: string;
    retention: number;
    atRisk: number;
    interventions: number;
  }[];
  districtTrends: {
    month: string;
    retention: number;
    attendance: number;
    interventions: number;
  }[];
}