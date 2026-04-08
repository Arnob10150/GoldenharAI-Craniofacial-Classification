import { buildDemoNotification, createDefaultDatabase, sampleReferralLetter } from "@/shared/lib/mock-data";
import { requestInference } from "@/shared/lib/inference";
import { isSupabaseConfigured, storageBucketName, supabase } from "@/shared/lib/supabase";
import type {
  AppNotification,
  AuthPayload,
  Child,
  ChildPayload,
  CommunityPost,
  CommunityReply,
  DatabaseState,
  NewScanPayload,
  NotificationEvent,
  PostPayload,
  Profile,
  ReferralPayload,
  ReferralRecord,
  RegisterPayload,
  ReplyPayload,
  ScanRecord,
  Specialty,
} from "@/shared/lib/types";

const DB_KEY = "goldenscope-ai:db";
const EVENT_KEY = "goldenscope-ai:event";
const CHANNEL_NAME = "goldenscope-ai-realtime";
const SESSION_COOKIE_KEY = "goldenscope_session";
const SESSION_EVENT_NAME = "goldenscope-ai-session";
const hasWindow = typeof window !== "undefined";
const mockChannel =
  hasWindow && "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
const profileNameCache = new Map<string, string>();
const childNameCache = new Map<string, string>();

export interface SessionBundle {
  userId: string;
  email: string;
  profile: Profile;
}

const nowIso = () => new Date().toISOString();
export const MAX_CHILD_AGE = 18;
export const MIN_CHILD_AGE = 0;

const cacheProfiles = (profiles: Array<{ id: string; full_name?: string | null }>) => {
  profiles.forEach((profile) => {
    if (profile.id && profile.full_name) {
      profileNameCache.set(profile.id, profile.full_name);
    }
  });
};

const cacheChildren = (children: Array<{ id: string; name?: string | null }>) => {
  children.forEach((child) => {
    if (child.id && child.name) {
      childNameCache.set(child.id, child.name);
    }
  });
};

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);
export const getTodayInputDate = () => toInputDate(new Date());
export const getOldestAllowedDob = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - MAX_CHILD_AGE);
  return toInputDate(date);
};

const makeId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
export const calculateAge = (dob: string) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

export const isValidPediatricDob = (dob: string) => {
  if (!dob) return false;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  if (birth > today) return false;
  const age = calculateAge(dob);
  return age >= MIN_CHILD_AGE && age <= MAX_CHILD_AGE;
};

const assertPediatricDob = (dob: string) => {
  if (!isValidPediatricDob(dob)) {
    throw new Error(`Only pediatric patients aged ${MIN_CHILD_AGE}-${MAX_CHILD_AGE} years are allowed.`);
  }
};

