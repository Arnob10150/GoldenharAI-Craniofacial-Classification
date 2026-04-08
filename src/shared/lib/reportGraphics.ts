import type { Child, ComorbidityFlag, ScanRecord, SurgicalWindow } from "@/shared/lib/types";

const colors = {
  primary: "#0F6E56",
  positive: "#1D9E75",
  warning: "#854F0B",
  danger: "#A32D2D",
  slate: "#5D7069",
  border: "#D7E4DF",
  text: "#153229",
  muted: "#EDF3F1",
  white: "#FFFFFF",
};

const riskToScore = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

const classificationColor = (classification: ScanRecord["classification"]) => {
  switch (classification) {
    case "positive":
      return colors.danger;
    case "negative":
      return colors.positive;
    default:
      return colors.warning;
  }
};

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const drawWrapped = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) => {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;

  words.forEach((word, index) => {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && index > 0) {
      ctx.fillText(line.trim(), x, cursorY);
      line = `${word} `;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  });

  if (line.trim()) {
    ctx.fillText(line.trim(), x, cursorY);
  }

  return cursorY;
};

export const loadImageDataUrl = async (src: string): Promise<string | null> => {
  if (!src) return null;
  if (src.startsWith("data:image")) return src;

  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const createConfidenceChartDataUrl = (scan: ScanRecord) => {
  const canvas = createCanvas(720, 380);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = colors.white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.text;
  ctx.font = "700 28px sans-serif";
  ctx.fillText("Confidence overview", 36, 46);
  ctx.font = "18px sans-serif";
  ctx.fillStyle = colors.slate;
  ctx.fillText("Overall classification certainty for the submitted image", 36, 78);

  const centerX = 190;
  const centerY = 220;
  const radius = 92;
  const lineWidth = 24;
  const percent = Math.max(0, Math.min(1, scan.confidence));

  ctx.beginPath();
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = lineWidth;
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = classificationColor(scan.classification);
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent);
  ctx.stroke();

  ctx.fillStyle = colors.text;
  ctx.font = "700 40px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(scan.confidence * 100)}%`, centerX, centerY + 10);
  ctx.font = "18px sans-serif";
  ctx.fillStyle = colors.slate;
  ctx.fillText("confidence", centerX, centerY + 40);
  ctx.textAlign = "start";

  const metrics = [
    ["Classification", scan.classification],
    ["Severity", scan.severity],
    ["Variant", scan.variant.replaceAll("_", " ")],
  ];

  metrics.forEach(([label, value], index) => {
    const x = 360;
    const y = 148 + index * 70;
    ctx.fillStyle = colors.muted;
    ctx.fillRect(x, y, 300, 54);
    ctx.fillStyle = colors.slate;
    ctx.font = "16px sans-serif";
    ctx.fillText(label, x + 18, y + 22);
    ctx.fillStyle = colors.text;
    ctx.font = "700 22px sans-serif";
    ctx.fillText(value.replace(/\b\w/g, (letter) => letter.toUpperCase()), x + 18, y + 44);
  });

  return canvas.toDataURL("image/png");
};

export const createHorizontalBarChartDataUrl = (
  title: string,
  subtitle: string,
  data: Array<{ label: string; value: number; color?: string }>,
  maxValue = 100,
) => {
  const canvas = createCanvas(820, Math.max(280, 140 + data.length * 56));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = colors.white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.text;
  ctx.font = "700 28px sans-serif";
  ctx.fillText(title, 36, 46);
  ctx.font = "18px sans-serif";
  ctx.fillStyle = colors.slate;
  ctx.fillText(subtitle, 36, 76);

  data.forEach((entry, index) => {
    const y = 124 + index * 56;
    ctx.fillStyle = colors.text;
    ctx.font = "18px sans-serif";
    ctx.fillText(entry.label, 36, y + 16);

    ctx.fillStyle = colors.border;
    ctx.fillRect(250, y, 510, 18);
    ctx.fillStyle = entry.color || colors.primary;
    ctx.fillRect(250, y, (Math.max(0, Math.min(entry.value, maxValue)) / maxValue) * 510, 18);

    ctx.fillStyle = colors.slate;
    ctx.font = "16px sans-serif";
    ctx.fillText(`${entry.value}${maxValue === 100 ? "%" : ""}`, 770, y + 16);
  });

  return canvas.toDataURL("image/png");
};

