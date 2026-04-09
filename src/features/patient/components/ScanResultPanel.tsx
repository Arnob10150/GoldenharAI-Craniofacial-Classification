import type { ReactNode } from "react";
import { AlertTriangle, Download, LocateFixed, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnalysisVisuals } from "@/features/patient/components/AnalysisVisuals";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { translateSpecialtyLabel, translateStatusLabel, translateVariantLabel } from "@/shared/lib/i18n";
import type { Child, ReferralRecord, ScanRecord } from "@/shared/lib/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

interface ScanResultPanelProps {
  scan: ScanRecord;
  child: Child;
  onDownloadPatient: () => void;
  onDownloadClinical?: () => void;
  onFindSpecialist?: () => void;
  referralComposer?: ReactNode;
  referral?: ReferralRecord | null;
}

const toneFromClassification = (classification: ScanRecord["classification"]) => classification;
const toneFromSeverity = (severity: ScanRecord["severity"]) => severity;
const toneFromRisk = (risk: "low" | "medium" | "high") => risk;

export const ScanResultPanel = ({
  scan,
  child,
  onDownloadPatient,
  onDownloadClinical,
  onFindSpecialist,
  referralComposer,
  referral,
}: ScanResultPanelProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <AnalysisVisuals scan={scan} child={child} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              {t("scanPanel.latestResult", { name: child.name })}
              <StatusBadge label={scan.classification} tone={toneFromClassification(scan.classification)} />
            </CardTitle>
            <CardDescription>
              {t("scanPanel.confidenceVariant", {
                confidence: Math.round(scan.confidence * 100),
                variant: translateVariantLabel(scan.variant),
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="text-sm text-muted-foreground">{t("common.classification")}</div>
                <div className="mt-2 text-xl font-semibold capitalize">{translateStatusLabel(scan.classification)}</div>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="text-sm text-muted-foreground">{t("common.confidence")}</div>
                <div className="mt-2 text-xl font-semibold">{Math.round(scan.confidence * 100)}%</div>
                <Progress className="mt-3" value={scan.confidence * 100} />
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="text-sm text-muted-foreground">{t("common.severity")}</div>
                <div className="mt-2 flex items-center gap-2 text-xl font-semibold capitalize">
                  {translateStatusLabel(scan.severity)}
                  <StatusBadge label={scan.severity} tone={toneFromSeverity(scan.severity)} />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 bg-background">
                <CardHeader>
                  <CardTitle className="text-base">{t("scanPanel.explainabilityRegions")}</CardTitle>
                  <CardDescription>{t("scanPanel.explainabilityRegionsDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scan.xai_data.map((region) => (
                    <div key={region.region} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{region.region.replaceAll("_", " ")}</span>
                        <span className="text-muted-foreground">{Math.round(region.attention * 100)}%</span>
                      </div>
                      <Progress value={region.attention * 100} className="h-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-background">
                <CardHeader>
                  <CardTitle className="text-base">{t("scanPanel.carePathway")}</CardTitle>
                  <CardDescription>{t("scanPanel.carePathwayDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scan.care_pathway.map((item, index) => (
                    <div key={`${item.action}-${index}`} className="flex gap-3 rounded-xl border border-border/60 p-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium">{item.action}</div>
                        <StatusBadge label={item.priority} tone={item.priority} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4" /> {t("scanPanel.comorbidityRisks")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("scanPanel.condition")}</TableHead>
                      <TableHead>{t("scanPanel.risk")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scan.comorbidity_flags.map((flag) => (
                      <TableRow key={flag.condition}>
                        <TableCell className="font-medium">{flag.condition.replaceAll("_", " ")}</TableCell>
                        <TableCell>
                          <StatusBadge label={flag.risk} tone={toneFromRisk(flag.risk)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("scanPanel.surgicalWindows")}</CardTitle>
              <CardDescription>{t("scanPanel.surgicalWindowsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scan.surgical_windows.map((window) => (
                <div key={window.procedure} className="space-y-2 rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium capitalize">{window.procedure.replaceAll("_", " ")}</div>
                      <div className="text-sm text-muted-foreground">
                        {t("scanPanel.optimalAge", {
                          start: window.optimal_age_start,
                          end: window.optimal_age_end,
                        })}
                      </div>
                    </div>
                    <StatusBadge
                      label={window.status}
                      tone={window.status === "current" ? "high" : window.status === "future" ? "low" : window.status === "upcoming" ? "medium" : "urgent"}
                    />
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(((window.optimal_age_end - window.optimal_age_start + 1) / 16) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("scanPanel.actions")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={onDownloadPatient} className="gap-2">
                <Download className="size-4" /> {t("scanPanel.patientReport")}
              </Button>
              {onDownloadClinical ? (
                <Button variant="outline" onClick={onDownloadClinical} className="gap-2">
                  <Stethoscope className="size-4" /> {t("scanPanel.clinicalReport")}
                </Button>
              ) : null}
              {onFindSpecialist ? (
                <Button variant="secondary" onClick={onFindSpecialist} className="gap-2">
                  <LocateFixed className="size-4" /> {t("scanPanel.findSpecialist")}
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {referralComposer ? (
            <Card className="border-border/70 shadow-sm">
              <CardContent className="pt-6">{referralComposer}</CardContent>
            </Card>
          ) : null}

          {referral ? (
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{t("scanPanel.currentReferral")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  {t("common.specialty")}: <span className="font-medium">{translateSpecialtyLabel(referral.specialty)}</span>
                </div>
                <div>
                  {t("common.status")}: <span className="font-medium capitalize">{translateStatusLabel(referral.status)}</span>
                </div>
                <div>
                  {t("common.urgency")}: <span className="font-medium capitalize">{translateStatusLabel(referral.urgency)}</span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};
