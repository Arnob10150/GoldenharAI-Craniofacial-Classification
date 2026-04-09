import { inferenceUrl } from "@/shared/lib/supabase";
import type {
  CareAction,
  ChildSex,
  Classification,
  ComorbidityFlag,
  InferenceResponse,
  SegmentationFinding,
  Severity,
  SurgicalWindow,
  Variant,
  XaiRegion,
} from "@/shared/lib/types";

const normalizeUnitFloat = (value: unknown, fallback = 0) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return Math.min(Math.max(numeric, 0), 1);
};

const normalizeClassification = (value: unknown): Classification =>
  value === "positive" || value === "negative" || value === "inconclusive" ? value : "inconclusive";

const normalizeSeverity = (value: unknown): Severity =>
  value === "mild" || value === "moderate" || value === "severe" ? value : "moderate";

const normalizeVariant = (value: unknown): Variant =>
  value === "unilateral_left" || value === "unilateral_right" || value === "bilateral" ? value : "bilateral";

const normalizeXai = (value: unknown): XaiRegion[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const region = String((entry as { region?: unknown }).region ?? "").trim();
      if (!region) return null;
      return {
        region,
        attention: normalizeUnitFloat((entry as { attention?: unknown }).attention, 0),
      };
    })
    .filter((entry): entry is XaiRegion => Boolean(entry));
};

const normalizeSegmentation = (value: unknown): SegmentationFinding[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const label = String((entry as { label?: unknown }).label ?? "").trim();
      if (!label) return null;
      return {
        label,
        side: String((entry as { side?: unknown }).side ?? "na"),
        confidence: normalizeUnitFloat((entry as { confidence?: unknown }).confidence, 0),
      };
    })
    .filter((entry): entry is SegmentationFinding => Boolean(entry));
};

const normalizeComorbidities = (value: unknown): ComorbidityFlag[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const condition = String((entry as { condition?: unknown }).condition ?? "").trim();
      const risk = (entry as { risk?: unknown }).risk;
      if (!condition || (risk !== "low" && risk !== "medium" && risk !== "high")) return null;
      return { condition, risk };
    })
    .filter((entry): entry is ComorbidityFlag => Boolean(entry));
};

const normalizeSurgicalWindows = (value: unknown): SurgicalWindow[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const procedure = String((entry as { procedure?: unknown }).procedure ?? "").trim();
      const start = Number((entry as { optimal_age_start?: unknown }).optimal_age_start);
      const end = Number((entry as { optimal_age_end?: unknown }).optimal_age_end);
      const status = (entry as { status?: unknown }).status;
      if (!procedure || Number.isNaN(start) || Number.isNaN(end)) return null;
      if (status !== "urgent" && status !== "upcoming" && status !== "future" && status !== "current") return null;
      return {
        procedure,
        optimal_age_start: start,
        optimal_age_end: end,
        status,
      };
    })
    .filter((entry): entry is SurgicalWindow => Boolean(entry));
};

const normalizeCarePathway = (value: unknown): CareAction[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const action = String((entry as { action?: unknown }).action ?? "").trim();
      const priority = (entry as { priority?: unknown }).priority;
      if (!action || !["low", "medium", "high", "urgent"].includes(String(priority))) return null;
      return { action, priority: priority as CareAction["priority"] };
    })
    .filter((entry): entry is CareAction => Boolean(entry));
};

const normalizeXaiVisuals = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  const gradcam = typeof (value as { gradcam_overlay_url?: unknown }).gradcam_overlay_url === "string"
    ? String((value as { gradcam_overlay_url?: unknown }).gradcam_overlay_url)
    : undefined;
  const focus = typeof (value as { focus_map_url?: unknown }).focus_map_url === "string"
    ? String((value as { focus_map_url?: unknown }).focus_map_url)
    : undefined;
  if (!gradcam && !focus) return undefined;
  return {
    gradcam_overlay_url: gradcam,
    focus_map_url: focus,
  };
};

const toErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") return data.detail;
    return JSON.stringify(data);
  } catch {
    return response.statusText || "Inference service error";
  }
};

const INFERENCE_TIMEOUT_MS = 120000;

export const requestInference = async (image: File, patientAge: number, patientSex: ChildSex): Promise<InferenceResponse> => {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("patient_age", String(patientAge));
  formData.append("patient_sex", patientSex);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), INFERENCE_TIMEOUT_MS);

  try {
    const response = await fetch(inferenceUrl, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await toErrorMessage(response));
    }

    const data = (await response.json()) as Record<string, unknown>;
    const normalized: InferenceResponse = {
      classification: normalizeClassification(data.classification),
      confidence: normalizeUnitFloat(data.confidence, 0),
      severity: normalizeSeverity(data.severity),
      variant: normalizeVariant(data.variant),
      xai_regions: normalizeXai(data.xai_regions),
      segmentation: normalizeSegmentation(data.segmentation),
      comorbidity_flags: normalizeComorbidities(data.comorbidity_flags),
      surgical_windows: normalizeSurgicalWindows(data.surgical_windows),
      care_pathway: normalizeCarePathway(data.care_pathway),
      xai_visuals: normalizeXaiVisuals(data.xai_visuals),
      predicted_class: typeof data.predicted_class === "string" ? data.predicted_class : undefined,
      top_predictions: Array.isArray(data.top_predictions)
        ? data.top_predictions
            .map((entry) => {
              if (!entry || typeof entry !== "object") return null;
              const label = String((entry as { label?: unknown }).label ?? "").trim();
              const probability = normalizeUnitFloat((entry as { probability?: unknown }).probability, -1);
              if (!label || probability < 0) return null;
              return { label, probability };
            })
            .filter((entry): entry is { label: string; probability: number } => Boolean(entry))
        : undefined,
      model_name: typeof data.model_name === "string" ? data.model_name : undefined,
      model_mode: typeof data.model_mode === "string" ? data.model_mode : undefined,
      patient_sex: typeof data.patient_sex === "string" ? data.patient_sex : undefined,
      explanation_prediction_index: typeof data.explanation_prediction_index === "number" ? data.explanation_prediction_index : undefined,
      xai_method: typeof data.xai_method === "string" ? data.xai_method : undefined,
    };

    if (!normalized.xai_regions.length || !normalized.segmentation.length || !normalized.care_pathway.length) {
      throw new Error("Inference response was incomplete. The model service returned malformed clinical fields.");
    }

    return normalized;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Inference request timed out. Railway may still be cold-starting the model. Please wait a few seconds and try again.");
    }
    if (error instanceof TypeError) {
      throw new Error("Unable to reach the inference service. This is usually a deployment URL, CORS, or Railway startup issue.");
    }
    throw error instanceof Error ? error : new Error("Unable to complete model inference.");
  } finally {
    window.clearTimeout(timeout);
  }
};

export const classificationLabel = (classification: Classification) => ({
  positive: "Positive",
  negative: "Negative",
  inconclusive: "Inconclusive",
}[classification]);
