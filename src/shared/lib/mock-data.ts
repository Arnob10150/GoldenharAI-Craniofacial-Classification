import type {
  AppNotification,
  CareAction,
  Child,
  CommunityPost,
  CommunityReply,
  DatabaseState,
  DistrictPoint,
  FAQItem,
  Profile,
  ReferralRecord,
  ResourceSection,
  ScanRecord,
  SpecialistCenter,
} from "@/shared/lib/types";

const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

const doctorA = "doctor_a";
const doctorB = "doctor_b";
const parentA = "parent_a";
const parentB = "parent_b";
const chwA = "chw_a";
const adminA = "admin_a";
const doctorC = "doctor_c";
const doctorD = "doctor_d";
const parentC = "parent_c";
const chwB = "chw_b";
const childA = "child_a";
const childB = "child_b";
const scanA = "scan_a";
const scanB = "scan_b";
const referralA = "ref_a";
const postA = "post_a";

export const districtPoints: DistrictPoint[] = [
  { name: "Dhaka", lat: 23.8103, lng: 90.4125 },
  { name: "Chattogram", lat: 22.3569, lng: 91.7832 },
  { name: "Rajshahi", lat: 24.3745, lng: 88.6042 },
  { name: "Khulna", lat: 22.8456, lng: 89.5403 },
  { name: "Sylhet", lat: 24.8949, lng: 91.8687 },
  { name: "Barishal", lat: 22.701, lng: 90.3535 },
  { name: "Rangpur", lat: 25.7439, lng: 89.2752 },
  { name: "Mymensingh", lat: 24.7471, lng: 90.4203 },
  { name: "Cumilla", lat: 23.4607, lng: 91.1809 },
  { name: "Gazipur", lat: 23.9999, lng: 90.4203 },
  { name: "Narayanganj", lat: 23.6238, lng: 90.5 },
  { name: "Bogura", lat: 24.851, lng: 89.3697 },
];

export const specialistCenters: SpecialistCenter[] = [
  { name: "National Institute of ENT & Hearing", district: "Dhaka", specialty: "ENT", address: "Sher-e-Bangla Nagar, Dhaka", phone: "+880-2-55012345" },
  { name: "BSMMU Craniofacial Clinic", district: "Dhaka", specialty: "Craniofacial", address: "Shahbag, Dhaka", phone: "+880-2-55165760" },
  { name: "Dhaka Shishu Hospital Cardiac Unit", district: "Dhaka", specialty: "Cardiology", address: "Sher-e-Bangla Nagar, Dhaka", phone: "+880-2-55059063" },
  { name: "Chattogram Medical College Hospital", district: "Chattogram", specialty: "Ophthalmology", address: "Anderkilla, Chattogram", phone: "+880-31-619890" },
  { name: "Rajshahi Medical College Hospital", district: "Rajshahi", specialty: "Genetics", address: "Laxmipur, Rajshahi", phone: "+880-721-772400" },
  { name: "Sylhet MAG Osmani Medical College", district: "Sylhet", specialty: "Neurology", address: "Medical Road, Sylhet", phone: "+880-821-713885" },
];

export const resourceSectionsEn: ResourceSection[] = [
  {
    id: "what-is-goldenhar",
    title: "What is Goldenhar Syndrome?",
    description: "Goldenhar Syndrome is a rare congenital condition that can affect the ears, jaw, eyes, spine, and related organs.",
    bullets: [
      "Symptoms can range from mild facial asymmetry to multisystem involvement.",
      "Early hearing, vision, and cardiac assessment matters.",
      "A multidisciplinary care plan helps families navigate surgery timing and development support.",
    ],
  },
  {
    id: "surgical-timeline",
    title: "Surgical timeline guide",
    description: "Treatment is age-sensitive. Some interventions are urgent while others are planned around growth.",
    bullets: [
      "Eye protection issues may need urgent ophthalmic review.",
      "Ear reconstruction is often planned in later childhood.",
      "Jaw procedures are usually coordinated with facial growth and orthodontic care.",
    ],
  },
  {
    id: "emergency-checklist",
    title: "Emergency checklist",
    description: "Use this checklist when breathing, feeding, cardiac, or eye protection symptoms worsen.",
    bullets: [
      "Bring your latest scan report and medication list.",
      "Tell the team about hearing loss, vertebral issues, or heart concerns.",
      "Seek urgent care if feeding difficulty, cyanosis, or eye exposure worsens.",
    ],
  },
];