const setSessionCookie = (userId: string | null) => {
  if (!hasWindow) return;
  if (!userId) {
    document.cookie = `${SESSION_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  const oneWeek = 60 * 60 * 24 * 7;
  document.cookie = `${SESSION_COOKIE_KEY}=${encodeURIComponent(userId)}; path=/; max-age=${oneWeek}; SameSite=Lax`;
};

const getSessionCookie = () => {
  if (!hasWindow) return null;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SESSION_COOKIE_KEY}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const emitSessionEvent = (bundle: SessionBundle | null) => {
  if (!hasWindow) return;
  window.dispatchEvent(new CustomEvent<SessionBundle | null>(SESSION_EVENT_NAME, { detail: bundle }));
};

const readMockDb = (): DatabaseState => {
  if (!hasWindow) return createDefaultDatabase();
  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = createDefaultDatabase();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as DatabaseState;
    const seeded = createDefaultDatabase();
    const normalized: DatabaseState = {
      ...parsed,
      accounts: [
        ...parsed.accounts,
        ...seeded.accounts.filter(
          (seedAccount) => !parsed.accounts.some((account) => account.id === seedAccount.id || account.email === seedAccount.email),
        ),
      ],
      profiles: [
        ...parsed.profiles,
        ...seeded.profiles.filter((seedProfile) => !parsed.profiles.some((profile) => profile.id === seedProfile.id)),
      ],
    };
    if (
      normalized.accounts.length !== parsed.accounts.length ||
      normalized.profiles.length !== parsed.profiles.length
    ) {
      window.localStorage.setItem(DB_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    const seeded = createDefaultDatabase();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const persistMockDb = (db: DatabaseState, event?: NotificationEvent) => {
  if (!hasWindow) return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  if (event) {
    window.localStorage.setItem(EVENT_KEY, JSON.stringify({ ...event, ts: Date.now() }));
    mockChannel?.postMessage(event);
    window.dispatchEvent(new CustomEvent<NotificationEvent>(CHANNEL_NAME, { detail: event }));
  }
};

const updateMockDb = (
  updater: (draft: DatabaseState) => DatabaseState,
  event?: NotificationEvent,
) => {
  const next = updater(readMockDb());
  persistMockDb(next, event);
  return next;
};

export const subscribeToRealtimeEvents = (listener: (event: NotificationEvent) => void) => {
  const onStorage = (storageEvent: StorageEvent) => {
    if (storageEvent.key !== EVENT_KEY || !storageEvent.newValue) return;
    try {
      const payload = JSON.parse(storageEvent.newValue) as NotificationEvent;
      listener(payload);
    } catch {
      // noop
    }
  };

  const onLocalEvent = (event: Event) => {
    const customEvent = event as CustomEvent<NotificationEvent>;
    listener(customEvent.detail);
  };

  const onMessage = (message: MessageEvent<NotificationEvent>) => listener(message.data);

  if (hasWindow) {
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANNEL_NAME, onLocalEvent as EventListener);
  }
  mockChannel?.addEventListener("message", onMessage as EventListener);

  return () => {
    if (hasWindow) {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANNEL_NAME, onLocalEvent as EventListener);
    }
    mockChannel?.removeEventListener("message", onMessage as EventListener);
  };
};

const getMockProfile = (userId: string) => readMockDb().profiles.find((profile) => profile.id === userId) ?? null;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const uploadScanImage = async (file: File): Promise<string> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const path = `scans/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from(storageBucketName).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (!error) {
        const { data } = supabase.storage.from(storageBucketName).getPublicUrl(path);
        return data.publicUrl;
      }
    } catch {
      // fall back to local data URL
    }
  }
  return fileToDataUrl(file);
};

const roleCanSeeChild = (profile: Profile, child: Child) => {
  if (profile.role === "admin" || profile.role === "chw") return true;
  if (profile.role === "parent") return child.parent_id === profile.id;
  if (profile.role === "doctor") return child.assigned_doctor === profile.id;
  return false;
};

const roleCanSeeScan = (profile: Profile, child: Child, scan: ScanRecord) => {
  if (profile.role === "admin" || profile.role === "chw") return true;
  if (profile.role === "parent") return child.parent_id === profile.id;
  if (profile.role === "doctor") {
    return child.assigned_doctor === profile.id || scan.doctor_id === profile.id;
  }
  return false;
};

const pushMockNotification = (notification: AppNotification, event?: NotificationEvent) => {
  updateMockDb(
    (draft) => ({
      ...draft,
      notifications: [notification, ...draft.notifications],
    }),
    event ?? { entity: "notifications", userId: notification.user_id, recordId: notification.id },
  );
};

const fallbackToMock = async <T>(work: () => Promise<T>, fallback: () => Promise<T>) => {
  try {
    return await work();
  } catch {
    return fallback();
  }
};

export const bootstrapSession = async (): Promise<SessionBundle | null> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (!profile) return null;
        cacheProfiles([profile as Profile]);
        setSessionCookie(user.id);
        return { userId: user.id, email: user.email ?? "", profile: profile as Profile };
      },
      async () => {
        const db = readMockDb();
        if (!db.session) return null;
        const account = db.accounts.find((entry) => entry.id === db.session?.userId);
        const profile = db.profiles.find((entry) => entry.id === db.session?.userId);
        return account && profile ? { userId: account.id, email: account.email, profile } : null;
      },
    );
  }

  const db = readMockDb();
  const cookieUserId = getSessionCookie();
  const activeUserId = db.session?.userId ?? cookieUserId ?? null;
  if (!activeUserId) return null;
  const account = db.accounts.find((entry) => entry.id === activeUserId);
  const profile = db.profiles.find((entry) => entry.id === activeUserId);
  if (account && profile && db.session?.userId !== activeUserId) {
    persistMockDb({ ...db, session: { userId: activeUserId } });
  }
  return account && profile ? { userId: account.id, email: account.email, profile } : null;
};

