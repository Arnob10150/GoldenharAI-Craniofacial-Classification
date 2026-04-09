import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import type { LanguagePref } from "@/shared/lib/types";

export const LANGUAGE_STORAGE_KEY = "goldenscope-language";

const resources = {
  en: {
    translation: {
      common: {
        appName: "GoldenScope AI",
        tagline: "Pediatric detection and care platform",
        home: "Home",
        dashboard: "Dashboard",
        login: "Log in",
        signup: "Sign up",
        logout: "Sign out",
        patientPortal: "Patient portal",
        clinicalDashboard: "Clinical dashboard",
        children: "Children",
        patients: "Patients",
        childProfiles: "Child profiles",
        scanHistory: "Scan history",
        referrals: "Referrals",
        analytics: "Analytics",
        newScan: "New scan",
        submitScan: "Submit scan",
        close: "Close",
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        filters: "Filters",
        loading: "Loading",
        notifications: "Notifications",
        noNotifications: "No notifications yet.",
        language: "Language",
        theme: "Theme",
        english: "English",
        bangla: "Bangla",
        child: "Child",
        patient: "Patient",
        severity: "Severity",
        confidence: "Confidence",
        classification: "Classification",
        variant: "Variant",
        sex: "Sex",
        specialty: "Specialty",
        status: "Status",
        urgency: "Urgency",
        district: "District",
        role: "Role",
        fullName: "Full name",
        email: "Email",
        password: "Password",
        institution: "Institution",
        preferredLanguage: "Preferred language",
        dateOfBirth: "Date of birth",
        actions: "Actions",
        unknown: "Unknown",
        pending: "Pending",
        noScans: "No scans",
        notAssigned: "Not assigned",
        notBooked: "Not booked",
        notScheduled: "Not scheduled",
        all: "All",
      },
      nav: {
        authenticatedDescription: "Access your authenticated workspace and care tools.",
        guestDescription: "Move into the parent or clinical portal.",
        workspace: "{{role}} workspace",
        profileRecords: "Profile & records",
        careWorkflows: "Care workflows",
      },
      labels: {
        role: {
          parent: "Parent",
          doctor: "Doctor",
          chw: "Community health worker",
          admin: "Admin",
        },
        sex: {
          male: "Male",
          female: "Female",
        },
        status: {
          positive: "Positive",
          negative: "Negative",
          inconclusive: "Inconclusive",
          mild: "Mild",
          moderate: "Moderate",
          severe: "Severe",
          low: "Low",
          medium: "Medium",
          high: "High",
          urgent: "Urgent",
          routine: "Routine",
          emergency: "Emergency",
          sent: "Sent",
          accepted: "Accepted",
          booked: "Booked",
          completed: "Completed",
          upcoming: "Upcoming",
          future: "Future",
          current: "Current",
          pending: "Pending",
        },
        variant: {
          unilateral_left: "Unilateral left",
          unilateral_right: "Unilateral right",
          bilateral: "Bilateral",
        },
        specialty: {
          ENT: "ENT",
          Ophthalmology: "Ophthalmology",
          Cardiology: "Cardiology",
          Genetics: "Genetics",
          Neurology: "Neurology",
          Craniofacial: "Craniofacial",
          Audiology: "Audiology",
        },
      },
      themeToggle: {
        toggle: "Toggle theme",
      },
      languageToggle: {
        shortBangla: "বাং",
      },
      toast: {
        signedOut: "Signed out successfully.",
        welcomeBack: "Welcome back to GoldenScope AI.",
        accountCreated: "Account created successfully.",
        scanComplete: "Scan complete. Opening the result board.",
        clinicalResultReady: "Clinical result ready. Opening the full result board.",
        referralSent: "Referral sent successfully.",
        notesUpdated: "Clinical notes updated.",
        postPublished: "Post published.",
        replyPosted: "Reply posted.",
        childCreated: "Child profile created.",
        childUpdated: "Child profile updated.",
        childDeleted: "Child profile deleted.",
        uploadBeforeSubmit: "Upload an image before submitting.",
        uploadPatientImage: "Upload a patient image before running analysis.",
      },
      uploadDropzone: {
        title: "Drag and drop a clinical image",
        description: "JPG, PNG, or HEIC. Clear views of facial, ear, ocular, dental, or vertebral findings work best.",
        chooseFile: "Choose file",
        uploadError: "Image upload failed. Use a JPG, PNG, or HEIC file under 10 MB.",
      },
      specialistFinder: {
        title: "Specialist centers",
        description: "Recommended centers near {{district}} for Goldenhar-related follow-up.",
        yourRegion: "your region",
        centersCount: "{{count}} centers",
        empty: "No centers match the current district filter. Try Dhaka, Chattogram, or remove the specialty filter.",
        footer: "District coordinates loaded for {{count}} Bangladesh districts. This list can be connected to live referral directories later.",
      },
    },
  },
  bn: {
    translation: {
      common: {
        appName: "গোল্ডেনস্কোপ এআই",
        tagline: "শিশু শনাক্তকরণ ও পরিচর্যা প্ল্যাটফর্ম",
        home: "হোম",
        dashboard: "ড্যাশবোর্ড",
        login: "লগ ইন",
        signup: "সাইন আপ",
        logout: "সাইন আউট",
        patientPortal: "রোগী পোর্টাল",
        clinicalDashboard: "ক্লিনিক্যাল ড্যাশবোর্ড",
        children: "শিশুরা",
        patients: "রোগীরা",
        childProfiles: "শিশুর প্রোফাইল",
        scanHistory: "স্ক্যান ইতিহাস",
        referrals: "রেফারাল",
        analytics: "অ্যানালিটিক্স",
        newScan: "নতুন স্ক্যান",
        submitScan: "স্ক্যান জমা দিন",
        close: "বন্ধ করুন",
        save: "সংরক্ষণ করুন",
        cancel: "বাতিল",
        edit: "সম্পাদনা",
        delete: "মুছুন",
        filters: "ফিল্টার",
        loading: "লোড হচ্ছে",
        notifications: "নোটিফিকেশন",
        noNotifications: "এখনও কোনো নোটিফিকেশন নেই।",
        language: "ভাষা",
        theme: "থিম",
        english: "English",
        bangla: "বাংলা",
        child: "শিশু",
        patient: "রোগী",
        severity: "তীব্রতা",
        confidence: "নিশ্চয়তা",
        classification: "শ্রেণিবিন্যাস",
        variant: "ধরণ",
        sex: "লিঙ্গ",
        specialty: "বিশেষত্ব",
        status: "অবস্থা",
        urgency: "জরুরিতা",
        district: "জেলা",
        role: "ভূমিকা",
        fullName: "পূর্ণ নাম",
        email: "ইমেইল",
        password: "পাসওয়ার্ড",
        institution: "প্রতিষ্ঠান",
        preferredLanguage: "পছন্দের ভাষা",
        dateOfBirth: "জন্মতারিখ",
        actions: "অ্যাকশন",
        unknown: "অজানা",
        pending: "অপেক্ষমাণ",
        noScans: "কোনো স্ক্যান নেই",
        notAssigned: "নির্ধারিত নয়",
        notBooked: "বুক করা হয়নি",
        notScheduled: "নির্ধারিত নয়",
        all: "সব",
      },
      nav: {
        authenticatedDescription: "আপনার সুরক্ষিত ওয়ার্কস্পেস এবং পরিচর্যার টুলে যান।",
        guestDescription: "প্যারেন্ট বা ক্লিনিক্যাল পোর্টালে যান।",
        workspace: "{{role}} ওয়ার্কস্পেস",
        profileRecords: "প্রোফাইল ও রেকর্ড",
        careWorkflows: "কেয়ার ওয়ার্কফ্লো",
      },
      labels: {
        role: {
          parent: "অভিভাবক",
          doctor: "ডাক্তার",
          chw: "কমিউনিটি স্বাস্থ্যকর্মী",
          admin: "অ্যাডমিন",
        },
        sex: {
          male: "পুরুষ",
          female: "মহিলা",
        },
        status: {
          positive: "পজিটিভ",
          negative: "নেগেটিভ",
          inconclusive: "অনির্ণায়ক",
          mild: "মৃদু",
          moderate: "মাঝারি",
          severe: "তীব্র",
          low: "কম",
          medium: "মাঝারি",
          high: "উচ্চ",
          urgent: "জরুরি",
          routine: "রুটিন",
          emergency: "ইমার্জেন্সি",
          sent: "পাঠানো হয়েছে",
          accepted: "গৃহীত",
          booked: "বুকড",
          completed: "সম্পন্ন",
          upcoming: "আসন্ন",
          future: "ভবিষ্যৎ",
          current: "বর্তমান",
          pending: "অপেক্ষমাণ",
        },
        variant: {
          unilateral_left: "একপাশে বাম",
          unilateral_right: "একপাশে ডান",
          bilateral: "দুইপাশে",
        },
        specialty: {
          ENT: "ইএনটি",
          Ophthalmology: "চক্ষু বিভাগ",
          Cardiology: "কার্ডিওলজি",
          Genetics: "জেনেটিক্স",
          Neurology: "নিউরোলজি",
          Craniofacial: "ক্রেনিওফেশিয়াল",
          Audiology: "অডিওলজি",
        },
      },
      themeToggle: {
        toggle: "থিম পরিবর্তন করুন",
      },
      languageToggle: {
        shortBangla: "বাং",
      },
      toast: {
        signedOut: "সফলভাবে সাইন আউট হয়েছে।",
        welcomeBack: "গোল্ডেনস্কোপ এআই-এ আবার স্বাগতম।",
        accountCreated: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।",
        scanComplete: "স্ক্যান সম্পন্ন হয়েছে। রেজাল্ট বোর্ড খোলা হচ্ছে।",
        clinicalResultReady: "ক্লিনিক্যাল ফলাফল প্রস্তুত। পূর্ণ ফলাফল বোর্ড খোলা হচ্ছে।",
        referralSent: "রেফারাল সফলভাবে পাঠানো হয়েছে।",
        notesUpdated: "ক্লিনিক্যাল নোট আপডেট হয়েছে।",
        postPublished: "পোস্ট প্রকাশ করা হয়েছে।",
        replyPosted: "উত্তর পোস্ট করা হয়েছে।",
        childCreated: "শিশুর প্রোফাইল তৈরি হয়েছে।",
        childUpdated: "শিশুর প্রোফাইল আপডেট হয়েছে।",
        childDeleted: "শিশুর প্রোফাইল মুছে ফেলা হয়েছে।",
        uploadBeforeSubmit: "জমা দেওয়ার আগে একটি ছবি আপলোড করুন।",
        uploadPatientImage: "বিশ্লেষণ চালানোর আগে রোগীর ছবি আপলোড করুন।",
      },
      uploadDropzone: {
        title: "একটি ক্লিনিক্যাল ছবি ড্র্যাগ করে আনুন",
        description: "JPG, PNG বা HEIC ফাইল ব্যবহার করুন। মুখমণ্ডল, কান, চোখ, দাঁত বা মেরুদণ্ডের পরিষ্কার ছবি সবচেয়ে ভালো কাজ করে।",
        chooseFile: "ফাইল বেছে নিন",
        uploadError: "ছবি আপলোড ব্যর্থ হয়েছে। ১০ এমবির কম JPG, PNG বা HEIC ফাইল ব্যবহার করুন।",
      },
      specialistFinder: {
        title: "বিশেষজ্ঞ কেন্দ্র",
        description: "গোল্ডেনহার-সম্পর্কিত ফলো-আপের জন্য {{district}} এর কাছাকাছি প্রস্তাবিত কেন্দ্রসমূহ।",
        yourRegion: "আপনার এলাকা",
        centersCount: "{{count}} টি কেন্দ্র",
        empty: "বর্তমান জেলা ফিল্টারের সাথে কোনো কেন্দ্র মেলেনি। ঢাকা, চট্টগ্রাম চেষ্টা করুন অথবা বিশেষত্ব ফিল্টার সরিয়ে দিন।",
        footer: "বাংলাদেশের {{count}} টি জেলার কোঅর্ডিনেট লোড করা হয়েছে। ভবিষ্যতে এই তালিকা লাইভ রেফারাল ডিরেক্টরির সাথে যুক্ত করা যাবে।",
      },
    },
  },
} as const;

