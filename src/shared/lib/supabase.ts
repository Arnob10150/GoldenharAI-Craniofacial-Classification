import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const productionInferenceUrl =
  "https://goldenharai-craniofacial-classification-production.up.railway.app/predict";
const defaultInferenceUrl = process.env.NODE_ENV !== "production"
  ? "http://127.0.0.1:8000/predict"
  : productionInferenceUrl;
export const inferenceUrl = process.env.NEXT_PUBLIC_RAILWAY_INFERENCE_URL || defaultInferenceUrl;
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
