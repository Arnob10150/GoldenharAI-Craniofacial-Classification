import { useEffect, useMemo, useState } from "react";
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

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const REGION_BOXES: Array<{
  pattern: RegExp;
  box: { x: number; y: number; w: number; h: number };
}> = [
  { pattern: /left.*eye|left.*eyelid/i, box: { x: 0.14, y: 0.16, w: 0.2, h: 0.14 } },
  { pattern: /right.*eye|right.*eyelid/i, box: { x: 0.66, y: 0.16, w: 0.2, h: 0.14 } },
  { pattern: /left.*ear/i, box: { x: 0.02, y: 0.24, w: 0.18, h: 0.34 } },
  { pattern: /right.*ear/i, box: { x: 0.8, y: 0.24, w: 0.18, h: 0.34 } },
  { pattern: /upper.*lip|left.*upper.*lip|right.*upper.*lip|philtrum/i, box: { x: 0.34, y: 0.52, w: 0.32, h: 0.16 } },
  { pattern: /jaw|mandibular|dental|occlusal/i, box: { x: 0.24, y: 0.58, w: 0.52, h: 0.18 } },
  { pattern: /midface|face|orbital|ocular/i, box: { x: 0.18, y: 0.2, w: 0.64, h: 0.42 } },
  { pattern: /spine|vertebral|paraspinal|thoracic|cervical/i, box: { x: 0.4, y: 0.08, w: 0.2, h: 0.78 } },
  { pattern: /background|global/i, box: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 } },
];

const resolveRegionBox = (regionName: string) =>
  REGION_BOXES.find((entry) => entry.pattern.test(regionName))?.box ?? { x: 0.22, y: 0.22, w: 0.56, h: 0.4 };

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const createExplainabilityImages = async (imageUrl: string, xaiData: Array<{ region: string; attention: number }>) => {
  if (!imageUrl || !xaiData.length) {
    return { gradCamUrl: null, focusMapUrl: null };
  }

  try {
    const image = await loadImage(imageUrl);
    const size = 720;

    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = size;
    baseCanvas.height = size;
    const baseCtx = baseCanvas.getContext("2d");

    const focusCanvas = document.createElement("canvas");
    focusCanvas.width = size;
    focusCanvas.height = size;
    const focusCtx = focusCanvas.getContext("2d");

    if (!baseCtx || !focusCtx) {
      return { gradCamUrl: null, focusMapUrl: null };
    }

    const imgRatio = image.width / image.height;
    const targetRatio = 1;
    let drawWidth = size;
    let drawHeight = size;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > targetRatio) {
      drawHeight = size / imgRatio;
      offsetY = (size - drawHeight) / 2;
    } else {
      drawWidth = size * imgRatio;
      offsetX = (size - drawWidth) / 2;
    }

    baseCtx.fillStyle = "#08120f";
    baseCtx.fillRect(0, 0, size, size);
    baseCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    focusCtx.fillStyle = "#0b1714";
    focusCtx.fillRect(0, 0, size, size);
    focusCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    focusCtx.fillStyle = "rgba(2, 8, 7, 0.45)";
    focusCtx.fillRect(0, 0, size, size);

    xaiData.forEach((entry, index) => {
      const box = resolveRegionBox(entry.region);
      const x = offsetX + box.x * drawWidth;
      const y = offsetY + box.y * drawHeight;
      const w = box.w * drawWidth;
      const h = box.h * drawHeight;
      const intensity = clamp(entry.attention);
      const hue = 28 - intensity * 28;
      const grad = baseCtx.createRadialGradient(x + w / 2, y + h / 2, 12, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
      grad.addColorStop(0, `hsla(${hue}, 95%, 58%, ${0.2 + intensity * 0.55})`);
      grad.addColorStop(0.5, `hsla(${hue + 20}, 90%, 52%, ${0.12 + intensity * 0.28})`);
      grad.addColorStop(1, "hsla(0, 0%, 0%, 0)");
      baseCtx.fillStyle = grad;
      baseCtx.fillRect(x - w * 0.25, y - h * 0.25, w * 1.5, h * 1.5);

      focusCtx.strokeStyle = `rgba(30, 255, 181, ${0.45 + intensity * 0.5})`;
      focusCtx.lineWidth = 2 + intensity * 5;
      focusCtx.strokeRect(x, y, w, h);
      focusCtx.fillStyle = `rgba(23, 208, 153, ${0.08 + intensity * 0.2})`;
      focusCtx.fillRect(x, y, w, h);
      focusCtx.fillStyle = "#f8fffd";
      focusCtx.font = "600 18px sans-serif";
      focusCtx.fillText(`${index + 1}. ${entry.region.replaceAll("_", " ")}`, 24, 34 + index * 26);
    });

    baseCtx.fillStyle = "rgba(6, 18, 14, 0.28)";
    baseCtx.fillRect(0, size - 68, size, 68);
    baseCtx.fillStyle = "#f4fffb";
    baseCtx.font = "700 26px sans-serif";
    baseCtx.fillText("Grad-CAM style heat overlay", 26, size - 28);

    focusCtx.fillStyle = "rgba(6, 18, 14, 0.3)";
    focusCtx.fillRect(0, size - 68, size, 68);
    focusCtx.fillStyle = "#f4fffb";
    focusCtx.font = "700 26px sans-serif";
    focusCtx.fillText("Focus map", 26, size - 28);

    return {
      gradCamUrl: baseCanvas.toDataURL("image/png"),
      focusMapUrl: focusCanvas.toDataURL("image/png"),
    };
  } catch {
    return { gradCamUrl: null, focusMapUrl: null };
  }
};

interface AnalysisVisualsProps {
  scan: ScanRecord;
  child?: Child | null;
}

export const AnalysisVisuals = ({ scan, child }: AnalysisVisualsProps) => {
  const { t } = useTranslation();
  const [visualMaps, setVisualMaps] = useState<{ gradCamUrl: string | null; focusMapUrl: string | null }>({
    gradCamUrl: null,
    focusMapUrl: null,
  });
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

  const explainabilitySeed = useMemo(
    () => JSON.stringify(scan.xai_data.map((entry) => ({ region: entry.region, attention: entry.attention }))),
    [scan.xai_data],
  );

  useEffect(() => {
    let active = true;
    void createExplainabilityImages(scan.image_url, scan.xai_data).then((images) => {
      if (active) {
        setVisualMaps(images);
      }
    });
    return () => {
      active = false;
    };
  }, [scan.image_url, explainabilitySeed, scan.xai_data]);

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
          <div className="mx-auto flex w-full max-w-md items-center justify-center">
            <div className="aspect-square w-full overflow-hidden rounded-[2rem] border border-border/60 bg-muted/20 shadow-inner">
              <img src={scan.image_url} alt={t("analysis.inputTitle")} className="h-full w-full object-cover" />
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
            <div className="aspect-square w-full max-w-md overflow-hidden rounded-[2rem] border border-border/60 bg-muted/20">
              {visualMaps.gradCamUrl ? (
                <img src={visualMaps.gradCamUrl} alt="Grad-CAM overlay" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Generating overlay...</div>
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
            <div className="aspect-square w-full max-w-md overflow-hidden rounded-[2rem] border border-border/60 bg-muted/20">
              {visualMaps.focusMapUrl ? (
                <img src={visualMaps.focusMapUrl} alt="Focus map" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Generating focus map...</div>
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