const extendedResources = {
  en: {
    translation: {
      toast: {
        ...resources.en.translation.toast,
        unableToSignIn: "Unable to sign in.",
      },
      landing: {
        headline: "AI-assisted platform for Goldenhar screening and pediatric care coordination",
        subheadline: "A two-sided clinical platform for early triage, specialist referral, and longitudinal care management.",
        checkChild: "Check a child",
        dashboard: "Open dashboard",
        howItWorks: "How it works",
      },
      analysis: {
        inputTitle: "Input image and AI summary",
        inputDescription: "Review the uploaded scan together with the core diagnostic labels before moving into full explainability.",
        patientAgeContext: "Patient age: {{age}} years.",
        higherConfidence: "Higher confidence means the model found stronger visual signals aligned with the predicted Goldenhar pattern.",
        segmentationTitle: "Segmentation findings",
        segmentationDescription: "Detected craniofacial regions and the model confidence for each localized finding.",
        explainabilityTitle: "Explainability attention map",
        explainabilityDescription: "Relative attention across anatomical regions used by the model during classification.",
        comorbidityTitle: "Comorbidity risk profile",
        comorbidityDescription: "Flagged associated risks based on the current scan and the predicted care pathway.",
      },
      scanPanel: {
        latestResult: "Latest result for {{name}}",
        confidenceVariant: "Confidence {{confidence}}% with {{variant}} variant.",
        explainabilityRegions: "Explainability regions",
        explainabilityRegionsDescription: "Higher attention suggests the model relied more heavily on those regions.",
        carePathway: "Care pathway",
        carePathwayDescription: "Recommended next steps in order of clinical priority.",
        comorbidityRisks: "Comorbidity risks",
        condition: "Condition",
        risk: "Risk",
        surgicalWindows: "Surgical timing windows",
        surgicalWindowsDescription: "Suggested age windows for intervention planning based on the predicted presentation.",
        optimalAge: "Optimal age: {{start}}-{{end}} years",
        actions: "Actions",
        patientReport: "Patient report",
        clinicalReport: "Clinical report",
        findSpecialist: "Find specialist",
        currentReferral: "Current referral",
      },
    },
  },
  bn: {
    translation: {
      toast: {
        ...resources.bn.translation.toast,
        unableToSignIn: "লগ ইন করা যায়নি।",
      },
      landing: {
        headline: "গোল্ডেনহার স্ক্রিনিং ও শিশু পরিচর্যা সমন্বয়ের জন্য এআই-সহায়ক প্ল্যাটফর্ম",
        subheadline: "প্রাথমিক ট্রায়াজ, বিশেষজ্ঞ রেফারাল এবং দীর্ঘমেয়াদি পরিচর্যা ব্যবস্থাপনার জন্য একটি দ্বিমুখী ক্লিনিক্যাল প্ল্যাটফর্ম।",
        checkChild: "শিশু পরীক্ষা করুন",
        dashboard: "ড্যাশবোর্ড খুলুন",
        howItWorks: "কীভাবে কাজ করে",
      },
      analysis: {
        inputTitle: "ইনপুট ছবি ও এআই সারাংশ",
        inputDescription: "পূর্ণ ব্যাখ্যাযোগ্য ফলাফলে যাওয়ার আগে আপলোড করা স্ক্যান এবং মূল ডায়াগনস্টিক লেবেল পর্যালোচনা করুন।",
        patientAgeContext: "রোগীর বয়স: {{age}} বছর।",
        higherConfidence: "উচ্চ কনফিডেন্স মানে মডেল প্রত্যাশিত গোল্ডেনহার প্যাটার্নের সঙ্গে মিল রাখা অধিক ভিজ্যুয়াল সিগন্যাল পেয়েছে।",
        segmentationTitle: "সেগমেন্টেশন ফাইন্ডিংস",
        segmentationDescription: "স্থানীয় ক্রেনিওফেশিয়াল ফাইন্ডিং এবং প্রতিটির জন্য মডেলের কনফিডেন্স।",
        explainabilityTitle: "এক্সপ্লেনেবিলিটি অ্যাটেনশন ম্যাপ",
        explainabilityDescription: "শ্রেণিবিন্যাসের সময় মডেল যে অ্যানাটমিক অঞ্চলগুলোর উপর বেশি নির্ভর করেছে তার আপেক্ষিক চিত্র।",
        comorbidityTitle: "কোমরবিডিটি রিস্ক প্রোফাইল",
        comorbidityDescription: "বর্তমান স্ক্যান এবং প্রত্যাশিত কেয়ার পাথওয়ের ভিত্তিতে ফ্ল্যাগ করা সংশ্লিষ্ট ঝুঁকিগুলো।",
      },
      scanPanel: {
        latestResult: "{{name}}-এর সর্বশেষ ফলাফল",
        confidenceVariant: "{{variant}} ধরনের সাথে কনফিডেন্স {{confidence}}%।",
        explainabilityRegions: "এক্সপ্লেনেবিলিটি অঞ্চল",
        explainabilityRegionsDescription: "উচ্চ অ্যাটেনশন মানে মডেল সেই অঞ্চলের উপর বেশি নির্ভর করেছে।",
        carePathway: "কেয়ার পাথওয়ে",
        carePathwayDescription: "ক্লিনিক্যাল অগ্রাধিকার অনুযায়ী সাজেস্ট করা পরবর্তী পদক্ষেপগুলো।",
        comorbidityRisks: "কোমরবিডিটি রিস্ক",
        condition: "অবস্থা",
        risk: "ঝুঁকি",
        surgicalWindows: "সার্জিকাল টাইমিং উইন্ডো",
        surgicalWindowsDescription: "প্রত্যাশিত ক্লিনিক্যাল প্রেজেন্টেশনের ভিত্তিতে ইন্টারভেনশন পরিকল্পনার জন্য প্রস্তাবিত বয়সসীমা।",
        optimalAge: "উপযুক্ত বয়স: {{start}}-{{end}} বছর",
        actions: "অ্যাকশন",
        patientReport: "পেশেন্ট রিপোর্ট",
        clinicalReport: "ক্লিনিক্যাল রিপোর্ট",
        findSpecialist: "বিশেষজ্ঞ খুঁজুন",
        currentReferral: "বর্তমান রেফারাল",
      },
    },
  },
} as const;