export const subscribeToSessionChanges = (listener: (bundle: SessionBundle | null) => void) => {
  if (isSupabaseConfigured && supabase) {
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setSessionCookie(null);
        listener(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setSessionCookie(session.user.id);
      if (profile) {
        cacheProfiles([profile as Profile]);
      }
      listener(
        profile
          ? {
              userId: session.user.id,
              email: session.user.email ?? "",
              profile: profile as Profile,
            }
          : null,
      );
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }

  if (!hasWindow) return () => undefined;
  const onSessionEvent = (event: Event) => {
    const customEvent = event as CustomEvent<SessionBundle | null>;
    listener(customEvent.detail);
  };
  window.addEventListener(SESSION_EVENT_NAME, onSessionEvent as EventListener);
  return () => {
    window.removeEventListener(SESSION_EVENT_NAME, onSessionEvent as EventListener);
  };
};

export const signIn = async (payload: AuthPayload): Promise<SessionBundle> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: payload.email,
          password: payload.password,
        });
        if (error || !data.user) throw error;
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        if (!profile) throw new Error("Profile not found");
        cacheProfiles([profile as Profile]);
        const bundle = { userId: data.user.id, email: data.user.email ?? payload.email, profile: profile as Profile };
        setSessionCookie(data.user.id);
        emitSessionEvent(bundle);
        return bundle;
      },
      async () => signInMock(payload),
    );
  }
  return signInMock(payload);
};

const signInMock = async (payload: AuthPayload): Promise<SessionBundle> => {
  const db = readMockDb();
  const account = db.accounts.find(
    (entry) => entry.email.toLowerCase() === payload.email.toLowerCase() && entry.password === payload.password,
  );
  if (!account) throw new Error("Invalid email or password");
  const profile = db.profiles.find((entry) => entry.id === account.id);
  if (!profile) throw new Error("Profile not found");
  const next = { ...db, session: { userId: account.id } };
  persistMockDb(next, { entity: "notifications", userId: account.id });
  const bundle = { userId: account.id, email: account.email, profile };
  setSessionCookie(account.id);
  emitSessionEvent(bundle);
  return bundle;
};

export const signUp = async (payload: RegisterPayload): Promise<SessionBundle> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
        });
        if (error || !data.user) throw error;
        const profile: Profile = {
          id: data.user.id,
          full_name: payload.fullName,
          role: payload.role,
          institution: payload.institution,
          district: payload.district,
          language_pref: payload.languagePref,
          specialty: payload.specialty ?? null,
          created_at: nowIso(),
        };
        await supabase.from("profiles").upsert(profile);
        cacheProfiles([profile]);
        const bundle = { userId: data.user.id, email: payload.email, profile };
        setSessionCookie(data.user.id);
        emitSessionEvent(bundle);
        return bundle;
      },
      async () => signUpMock(payload),
    );
  }
  return signUpMock(payload);
};

const signUpMock = async (payload: RegisterPayload): Promise<SessionBundle> => {
  const db = readMockDb();
  if (db.accounts.some((entry) => entry.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new Error("An account with this email already exists");
  }
  const id = makeId("user");
  const profile: Profile = {
    id,
    full_name: payload.fullName,
    role: payload.role,
    institution: payload.institution,
    district: payload.district,
    language_pref: payload.languagePref,
    specialty: payload.specialty ?? null,
    created_at: nowIso(),
  };
  const next = {
    ...db,
    accounts: [
      ...db.accounts,
      { id, email: payload.email, password: payload.password, role: payload.role, createdAt: nowIso() },
    ],
    profiles: [...db.profiles, profile],
    session: { userId: id },
  };
  persistMockDb(next);
  const bundle = { userId: id, email: payload.email, profile };
  setSessionCookie(id);
  emitSessionEvent(bundle);
  return bundle;
};

export const signOut = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // noop
    }
  }
  const db = readMockDb();
  persistMockDb({ ...db, session: null });
  setSessionCookie(null);
  emitSessionEvent(null);
};

