import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { translateStatusLabel, translateVariantLabel } from "@/shared/lib/i18n";
import type { Child, RiskLevel, ScanRecord } from "@/shared/lib/types";

const riskToScore: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const riskColor: Record<RiskLevel, string> = {
  low: "#1D9E75",
  medium: "#854F0B",
  high: "#A32D2D",
};

const classificationColor = (classification: ScanRecord["classification"]) => {
  switch (classification) {
    case "positive":
      return "#A32D2D";
    case "negative":
      return "#1D9E75";
    default:
      return "#854F0B";
  }
};

const toNumericTooltipValue = (value: number | string | readonly (number | string)[] | undefined) => {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0);
  }
  return Number(value ?? 0);
};

const formatPercentTooltip = (value: number | string | readonly (number | string)[] | undefined) => `${toNumericTooltipValue(value)}%`;
const formatRiskTooltip = (value: number | string | readonly (number | string)[] | undefined) => {
  const numeric = toNumericTooltipValue(value);
  return numeric <= 1
    ? translateStatusLabel("low")
    : numeric === 2
      ? translateStatusLabel("medium")
      : translateStatusLabel("high");
};

interface AnalysisVisualsProps {
  scan: ScanRecord;
  child?: Child | null;
}

export const AnalysisVisuals = ({ scan, child }: AnalysisVisualsProps) => {
  const { t } = useTranslation();
  const confidenceData = [
    { name: "confidence", value: Math.round(scan.confidence * 100) },
    { name: "remaining", value: 100 - Math.round(scan.confidence * 100) },
  ];

  const segmentationData = scan.segmentation_data.map((item) => ({
    label: item.label.replaceAll("_", " "),
    confidence: Math.round(item.confidence * 100),
  }));

  const xaiData = scan.xai_data.map((region) => ({
    region: region.region.replaceAll("_", " "),
    attention: Math.round(region.attention * 100),
  }));

  const comorbidityData = scan.comorbidity_flags.map((flag) => ({
    condition: flag.condition.replaceAll("_", " "),
    risk: riskToScore[flag.risk],
    label: flag.risk,
    color: riskColor[flag.risk],
  }));

  const age = child ? new Date().getFullYear() - new Date(child.dob).getFullYear() : null;
  const gradCamUrl = scan.raw_inference_response?.xai_visuals?.gradcam_overlay_url ?? null;
  const focusMapUrl = scan.raw_inference_response?.xai_visuals?.focus_map_url ?? null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{t("analysis.inputTitle")}</CardTitle>
          <CardDescription>
            {t("analysis.inputDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="mx-auto flex w-full max-w-sm items-center justify-center">
            <div className="aspect-square w-full overflow-hidden rounded-[2rem] border border-border/60 bg-muted/20 p-3 shadow-inner">
              <img src={scan.image_url} alt={t("analysis.inputTitle")} className="h-full w-full rounded-[1.35rem] object-contain" />
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/35 p-4">
                <div className="text-sm text-muted-foreground">{t("common.classification")}</div>
                <div className="mt-2 text-sm font-semibold leading-tight capitalize sm:text-base">{translateStatusLabel(scan.classification)}</div>
              </div>
              <div className="rounded-2xl bg-muted/35 p-4">
                <div className="text-sm text-muted-foreground">{t("common.variant")}</div>
                <div className="mt-2 text-sm font-semibold leading-tight capitalize sm:text-base">{translateVariantLabel(scan.variant)}</div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={confidenceData}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={98}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    <Cell fill={classificationColor(scan.classification)} />
                    <Cell fill="#D7E4DF" />
                  </Pie>
                  <Tooltip formatter={formatPercentTooltip} />
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-4xl font-semibold">
                    {Math.round(scan.confidence * 100)}%
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm">
                    {t("common.confidence").toLowerCase()}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
              {age !== null ? `${t("analysis.patientAgeContext", { age })} ` : ""}
              {t("analysis.higherConfidence")}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Grad-CAM Overlay</CardTitle>
            <CardDescription>Heat-style visualization of the most attended regions in the uploaded image.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="aspect-square w-full max-w-sm overflow-hidden rounded-[2rem] border border-border/60 bg-muted/20 p-3">
              {gradCamUrl ? (
                <img src={gradCamUrl} alt="Grad-CAM overlay" className="h-full w-full rounded-[1.35rem] object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Model explanation image unavailable.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Focus Map</CardTitle>
            <CardDescription>Region-focused view showing the zones that contributed most strongly to the prediction.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="aspect-square w-full max-w-sm overflow-hidden rounded-[2rem] border border-border/60 bg-muted/20 p-3">
              {focusMapUrl ? (
                <img src={focusMapUrl} alt="Focus map" className="h-full w-full rounded-[1.35rem] object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Model focus image unavailable.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{t("analysis.segmentationTitle")}</CardTitle>
          <CardDescription>{t("analysis.segmentationDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentationData} layout="vertical" margin={{ left: 18, right: 12 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} />
              <Tooltip formatter={formatPercentTooltip} />
              <Bar dataKey="confidence" fill="#0F6E56" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{t("analysis.explainabilityTitle")}</CardTitle>
          <CardDescription>{t("analysis.explainabilityDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={xaiData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="region" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
              <Tooltip formatter={formatPercentTooltip} />
              <Bar dataKey="attention" fill="#1D9E75" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{t("analysis.comorbidityTitle")}</CardTitle>
          <CardDescription>{t("analysis.comorbidityDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comorbidityData} layout="vertical" margin={{ left: 18, right: 18 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 3]}
                ticks={[1, 2, 3]}
                tickFormatter={(value) => (
                  value === 1
                    ? translateStatusLabel("low")
                    : value === 2
                      ? translateStatusLabel("medium")
                      : translateStatusLabel("high")
                )}
              />
              <YAxis type="category" dataKey="condition" width={170} tickLine={false} axisLine={false} />
              <Tooltip formatter={formatRiskTooltip} />
              <Bar dataKey="risk" radius={[0, 8, 8, 0]}>
                {comorbidityData.map((entry) => (
                  <Cell key={entry.condition} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
