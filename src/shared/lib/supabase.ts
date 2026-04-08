import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const defaultInferenceUrl = import.meta.env.DEV
  ? "http://127.0.0.1:8000/predict"
  : "https://goldenscope-inference.railway.app/predict";
export const inferenceUrl = import.meta.env.VITE_RAILWAY_INFERENCE_URL || defaultInferenceUrl;
export const storageBucketName = "scan-images";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
);