export const saveProfile = async (profile: Profile): Promise<Profile> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase.from("profiles").upsert(profile).select().single();
        const saved = (data as Profile) ?? profile;
        cacheProfiles([saved]);
        return saved;
      },
      async () => saveProfileMock(profile),
    );
  }
  return saveProfileMock(profile);
};

const saveProfileMock = async (profile: Profile) => {
  cacheProfiles([profile]);
  updateMockDb((draft) => ({
    ...draft,
    profiles: draft.profiles.some((entry) => entry.id === profile.id)
      ? draft.profiles.map((entry) => (entry.id === profile.id ? profile : entry))
      : [...draft.profiles, profile],
  }));
  return profile;
};

export const listDoctors = async (specialty?: Specialty | null): Promise<Profile[]> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        let query = supabase.from("profiles").select("*").eq("role", "doctor");
        if (specialty) query = query.eq("specialty", specialty);
        const { data } = await query.order("full_name", { ascending: true });
        const rows = (data as Profile[]) ?? [];
        cacheProfiles(rows);
        return rows;
      },
      async () => listDoctorsMock(specialty),
    );
  }
  return listDoctorsMock(specialty);
};

const listDoctorsMock = async (specialty?: Specialty | null) =>
  readMockDb().profiles.filter(
    (profile) => profile.role === "doctor" && (!specialty || profile.specialty === specialty),
  );

export const listChildren = async (profile: Profile): Promise<Child[]> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        if (profile.role === "admin" || profile.role === "chw") {
          const { data } = await supabase.from("children").select("*").order("created_at", { ascending: false });
          const rows = (data as Child[]) ?? [];
          cacheChildren(rows);
          return rows;
        }
        if (profile.role === "doctor") {
          const { data } = await supabase
            .from("children")
            .select("*")
            .eq("assigned_doctor", profile.id)
            .order("created_at", { ascending: false });
          const rows = (data as Child[]) ?? [];
          cacheChildren(rows);
          return rows;
        }
        const { data } = await supabase
          .from("children")
          .select("*")
          .eq("parent_id", profile.id)
          .order("created_at", { ascending: false });
        const rows = (data as Child[]) ?? [];
        cacheChildren(rows);
        return rows;
      },
      async () => listChildrenMock(profile),
    );
  }
  return listChildrenMock(profile);
};

const listChildrenMock = async (profile: Profile) => {
  const rows = readMockDb().children.filter((child) => roleCanSeeChild(profile, child));
  cacheChildren(rows);
  return rows;
};

export const upsertChild = async (profile: Profile, payload: ChildPayload): Promise<Child> => {
  assertPediatricDob(payload.dob);
  const existing = payload.id ? await getChildById(payload.id) : null;
  const child: Child = {
    id: payload.id ?? makeId("child"),
    parent_id: existing?.parent_id ?? profile.id,
    name: payload.name,
    dob: payload.dob,
    sex: payload.sex,
    assigned_doctor: payload.assigned_doctor ?? (profile.role === "doctor" ? profile.id : null),
    created_at: existing?.created_at ?? nowIso(),
  };

  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase.from("children").upsert(child).select().single();
        const saved = (data as Child) ?? child;
        cacheChildren([saved]);
        return saved;
      },
      async () => upsertChildMock(child),
    );
  }
  return upsertChildMock(child);
};

const upsertChildMock = async (child: Child) => {
  cacheChildren([child]);
  updateMockDb((draft) => ({
    ...draft,
    children: draft.children.some((entry) => entry.id === child.id)
      ? draft.children.map((entry) => (entry.id === child.id ? child : entry))
      : [child, ...draft.children],
  }), { entity: "children", userId: child.parent_id, recordId: child.id });
  return child;
};

export const deleteChildProfile = async (profile: Profile, childId: string) => {
  const child = await getChildById(childId);
  if (!child || !roleCanSeeChild(profile, child)) {
    throw new Error("Child profile not found or access denied.");
  }

  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        await supabase.from("children").delete().eq("id", childId);
        childNameCache.delete(childId);
        return childId;
      },
      async () => deleteChildProfileMock(childId, child.parent_id),
    );
  }

  return deleteChildProfileMock(childId, child.parent_id);
};

