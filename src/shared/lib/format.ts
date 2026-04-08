import { format, formatDistanceToNowStrict } from "date-fns";
import type { Classification, Severity, Variant } from "@/shared/lib/types";

export const formatDate = (value?: string | null, pattern = "dd MMM yyyy") => {
  if (!value) return "Not scheduled";
  return format(new Date(value), pattern);
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "Unknown";
  return format(new Date(value), "dd MMM yyyy, hh:mm a");
};

export const formatRelativeTime = (value?: string | null) => {
  if (!value) return "Unknown";
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
};

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const classifySeverityScore = (severity: Severity) => ({ mild: 1, moderate: 2, severe: 3 })[severity];

export const variantLabel = (variant: Variant) => variant.replaceAll("_", " ");

export const classificationCopy = (classification: Classification) => {
  switch (classification) {
    case "positive":
      return "Findings are consistent with Goldenhar-related features and need specialist follow-up.";
    case "negative":
      return "No strong Goldenhar signal was detected in this image.";
    default:
      return "The model needs another clinical image or specialist review to be confident.";
  }
};
