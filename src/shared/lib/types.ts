export type UserRole = "parent" | "doctor" | "chw" | "admin";
export type LanguagePref = "en" | "bn";
export type ChildSex = "male" | "female";
export type Classification = "positive" | "negative" | "inconclusive";
export type Severity = "mild" | "moderate" | "severe";
export type Variant = "unilateral_left" | "unilateral_right" | "bilateral";
export type ReferralUrgency = "routine" | "urgent" | "emergency";
export type ReferralStatus = "sent" | "accepted" | "booked" | "completed";
export type Priority = "low" | "medium" | "high" | "urgent";
export type RiskLevel = "low" | "medium" | "high";
export type Specialty = "ENT" | "Ophthalmology" | "Cardiology" | "Genetics" | "Neurology" | "Craniofacial" | "Audiology";

export interface AuthAccount {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  institution: string;
  district: string;
  language_pref: LanguagePref;
  specialty?: Specialty | null;
  created_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  dob: string;
  sex: ChildSex;
  assigned_doctor?: string | null;
  created_at: string;
}

export interface XaiRegion {
  region: string;
  attention: number;
}

export interface SegmentationFinding {
  label: string;
  side: string;
  confidence: number;
}

export interface ComorbidityFlag {
  condition: string;
  risk: RiskLevel;
}

export interface SurgicalWindow {
  procedure: string;
  optimal_age_start: number;
  optimal_age_end: number;
  status: "urgent" | "upcoming" | "future" | "current";
}

export interface CareAction {
  action: string;
  priority: Priority;
}

export interface InferenceResponse {
  classification: Classification;
  confidence: number;
  severity: Severity;
  variant: Variant;
  xai_regions: XaiRegion[];
  segmentation: SegmentationFinding[];
  comorbidity_flags: ComorbidityFlag[];
  surgical_windows: SurgicalWindow[];
  care_pathway: CareAction[];
  xai_visuals?: {
    gradcam_overlay_url?: string;
    focus_map_url?: string;
  };
  predicted_class?: string;
  top_predictions?: Array<{ label: string; probability: number }>;
  model_name?: string;
  model_mode?: string;
  patient_sex?: string;
  explanation_prediction_index?: number;
  xai_method?: string;
}

export interface ScanRecord {
  id: string;
  child_id: string;
  doctor_id?: string | null;
  image_url: string;
  classification: Classification;
  confidence: number;
  severity: Severity;
  variant: Variant;
  xai_data: XaiRegion[];
  segmentation_data: SegmentationFinding[];
  comorbidity_flags: ComorbidityFlag[];
  surgical_windows: SurgicalWindow[];
  care_pathway: CareAction[];
  raw_inference_response: InferenceResponse;
  doctor_notes?: string;
  care_pathway_notes?: string;
  icd10_codes?: string[];
  created_at: string;
}

export interface ReferralRecord {
  id: string;
  scan_id: string;
  child_id: string;
  from_doctor: string;
  to_doctor: string;
  specialty: Specialty;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  appointment_date?: string | null;
  notes: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  title: string;
  body: string;
  language: LanguagePref;
  replies_count: number;
  created_at: string;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  language: LanguagePref;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  link: string;
  created_at: string;
}

export interface SessionState {
  userId: string;
}

export interface SpecialistCenter {
  name: string;
  district: string;
  specialty: Specialty;
  address: string;
  phone: string;
}

export interface DistrictPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface DatabaseState {
  accounts: AuthAccount[];
  profiles: Profile[];
  children: Child[];
  scans: ScanRecord[];
  referrals: ReferralRecord[];
  posts: CommunityPost[];
  replies: CommunityReply[];
  notifications: AppNotification[];
  session: SessionState | null;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  fullName: string;
  role: UserRole;
  institution: string;
  district: string;
  languagePref: LanguagePref;
  specialty?: Specialty | null;
}

export interface ChildPayload {
  id?: string;
  name: string;
  dob: string;
  sex: ChildSex;
  assigned_doctor?: string | null;
}

export interface NewScanPayload {
  file: File;
  childId?: string;
  childDraft?: ChildPayload;
  patientAge: number;
  patientSex: ChildSex;
  actorProfile: Profile;
}

export interface ReferralPayload {
  scanId: string;
  childId: string;
  fromDoctor: string;
  toDoctor: string;
  specialty: Specialty;
  urgency: ReferralUrgency;
  notes: string;
  appointmentDate?: string | null;
}

export interface PostPayload {
  title: string;
  body: string;
  language: LanguagePref;
}

export interface ReplyPayload {
  postId: string;
  body: string;
  language: LanguagePref;
}

export interface NotificationEvent {
  entity: "notifications" | "referrals" | "posts" | "replies" | "scans" | "children";
  userId?: string;
  recordId?: string;
}

export interface ResourceSection {
  id: string;
  title: string;
  description: string;
  bullets: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export const ROLE_OPTIONS: UserRole[] = ["parent", "doctor", "chw", "admin"];
export const SEVERITY_ORDER: Severity[] = ["mild", "moderate", "severe"];
export const SPECIALTY_OPTIONS: Specialty[] = ["ENT", "Ophthalmology", "Cardiology", "Genetics", "Neurology", "Craniofacial", "Audiology"];
export const DISTRICT_OPTIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Cumilla",
  "Gazipur",
  "Narayanganj",
  "Bogura",
] as const;

export const severityToScore = (severity: Severity): number => {
  switch (severity) {
    case "mild":
      return 1;
    case "moderate":
      return 2;
    case "severe":
      return 3;
    default:
      return 1;
  }
};