const deleteChildProfileMock = async (childId: string, userId?: string) => {
  childNameCache.delete(childId);
  updateMockDb(
    (draft) => ({
      ...draft,
      children: draft.children.filter((entry) => entry.id !== childId),
      scans: draft.scans.filter((entry) => entry.child_id !== childId),
      referrals: draft.referrals.filter((entry) => entry.child_id !== childId),
    }),
    { entity: "children", userId, recordId: childId },
  );
  return childId;
};

export const getChildById = async (childId: string) => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase.from("children").select("*").eq("id", childId).single();
        const child = (data as Child) ?? null;
        if (child) cacheChildren([child]);
        return child;
      },
      async () => {
        const child = readMockDb().children.find((entry) => entry.id === childId) ?? null;
        if (child) cacheChildren([child]);
        return child;
      },
    );
  }
  const child = readMockDb().children.find((entry) => entry.id === childId) ?? null;
  if (child) cacheChildren([child]);
  return child;
};

export const listScans = async (profile: Profile): Promise<ScanRecord[]> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase.from("scans").select("*").order("created_at", { ascending: false });
        const children = await listChildren(profile);
        const allowedChildIds = new Set(children.map((entry) => entry.id));
        return ((data as ScanRecord[]) ?? []).filter((scan) => allowedChildIds.has(scan.child_id));
      },
      async () => listScansMock(profile),
    );
  }
  return listScansMock(profile);
};

const listScansMock = async (profile: Profile) => {
  const db = readMockDb();
  return db.scans
    .filter((scan) => {
      const child = db.children.find((entry) => entry.id === scan.child_id);
      return child ? roleCanSeeScan(profile, child, scan) : false;
    })
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
};

export const getScanById = async (scanId: string) => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase.from("scans").select("*").eq("id", scanId).single();
        return (data as ScanRecord) ?? null;
      },
      async () => readMockDb().scans.find((scan) => scan.id === scanId) ?? null,
    );
  }
  const db = readMockDb();
  return db.scans.find((scan) => scan.id === scanId) ?? null;
};

export const updateScanNotes = async (
  scanId: string,
  patch: Partial<Pick<ScanRecord, "doctor_notes" | "care_pathway_notes">>,
) => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase
          .from("scans")
          .update(patch)
          .eq("id", scanId)
          .select("*")
          .single();
        return (data as ScanRecord) ?? null;
      },
      async () => {
        const db = updateMockDb((draft) => ({
          ...draft,
          scans: draft.scans.map((scan) => (scan.id === scanId ? { ...scan, ...patch } : scan)),
        }));
        return db.scans.find((scan) => scan.id === scanId) ?? null;
      },
    );
  }
  const db = updateMockDb((draft) => ({
    ...draft,
    scans: draft.scans.map((scan) => (scan.id === scanId ? { ...scan, ...patch } : scan)),
  }));
  return db.scans.find((scan) => scan.id === scanId) ?? null;
};

const deriveIcd10Codes = (classification: ScanRecord["classification"], severity: ScanRecord["severity"]) => {
  if (classification === "negative") return ["Z13.89"];
  if (severity === "severe") return ["Q87.0", "Q17.2", "M26.09"];
  if (severity === "moderate") return ["Q87.0", "H90.2"];
  return ["Q87.0"];
};

