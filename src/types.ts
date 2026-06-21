export enum UserRole {
  DOCTOR = "doctor",
  PATIENT = "patient",
  ADMIN = "admin"
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  specialty?: string;
  phone?: string;
  age?: number;
  gender?: string;
}

export enum ScanType {
  XRAY = "X-Ray",
  MRI = "MRI",
  CT = "CT Scan"
}

export enum ScanStatus {
  COMPLETED = "completed",
  PENDING = "pending",
  FAILED = "failed"
}

export enum Severity {
  NORMAL = "Normal",
  MILD = "Mild",
  MODERATE = "Moderate",
  CRITICAL = "Critical"
}

export interface DiagnosticResult {
  diagnosis: string;
  confidence: number;
  normalConfidence: number;
  reportArabic: string;
  findings: string[];
  recommendedSpecialty: string;
  severity: Severity;
  recommendations: string[];
}

export interface MedicalScan {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorName?: string;
  scanType: ScanType;
  uploadedAt: string;
  imageUrl: string; // Base64 or standard reference
  status: ScanStatus;
  result?: DiagnosticResult;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalScans: number;
  criticalCases: number;
  completedReports: number;
  weeklyScans: { name: string; count: number }[];
  scansByType: { name: string; value: number }[];
  severityDistribution: { name: string; value: number }[];
}

export interface VoiceCallRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  audioUrl?: string; // Optional: in case we want to store base64 or URL
  transcription: string;
  summary: string;
}