export const resourceSectionsBn: ResourceSection[] = [
  {
    id: "what-is-goldenhar",
    title: "গোল্ডেনহার সিনড্রোম কী?",
    description: "গোল্ডেনহার সিনড্রোম একটি বিরল জন্মগত অবস্থা যা কান, চোয়াল, চোখ, মেরুদণ্ড এবং অন্যান্য অঙ্গকে প্রভাবিত করতে পারে।",
    bullets: [
      "উপসর্গ হালকা মুখের অসমতা থেকে একাধিক অঙ্গের জটিলতা পর্যন্ত হতে পারে।",
      "শুরুতেই শ্রবণ, দৃষ্টি এবং হৃদ্‌যন্ত্র পরীক্ষা গুরুত্বপূর্ণ।",
      "বহুমাত্রিক চিকিৎসা পরিকল্পনা পরিবারকে সঠিক সময়ে সেবা নিতে সাহায্য করে।",
    ],
  },
  {
    id: "surgical-timeline",
    title: "সার্জারির সময়সূচি নির্দেশিকা",
    description: "চিকিৎসার সময় বয়সের উপর নির্ভরশীল। কিছু হস্তক্ষেপ দ্রুত দরকার হয়, কিছু শিশুর বৃদ্ধি অনুযায়ী পরিকল্পনা করা হয়।",
    bullets: [
      "চোখ সুরক্ষার সমস্যা থাকলে দ্রুত চক্ষু বিশেষজ্ঞ দেখানো দরকার।",
      "কানের পুনর্গঠন সাধারণত একটু বড় বয়সে পরিকল্পনা করা হয়।",
      "চোয়ালের চিকিৎসা মুখের বৃদ্ধি এবং অর্থোডন্টিক পরিকল্পনার সাথে সমন্বয় করা হয়।",
    ],
  },
  {
    id: "emergency-checklist",
    title: "জরুরি চেকলিস্ট",
    description: "শ্বাস, খাওয়া, হৃদ্‌যন্ত্র বা চোখের সমস্যা বাড়লে এই তালিকা অনুসরণ করুন।",
    bullets: [
      "সর্বশেষ স্ক্যান রিপোর্ট এবং ওষুধের তালিকা সাথে রাখুন।",
      "শ্রবণ সমস্যা, মেরুদণ্ডের সমস্যা বা হৃদ্‌রোগের ঝুঁকি সম্পর্কে চিকিৎসককে জানান।",
      "খেতে কষ্ট, নীলাভ ভাব বা চোখ শুকিয়ে গেলে দ্রুত জরুরি সেবা নিন।",
    ],
  },
];

export const faqEn: FAQItem[] = [
  { question: "Can this app diagnose Goldenhar Syndrome?", answer: "No. GoldenScope AI is decision support for screening, triage, and care coordination. Clinical review is still required." },
  { question: "What image should I upload?", answer: "Use a clear medical or clinical image with the affected area visible. Avoid heavy compression or screenshots when possible." },
  { question: "Who should I contact first after a positive scan?", answer: "Start with a craniofacial specialist or pediatric ENT/ophthalmology service depending on the main findings." },
];