export const analyzeAndPersistScan = async (payload: NewScanPayload): Promise<ScanRecord> => {
  const child =
    payload.childId && (await getChildById(payload.childId))
      ? await getChildById(payload.childId)
      : payload.childDraft
        ? await upsertChild(payload.actorProfile, payload.childDraft)
        : null;

  if (!child) {
    throw new Error("Child information is required");
  }

  const imageUrl = await uploadScanImage(payload.file);
  const inference = await requestInference(payload.file, payload.patientAge, payload.patientSex);

  const scan: ScanRecord = {
    id: makeId("scan"),
    child_id: child.id,
    doctor_id:
      payload.actorProfile.role === "doctor" || payload.actorProfile.role === "chw" || payload.actorProfile.role === "admin"
        ? payload.actorProfile.id
        : child.assigned_doctor ?? null,
    image_url: imageUrl,
    classification: inference.classification,
    confidence: inference.confidence,
    severity: inference.severity,
    variant: inference.variant,
    xai_data: inference.xai_regions,
    segmentation_data: inference.segmentation,
    comorbidity_flags: inference.comorbidity_flags,
    surgical_windows: inference.surgical_windows,
    care_pathway: inference.care_pathway,
    raw_inference_response: inference,
    icd10_codes: deriveIcd10Codes(inference.classification, inference.severity),
    created_at: nowIso(),
  };

  if (isSupabaseConfigured && supabase) {
    await fallbackToMock(
      async () => {
        await supabase.from("scans").insert(scan);
        return scan;
      },
      async () => {
        persistScanMock(scan, payload.actorProfile, child);
        return scan;
      },
    );
  } else {
    persistScanMock(scan, payload.actorProfile, child);
  }

  return scan;
};

const persistScanMock = (scan: ScanRecord, actorProfile: Profile, child: Child) => {
  updateMockDb(
    (draft) => ({
      ...draft,
      scans: [scan, ...draft.scans],
    }),
    { entity: "scans", recordId: scan.id },
  );

  if (actorProfile.role === "chw" && child.assigned_doctor) {
    pushMockNotification(
      buildDemoNotification(
        child.assigned_doctor,
        "scan",
        `${actorProfile.full_name} submitted a new scan for ${child.name}.`,
        "/doctor/dashboard",
      ),
    );
  }
};

export const createReferralDraft = async (scan: ScanRecord, child: Child) =>
  sampleReferralLetter(child.name, scan.severity, scan.variant);

export const createReferral = async (payload: ReferralPayload): Promise<ReferralRecord> => {
  const referral: ReferralRecord = {
    id: makeId("referral"),
    scan_id: payload.scanId,
    child_id: payload.childId,
    from_doctor: payload.fromDoctor,
    to_doctor: payload.toDoctor,
    specialty: payload.specialty,
    urgency: payload.urgency,
    status: payload.appointmentDate ? "booked" : "sent",
    appointment_date: payload.appointmentDate ?? null,
    notes: payload.notes,
    created_at: nowIso(),
  };

  if (isSupabaseConfigured && supabase) {
    await fallbackToMock(
      async () => {
        await supabase.from("referrals").insert(referral);
        await supabase.from("notifications").insert({
          id: makeId("notif"),
          user_id: payload.toDoctor,
          type: "referral",
          message: "You received a new referral in GoldenScope AI.",
          read: false,
          link: "/doctor/referrals",
          created_at: nowIso(),
        });
        return referral;
      },
      async () => {
        persistReferralMock(referral);
        return referral;
      },
    );
  } else {
    persistReferralMock(referral);
  }

  return referral;
};

const persistReferralMock = (referral: ReferralRecord) => {
  updateMockDb(
    (draft) => ({
      ...draft,
      referrals: [referral, ...draft.referrals],
    }),
    { entity: "referrals", recordId: referral.id, userId: referral.to_doctor },
  );

  pushMockNotification(
    buildDemoNotification(
      referral.to_doctor,
      "referral",
      `New ${referral.urgency} ${referral.specialty} referral received.`,
      "/doctor/referrals",
    ),
  );
};

export const listReferrals = async (profile: Profile): Promise<ReferralRecord[]> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        let query = supabase.from("referrals").select(`
          *,
          child:children!referrals_child_id_fkey(id, name),
          from_profile:profiles!referrals_from_doctor_fkey(id, full_name),
          to_profile:profiles!referrals_to_doctor_fkey(id, full_name)
        `);
        if (profile.role === "doctor") {
          query = query.or(`from_doctor.eq.${profile.id},to_doctor.eq.${profile.id}`);
        }
        const { data } = await query.order("created_at", { ascending: false });
        const rows = ((data ?? []) as Array<
          ReferralRecord & {
            child?: { id: string; name: string } | null;
            from_profile?: { id: string; full_name: string } | null;
            to_profile?: { id: string; full_name: string } | null;
          }
        >).map(({ child, from_profile, to_profile, ...referral }) => {
          if (child) cacheChildren([child]);
          if (from_profile) cacheProfiles([from_profile]);
          if (to_profile) cacheProfiles([to_profile]);
          return referral;
        });
        return rows;
      },
      async () => listReferralsMock(profile),
    );
  }
  return listReferralsMock(profile);
};