const mergedResources = {
  en: {
    translation: {
      ...resources.en.translation,
      ...extendedResources.en.translation,
    },
  },
  bn: {
    translation: {
      ...resources.bn.translation,
      ...extendedResources.bn.translation,
    },
  },
} as const;

export const normalizeLanguage = (language?: string | null): LanguagePref => {
  if (!language) return "en";
  return language.toLowerCase().startsWith("bn") ? "bn" : "en";
};

const fallbackCommonLabel = (value: string) => {
  const normalized = value.toLowerCase().replaceAll(" ", "_");
  if (normalized === "no_scans") return i18n.t("common.noScans");
  if (normalized === "not_assigned") return i18n.t("common.notAssigned");
  if (normalized === "not_booked") return i18n.t("common.notBooked");
  if (normalized === "not_scheduled") return i18n.t("common.notScheduled");
  return null;
};

const humanize = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getStoredLanguage = (): LanguagePref | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "bn" || stored === "en" ? stored : null;
};

export const persistLanguage = (language: LanguagePref) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: mergedResources,
  supportedLngs: ["en", "bn"],
  fallbackLng: "en",
  lng: getStoredLanguage() ?? undefined,
  load: "languageOnly",
  detection: {
    order: ["localStorage", "htmlTag", "navigator"],
    lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    caches: ["localStorage"],
  },
  interpolation: { escapeValue: false },
});

export const translateStatusLabel = (value: string) =>
  fallbackCommonLabel(value) ?? i18n.t(`labels.status.${value}`, { defaultValue: humanize(value) });

export const translateVariantLabel = (value: string) =>
  i18n.t(`labels.variant.${value}`, { defaultValue: humanize(value) });

export const translateSexLabel = (value: string) =>
  i18n.t(`labels.sex.${value}`, { defaultValue: humanize(value) });

export const translateRoleLabel = (value: string) =>
  i18n.t(`labels.role.${value}`, { defaultValue: humanize(value) });

export const translateSpecialtyLabel = (value: string) =>
  i18n.t(`labels.specialty.${value}`, { defaultValue: value });

export default i18n;