export const faqBn: FAQItem[] = [
  { question: "এই অ্যাপ কি রোগ নির্ণয় করে?", answer: "না। GoldenScope AI স্ক্রিনিং ও চিকিৎসা-সমন্বয়ের সহায়ক টুল। চূড়ান্ত সিদ্ধান্তের জন্য চিকিৎসকের মূল্যায়ন প্রয়োজন।" },
  { question: "কী ধরনের ছবি আপলোড করব?", answer: "আক্রান্ত অংশ স্পষ্ট দেখা যায় এমন পরিষ্কার ক্লিনিক্যাল বা মেডিক্যাল ছবি দিন। অতিরিক্ত কমপ্রেসড ছবি এড়িয়ে চলুন।" },
  { question: "পজিটিভ ফল এলে প্রথমে কাকে দেখাব?", answer: "মূল উপসর্গের ভিত্তিতে ক্র্যানিওফেসিয়াল বিশেষজ্ঞ, শিশু ENT বা চক্ষু বিশেষজ্ঞের সাথে যোগাযোগ করুন।" },
];

const baseCarePathway: CareAction[] = [
  { action: "Schedule craniofacial specialist within 4 weeks", priority: "high" },
  { action: "Hearing assessment — conductive loss likely", priority: "high" },
  { action: "Cardiac screening recommended", priority: "high" },
  { action: "Dermoid excision planning — age window approaching", priority: "urgent" },
];

const profiles: Profile[] = [
  { id: doctorA, full_name: "Dr. Nadia Rahman", role: "doctor", institution: "Dhaka Shishu Hospital", district: "Dhaka", language_pref: "en", specialty: "Craniofacial", created_at: now() },
  { id: doctorB, full_name: "Dr. Fahim Chowdhury", role: "doctor", institution: "Chattogram Medical College Hospital", district: "Chattogram", language_pref: "en", specialty: "Ophthalmology", created_at: now() },
  { id: doctorC, full_name: "Tutul", role: "doctor", institution: "GoldenScope AI Demo Team", district: "Dhaka", language_pref: "en", specialty: "ENT", created_at: now() },
  { id: doctorD, full_name: "Naim", role: "doctor", institution: "GoldenScope AI Demo Team", district: "Dhaka", language_pref: "en", specialty: "Cardiology", created_at: now() },
  { id: parentA, full_name: "Maliha Akter", role: "parent", institution: "", district: "Dhaka", language_pref: "bn", specialty: null, created_at: now() },
  { id: parentB, full_name: "Arnob", role: "parent", institution: "", district: "Dhaka", language_pref: "en", specialty: null, created_at: now() },
  { id: parentC, full_name: "Sadia", role: "parent", institution: "", district: "Dhaka", language_pref: "en", specialty: null, created_at: now() },
  { id: chwA, full_name: "Sharmin Sultana", role: "chw", institution: "Community Care Network", district: "Mymensingh", language_pref: "bn", specialty: null, created_at: now() },
  { id: chwB, full_name: "Nasif", role: "chw", institution: "GoldenScope AI Field Team", district: "Gazipur", language_pref: "en", specialty: null, created_at: now() },
  { id: adminA, full_name: "System Admin", role: "admin", institution: "GoldenScope AI", district: "Dhaka", language_pref: "en", specialty: null, created_at: now() },
];

const children: Child[] = [
  { id: childA, parent_id: parentA, name: "Rafsan", dob: "2019-08-14", sex: "male", assigned_doctor: doctorA, created_at: now() },
  { id: childB, parent_id: parentA, name: "Rimsha", dob: "2021-11-02", sex: "female", assigned_doctor: doctorB, created_at: now() },
];