const listReferralsMock = async (profile: Profile) => {
  const db = readMockDb();
  if (profile.role === "admin" || profile.role === "chw") return db.referrals;
  if (profile.role === "doctor") {
    return db.referrals.filter(
      (referral) => referral.from_doctor === profile.id || referral.to_doctor === profile.id,
    );
  }
  const allowedChildren = new Set(
    db.children.filter((child) => child.parent_id === profile.id).map((child) => child.id),
  );
  return db.referrals.filter((referral) => allowedChildren.has(referral.child_id));
};

export const updateReferralStatus = async (
  referralId: string,
  status: ReferralRecord["status"],
  appointmentDate?: string | null,
) => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase
          .from("referrals")
          .update({ status, appointment_date: appointmentDate ?? null })
          .eq("id", referralId)
          .select("*")
          .single();
        const updated = (data as ReferralRecord) ?? null;
        if (updated) {
          await supabase.from("notifications").insert({
            id: makeId("notif"),
            user_id: updated.from_doctor,
            type: "referral-status",
            message: `Referral for child ${updated.child_id} is now ${status}.`,
            read: false,
            link: "/doctor/referrals",
            created_at: nowIso(),
          });
        }
        return updated;
      },
      async () => {
        const db = updateMockDb(
          (draft) => ({
            ...draft,
            referrals: draft.referrals.map((referral) =>
              referral.id === referralId
                ? { ...referral, status, appointment_date: appointmentDate ?? referral.appointment_date }
                : referral,
            ),
          }),
          { entity: "referrals", recordId: referralId },
        );
        const referral = db.referrals.find((entry) => entry.id === referralId) ?? null;
        if (referral) {
          pushMockNotification(
            buildDemoNotification(
              referral.from_doctor,
              "referral-status",
              `Referral for child ${referral.child_id} is now ${status}.`,
              "/doctor/referrals",
            ),
          );
        }
        return referral;
      },
    );
  }
  const db = updateMockDb(
    (draft) => ({
      ...draft,
      referrals: draft.referrals.map((referral) =>
        referral.id === referralId
          ? { ...referral, status, appointment_date: appointmentDate ?? referral.appointment_date }
          : referral,
      ),
    }),
    { entity: "referrals", recordId: referralId },
  );
  const referral = db.referrals.find((entry) => entry.id === referralId) ?? null;
  if (referral) {
    pushMockNotification(
      buildDemoNotification(
        referral.from_doctor,
        "referral-status",
        `Referral for child ${referral.child_id} is now ${status}.`,
        "/doctor/referrals",
      ),
    );
  }
  return referral;
};

export const listPosts = async (): Promise<CommunityPost[]> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(id, full_name)")
          .order("created_at", { ascending: false });
        const rows = ((data ?? []) as Array<CommunityPost & { author?: { id: string; full_name: string } | null }>).map(
          ({ author, ...post }) => {
            if (author) cacheProfiles([author]);
            return post;
          },
        );
        return rows;
      },
      async () => readMockDb().posts,
    );
  }
  return readMockDb().posts;
};

export const listReplies = async (postId: string): Promise<CommunityReply[]> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase
          .from("post_replies")
          .select("*, author:profiles!post_replies_author_id_fkey(id, full_name)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        const rows = ((data ?? []) as Array<CommunityReply & { author?: { id: string; full_name: string } | null }>).map(
          ({ author, ...reply }) => {
            if (author) cacheProfiles([author]);
            return reply;
          },
        );
        return rows;
      },
      async () => readMockDb().replies.filter((reply) => reply.post_id === postId),
    );
  }
  return readMockDb().replies.filter((reply) => reply.post_id === postId);
};

