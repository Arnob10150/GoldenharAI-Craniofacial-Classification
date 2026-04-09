import { format, formatDistanceToNowStrict } from "date-fns";
import { bn, enUS } from "date-fns/locale";
import i18n, { translateStatusLabel, translateVariantLabel } from "@/shared/lib/i18n";
import type { Classification, Severity, Variant } from "@/shared/lib/types";

const dateLocale = () => (i18n.language === "bn" ? bn : enUS);

export const formatDate = (value?: string | null, pattern = "dd MMM yyyy") => {
  if (!value) {
    return i18n.t("common.notScheduled");
  }
  return format(new Date(value), pattern, { locale: dateLocale() });
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return i18n.t("common.unknown");
  }
  return format(new Date(value), "dd MMM yyyy, hh:mm a", { locale: dateLocale() });
};

export const formatRelativeTime = (value?: string | null) => {
  if (!value) {
    return i18n.t("common.unknown");
  }
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true, locale: dateLocale() });
};

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const classifySeverityScore = (severity: Severity) => ({ mild: 1, moderate: 2, severe: 3 })[severity];

export const variantLabel = (variant: Variant) => translateVariantLabel(variant);

export const classificationCopy = (classification: Classification) => {
  switch (classification) {
    case "positive":
      return i18n.language === "bn"
        ? "ফলাফল গোল্ডেনহার-সম্পর্কিত বৈশিষ্ট্যের সাথে সামঞ্জস্যপূর্ণ এবং বিশেষজ্ঞ ফলো-আপ প্রয়োজন।"
        : "Findings are consistent with Goldenhar-related features and need specialist follow-up.";
    case "negative":
      return i18n.language === "bn"
        ? "এই ছবিতে গোল্ডেনহারের শক্তিশালী কোনো সংকেত পাওয়া যায়নি।"
        : "No strong Goldenhar signal was detected in this image.";
    default:
      return i18n.language === "bn"
        ? "মডেলটি নিশ্চিত হতে আরেকটি ক্লিনিক্যাল ছবি বা বিশেষজ্ঞের পর্যালোচনা প্রয়োজন।"
        : "The model needs another clinical image or specialist review to be confident.";
  }
};

export const severityLabel = (severity: Severity) => translateStatusLabel(severity);