const scans: ScanRecord[] = [
  {
    id: scanA,
    child_id: childA,
    doctor_id: doctorA,
    image_url: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
    classification: "positive",
    confidence: 0.91,
    severity: "moderate",
    variant: "unilateral_left",
    xai_data: [
      { region: "left_ear", attention: 0.91 },
      { region: "left_jaw", attention: 0.78 },
      { region: "left_eye", attention: 0.54 },
      { region: "right_side", attention: 0.11 },
    ],
    segmentation_data: [
      { label: "microtia", side: "left", confidence: 0.89 },
      { label: "mandibular_hypoplasia", side: "left", confidence: 0.73 },
    ],
    comorbidity_flags: [
      { condition: "conductive_hearing_loss", risk: "high" },
      { condition: "vertebral_anomalies", risk: "medium" },
    ],
    surgical_windows: [
      { procedure: "ear_reconstruction", optimal_age_start: 6, optimal_age_end: 10, status: "upcoming" },
      { procedure: "jaw_surgery", optimal_age_start: 10, optimal_age_end: 16, status: "future" },
    ],
    care_pathway: baseCarePathway,
    raw_inference_response: {
      classification: "positive",
      confidence: 0.91,
      severity: "moderate",
      variant: "unilateral_left",
      xai_regions: [
        { region: "left_ear", attention: 0.91 },
        { region: "left_jaw", attention: 0.78 },
        { region: "left_eye", attention: 0.54 },
        { region: "right_side", attention: 0.11 },
      ],
      segmentation: [
        { label: "microtia", side: "left", confidence: 0.89 },
        { label: "mandibular_hypoplasia", side: "left", confidence: 0.73 },
      ],
      comorbidity_flags: [
        { condition: "conductive_hearing_loss", risk: "high" },
        { condition: "vertebral_anomalies", risk: "medium" },
      ],
      surgical_windows: [
        { procedure: "ear_reconstruction", optimal_age_start: 6, optimal_age_end: 10, status: "upcoming" },
        { procedure: "jaw_surgery", optimal_age_start: 10, optimal_age_end: 16, status: "future" },
      ],
      care_pathway: baseCarePathway,
    },
    doctor_notes: "Follow ENT and ophthalmology review before next multidisciplinary board.",
    icd10_codes: ["Q87.0", "H90.2"],
    created_at: "2026-03-12T09:10:00.000Z",
  },
  {
    id: scanB,
    child_id: childB,
    doctor_id: doctorB,
    image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    classification: "inconclusive",
    confidence: 0.58,
    severity: "mild",
    variant: "bilateral",
    xai_data: [
      { region: "jawline", attention: 0.63 },
      { region: "eyes", attention: 0.55 },
      { region: "ears", attention: 0.44 },
    ],
    segmentation_data: [{ label: "facial_asymmetry", side: "bilateral", confidence: 0.62 }],
    comorbidity_flags: [
      { condition: "renal_anomalies", risk: "low" },
      { condition: "cardiac_defects", risk: "medium" },
    ],
    surgical_windows: [{ procedure: "orthodontic_review", optimal_age_start: 7, optimal_age_end: 12, status: "future" }],
    care_pathway: [
      { action: "Repeat scan with higher-quality clinical image", priority: "medium" },
      { action: "Monitor hearing and speech development", priority: "medium" },
    ],
    raw_inference_response: {
      classification: "inconclusive",
      confidence: 0.58,
      severity: "mild",
      variant: "bilateral",
      xai_regions: [
        { region: "jawline", attention: 0.63 },
        { region: "eyes", attention: 0.55 },
        { region: "ears", attention: 0.44 },
      ],
      segmentation: [{ label: "facial_asymmetry", side: "bilateral", confidence: 0.62 }],
      comorbidity_flags: [
        { condition: "renal_anomalies", risk: "low" },
        { condition: "cardiac_defects", risk: "medium" },
      ],
      surgical_windows: [{ procedure: "orthodontic_review", optimal_age_start: 7, optimal_age_end: 12, status: "future" }],
      care_pathway: [
        { action: "Repeat scan with higher-quality clinical image", priority: "medium" },
        { action: "Monitor hearing and speech development", priority: "medium" },
      ],
    },
    created_at: "2026-03-24T11:45:00.000Z",
  },
];

const referrals: ReferralRecord[] = [
  {
    id: referralA,
    scan_id: scanA,
    child_id: childA,
    from_doctor: doctorA,
    to_doctor: doctorB,
    specialty: "Ophthalmology",
    urgency: "urgent",
    status: "booked",
    appointment_date: "2026-04-17",
    notes: "Epibulbar dermoid review requested before surgical planning meeting.",
    created_at: "2026-03-15T08:20:00.000Z",
  },
];

const posts: CommunityPost[] = [
  {
    id: postA,
    author_id: parentA,
    title: "Preparing for our first craniofacial appointment",
    body: "What documents and questions should I bring to the specialist visit?",
    language: "en",
    replies_count: 1,
    created_at: "2026-03-21T07:10:00.000Z",
  },
];