export const createPost = async (author: Profile, payload: PostPayload): Promise<CommunityPost> => {
  const post: CommunityPost = {
    id: makeId("post"),
    author_id: author.id,
    title: payload.title,
    body: payload.body,
    language: payload.language,
    replies_count: 0,
    created_at: nowIso(),
  };
  cacheProfiles([author]);
  if (isSupabaseConfigured && supabase) {
    await fallbackToMock(
      async () => {
        await supabase.from("posts").insert(post);
        return post;
      },
      async () => {
        updateMockDb((draft) => ({ ...draft, posts: [post, ...draft.posts] }), {
          entity: "posts",
          recordId: post.id,
        });
        return post;
      },
    );
  } else {
    updateMockDb((draft) => ({ ...draft, posts: [post, ...draft.posts] }), {
      entity: "posts",
      recordId: post.id,
    });
  }
  return post;
};

export const createReply = async (author: Profile, payload: ReplyPayload): Promise<CommunityReply> => {
  const reply: CommunityReply = {
    id: makeId("reply"),
    post_id: payload.postId,
    author_id: author.id,
    body: payload.body,
    language: payload.language,
    created_at: nowIso(),
  };
  cacheProfiles([author]);
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        await supabase.from("post_replies").insert(reply);
        const { data: postRow } = await supabase
          .from("posts")
          .select("replies_count")
          .eq("id", payload.postId)
          .single();
        const nextCount = Number((postRow as { replies_count?: number } | null)?.replies_count ?? 0) + 1;
        await supabase.from("posts").update({ replies_count: nextCount }).eq("id", payload.postId);
        return reply;
      },
      async () => {
        updateMockDb(
          (draft) => ({
            ...draft,
            replies: [...draft.replies, reply],
            posts: draft.posts.map((post) =>
              post.id === payload.postId ? { ...post, replies_count: post.replies_count + 1 } : post,
            ),
          }),
          { entity: "replies", recordId: reply.id },
        );
        return reply;
      },
    );
  }
  updateMockDb(
    (draft) => ({
      ...draft,
      replies: [...draft.replies, reply],
      posts: draft.posts.map((post) =>
        post.id === payload.postId ? { ...post, replies_count: post.replies_count + 1 } : post,
      ),
    }),
    { entity: "replies", recordId: reply.id },
  );
  return reply;
};

export const listNotifications = async (profile: Profile): Promise<AppNotification[]> => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });
        return (data as AppNotification[]) ?? [];
      },
      async () => listNotificationsMock(profile.id),
    );
  }
  return listNotificationsMock(profile.id);
};

const listNotificationsMock = async (userId: string) =>
  readMockDb().notifications.filter((notification) => notification.user_id === userId);

export const markNotificationRead = async (notificationId: string) => {
  if (isSupabaseConfigured && supabase) {
    return fallbackToMock(
      async () => {
        const { data } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId)
          .select("*")
          .single();
        return (data as AppNotification) ?? null;
      },
      async () => {
        const db = updateMockDb(
          (draft) => ({
            ...draft,
            notifications: draft.notifications.map((notification) =>
              notification.id === notificationId ? { ...notification, read: true } : notification,
            ),
          }),
          { entity: "notifications", recordId: notificationId },
        );
        return db.notifications.find((notification) => notification.id === notificationId) ?? null;
      },
    );
  }
  const db = updateMockDb(
    (draft) => ({
      ...draft,
      notifications: draft.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    }),
    { entity: "notifications", recordId: notificationId },
  );
  return db.notifications.find((notification) => notification.id === notificationId) ?? null;
};

export const getProfileDisplayName = (profileId: string) =>
  profileNameCache.get(profileId) ?? getMockProfile(profileId)?.full_name ?? "Unknown user";

export const getChildDisplayName = (childId: string) =>
  childNameCache.get(childId) ?? readMockDb().children.find((child) => child.id === childId)?.name ?? "Unknown child";

export const getSeverityAverage = (scans: ScanRecord[]) => {
  if (!scans.length) return 0;
  const scoreMap = { mild: 1, moderate: 2, severe: 3 };
  return (
    scans.reduce((total, scan) => total + scoreMap[scan.severity], 0) / scans.length
  ).toFixed(2);
};

export const getUnreadNotificationCount = async (profile: Profile) => {
  const notifications = await listNotifications(profile);
  return notifications.filter((notification) => !notification.read).length;
};