export const createRiskProfileChartDataUrl = (flags: ComorbidityFlag[]) => {
  return createHorizontalBarChartDataUrl(
    "Comorbidity risk profile",
    "Low = 1, Medium = 2, High = 3",
    flags.map((flag) => ({
      label: flag.condition.replaceAll("_", " "),
      value: riskToScore[flag.risk],
      color: flag.risk === "high" ? colors.danger : flag.risk === "medium" ? colors.warning : colors.positive,
    })),
    3,
  );
};

export const createTimelineChartDataUrl = (windows: SurgicalWindow[], child?: Child | null) => {
  const canvas = createCanvas(900, Math.max(300, 140 + windows.length * 72));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = colors.white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.text;
  ctx.font = "700 28px sans-serif";
  ctx.fillText("Surgical timing timeline", 36, 46);
  ctx.font = "18px sans-serif";
  ctx.fillStyle = colors.slate;
  ctx.fillText("Each bar shows the clinically suggested age window for intervention planning", 36, 76);

  const axisX = 250;
  const axisWidth = 580;
  const maxAge = 18;
  const currentAge = child ? new Date().getFullYear() - new Date(child.dob).getFullYear() : null;

  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(axisX, 100);
  ctx.lineTo(axisX + axisWidth, 100);
  ctx.stroke();

  for (let age = 0; age <= maxAge; age += 2) {
    const x = axisX + (age / maxAge) * axisWidth;
    ctx.beginPath();
    ctx.moveTo(x, 94);
    ctx.lineTo(x, 108);
    ctx.stroke();
    ctx.fillStyle = colors.slate;
    ctx.font = "14px sans-serif";
    ctx.fillText(String(age), x - 5, 126);
  }

  windows.forEach((window, index) => {
    const y = 158 + index * 72;
    const startX = axisX + (window.optimal_age_start / maxAge) * axisWidth;
    const endX = axisX + (window.optimal_age_end / maxAge) * axisWidth;
    const color = window.status === "urgent" ? colors.danger : window.status === "upcoming" ? colors.warning : colors.primary;

    ctx.fillStyle = colors.text;
    ctx.font = "18px sans-serif";
    drawWrapped(ctx, window.procedure.replaceAll("_", " "), 36, y + 12, 180, 20);

    ctx.fillStyle = colors.border;
    ctx.fillRect(axisX, y, axisWidth, 16);
    ctx.fillStyle = color;
    ctx.fillRect(startX, y, Math.max(14, endX - startX), 16);

    ctx.fillStyle = colors.slate;
    ctx.font = "15px sans-serif";
    ctx.fillText(`${window.optimal_age_start}-${window.optimal_age_end} years`, axisX, y + 38);
    ctx.fillText(window.status, axisX + 180, y + 38);
  });

  if (currentAge !== null) {
    const currentX = axisX + (Math.min(currentAge, maxAge) / maxAge) * axisWidth;
    ctx.strokeStyle = colors.danger;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(currentX, 140);
    ctx.lineTo(currentX, canvas.height - 24);
    ctx.stroke();
    ctx.fillStyle = colors.danger;
    ctx.font = "700 15px sans-serif";
    ctx.fillText(`Current age: ${currentAge}`, currentX - 36, 142);
  }

  return canvas.toDataURL("image/png");
};

export const createTextSummaryCardDataUrl = (title: string, lines: string[]) => {
  const canvas = createCanvas(840, 200 + lines.length * 26);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = colors.white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.text;
  ctx.font = "700 28px sans-serif";
  ctx.fillText(title, 36, 46);
  ctx.font = "18px sans-serif";
  ctx.fillStyle = colors.text;

  let y = 92;
  lines.forEach((line) => {
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(48, y - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.text;
    y = drawWrapped(ctx, line, 64, y, 730, 24) + 18;
  });

  return canvas.toDataURL("image/png");
};