const replies: CommunityReply[] = [
  {
    id: "reply_a",
    post_id: postA,
    author_id: doctorA,
    body: "Bring hearing reports, any cardiac workup, your scan summary, and photos showing progression over time.",
    language: "en",
    created_at: "2026-03-21T09:00:00.000Z",
  },
];

const notifications: AppNotification[] = [
  {
    id: "notif_a",
    user_id: doctorB,
    type: "referral",
    message: "New urgent ophthalmology referral received for Rafsan.",
    read: false,
    link: "/doctor/referrals",
    created_at: "2026-03-15T08:21:00.000Z",
  },
  {
    id: "notif_b",
    user_id: parentA,
    type: "appointment",
    message: "Rafsan's ophthalmology appointment was booked for 17 Apr 2026.",
    read: false,
    link: "/patient/dashboard",
    created_at: "2026-03-16T10:00:00.000Z",
  },
];

export const createDefaultDatabase = (): DatabaseState => ({
  accounts: [
    { id: doctorA, email: "doctor@goldenscope.ai", password: "Doctor123!", role: "doctor", createdAt: now() },
    { id: doctorB, email: "ophtha@goldenscope.ai", password: "Doctor123!", role: "doctor", createdAt: now() },
    { id: doctorC, email: "tutul@goldenscope.ai", password: "tutul123", role: "doctor", createdAt: now() },
    { id: doctorD, email: "naim@goldenscope.ai", password: "naim123", role: "doctor", createdAt: now() },
    { id: parentA, email: "parent@goldenscope.ai", password: "Parent123!", role: "parent", createdAt: now() },
    { id: parentB, email: "arnob@gmail.com", password: "arnob123", role: "parent", createdAt: now() },
    { id: parentC, email: "sadia@goldenscope.ai", password: "sadia123", role: "parent", createdAt: now() },
    { id: chwA, email: "chw@goldenscope.ai", password: "Chw12345!", role: "chw", createdAt: now() },
    { id: chwB, email: "nasif@goldenscope.ai", password: "nasif123", role: "chw", createdAt: now() },
    { id: adminA, email: "admin@goldenscope.ai", password: "Admin123!", role: "admin", createdAt: now() },
  ],
  profiles: structuredClone(profiles),
  children: structuredClone(children),
  scans: structuredClone(scans),
  referrals: structuredClone(referrals),
  posts: structuredClone(posts),
  replies: structuredClone(replies),
  notifications: structuredClone(notifications),
  session: null,
});

export const buildDemoNotification = (userId: string, type: string, message: string, link: string): AppNotification => ({
  id: makeId("notif"),
  user_id: userId,
  type,
  message,
  read: false,
  link,
  created_at: now(),
});

export const demoSummary = {
  stats: [
    { label: "1 in 3,500 children", value: 3500 },
    { label: "<60s triage time", value: 60 },
    { label: "87% screening accuracy", value: 87 },
  ],
  howItWorks: [
    { step: "01", title: "Capture or upload a clinical image", description: "Parents, CHWs, and doctors can upload a facial, ear, ocular, dental, or vertebral image securely." },
    { step: "02", title: "AI triage + explainability", description: "GoldenScope AI estimates class, confidence, severity, anatomical attention, and likely care steps." },
    { step: "03", title: "Coordinate pediatric care", description: "Doctors can issue referrals, track appointments, and follow surgical windows from one shared dashboard." },
  ],
};

export const sampleReferralLetter = (childName: string, severity: string, variant: string) => `Dear colleague,\n\nPlease review ${childName} for Goldenhar-related findings. The latest scan indicates ${severity} severity with a ${variant.replaceAll("_", " ")} presentation. Key concerns include hearing, ophthalmic, and craniofacial follow-up needs.\n\nRecommended next steps:\n- Confirm phenotype clinically\n- Review comorbidity flags\n- Align surgical timing with age windows\n\nRegards,\nGoldenScope AI clinical workflow`;
