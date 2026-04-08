import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bootstrapSession, saveProfile, signIn, signOut, signUp, type SessionBundle } from "@/shared/lib/data";
import type { Profile, RegisterPayload } from "@/shared/lib/types";

interface AuthStoreState {
  initialized: boolean;
  loading: boolean;
  email: string | null;
  profile: Profile | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Profile) => Promise<void>;
  setSession: (bundle: SessionBundle | null) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      initialized: false,
      loading: false,
      email: null,
      profile: null,
      initialize: async () => {
        set({ loading: true });
        const session = await bootstrapSession();
        set({ loading: false, initialized: true, email: session?.email ?? null, profile: session?.profile ?? null });
      },
      login: async (email, password) => {
        set({ loading: true });
        const bundle = await signIn({ email, password });
        set({ loading: false, email: bundle.email, profile: bundle.profile, initialized: true });
      },
      register: async (payload) => {
        set({ loading: true });
        const bundle = await signUp(payload);
        set({ loading: false, email: bundle.email, profile: bundle.profile, initialized: true });
      },
      logout: async () => {
        set({ loading: true });
        await signOut();
        set({ loading: false, email: null, profile: null });
      },
      updateProfile: async (profile) => {
        set({ loading: true });
        const saved = await saveProfile(profile);
        set({ loading: false, profile: saved });
      },
      setSession: (bundle) => set({ email: bundle?.email ?? null, profile: bundle?.profile ?? null, initialized: true }),
    }),
    { name: "goldenscope-auth-store", partialize: (state) => ({ email: state.email, profile: state.profile }) },
  ),
);
