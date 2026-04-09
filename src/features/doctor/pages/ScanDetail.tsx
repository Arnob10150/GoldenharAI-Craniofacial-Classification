import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { ScanResultPanel } from "@/features/patient/components/ScanResultPanel";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useChildren } from "@/shared/hooks/useChildren";
import { getChildById, getProfileDisplayName, getScanById, listReferrals, listScans, updateScanNotes } from "@/shared/lib/data";
import { formatDateTime } from "@/shared/lib/format";
import { translateSpecialtyLabel } from "@/shared/lib/i18n";
import { downloadClinicalReport, downloadPatientReport } from "@/shared/lib/pdf";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { Child, ReferralRecord, ScanRecord } from "@/shared/lib/types";

export default function ScanDetail() {
  const { scanId } = useParams();
  const { i18n } = useTranslation();
  const isBangla = i18n.language === "bn";
  const { profile } = useAuthStore();
  const { children } = useChildren(profile);
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [siblingScans, setSiblingScans] = useState<ScanRecord[]>([]);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [careNotes, setCareNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!profile || !scanId) return;
      setLoading(true);
      const scanRow = await getScanById(scanId);
      if (!scanRow) {
        setLoading(false);
        return;
      }
      const childRow = children.find((entry) => entry.id === scanRow.child_id) ?? await getChildById(scanRow.child_id);
      const [referralRows, allScans] = await Promise.all([listReferrals(profile), listScans(profile)]);
      if (!ignore) {
        setScan(scanRow);
        setChild(childRow);
        setReferrals(referralRows.filter((referral) => referral.scan_id === scanRow.id));
        setSiblingScans(allScans.filter((entry) => entry.child_id === scanRow.child_id && entry.id !== scanRow.id));
        setDoctorNotes(scanRow.doctor_notes || "");
        setCareNotes(scanRow.care_pathway_notes || "");
        setLoading(false);
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [children, profile, scanId]);

  const previousScan = useMemo(() => siblingScans[0] ?? null, [siblingScans]);

  const saveNotes = async () => {
    if (!scan) return;
    const saved = await updateScanNotes(scan.id, { doctor_notes: doctorNotes, care_pathway_notes: careNotes });
    if (saved) {
      setScan(saved);
      toast.success(isBangla ? "ক্লিনিক্যাল নোট আপডেট হয়েছে।" : "Clinical notes updated.");
    }
  };

  if (loading) {
    return <div className="space-y-4"><div className="h-10 rounded-2xl bg-muted animate-pulse" /><div className="h-96 rounded-2xl bg-muted animate-pulse" /></div>;
  }

  if (!profile || !scan || !child) {
    return <PageTransition><Card><CardContent className="p-6">{isBangla ? "স্ক্যান পাওয়া যায়নি অথবা আপনার এতে প্রবেশাধিকার নেই।" : "Scan not found or you do not have access to it."}</CardContent></Card></PageTransition>;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={isBangla ? `স্ক্যান বিস্তারিত - ${child.name}` : `Scan detail - ${child.name}`}
        description={isBangla ? `${formatDateTime(scan.created_at)}-এ সম্পন্ন স্ক্যানের পূর্ণ রিভিউ।` : `Full review of the scan completed ${formatDateTime(scan.created_at)}.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadPatientReport(scan, child, profile.language_pref)}>
              {isBangla ? "পেশেন্ট PDF" : "Patient PDF"}
            </Button>
            <Button onClick={() => downloadClinicalReport(scan, child, profile, referrals[0])}>
              {isBangla ? "ক্লিনিক্যাল PDF" : "Clinical PDF"}
            </Button>
          </div>
        }
      />

      <ScanResultPanel
        scan={scan}
        child={child}
        referral={referrals[0]}
        onDownloadPatient={() => downloadPatientReport(scan, child, profile.language_pref)}
        onDownloadClinical={() => downloadClinicalReport(scan, child, profile, referrals[0])}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isBangla ? "ক্লিনিক্যাল নোট" : "Clinical notes"}</CardTitle>
            <CardDescription>{isBangla ? "ডাক্তারের ব্যাখ্যা এবং কেয়ার পাথওয়ের সমন্বয় লিখে রাখুন।" : "Capture doctor interpretation and pathway adjustments."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{isBangla ? "ডাক্তারের নোট" : "Doctor notes"}</label>
              <Textarea rows={6} value={doctorNotes} onChange={(event) => setDoctorNotes(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{isBangla ? "কেয়ার পাথওয়ে নোট" : "Care pathway notes"}</label>
              <Textarea rows={6} value={careNotes} onChange={(event) => setCareNotes(event.target.value)} />
            </div>
            <Button onClick={() => void saveNotes()}>{isBangla ? "নোট সংরক্ষণ করুন" : "Save notes"}</Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isBangla ? "রেফারাল ইতিহাস" : "Referral history"}</CardTitle>
            <CardDescription>{isBangla ? "এই স্ক্যানের সঙ্গে যুক্ত সব রেফারালের যাত্রাপথ ট্র্যাক করুন।" : "Track the full journey of referrals attached to this scan."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {referrals.length ? referrals.map((referral) => (
              <div key={referral.id} className="rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{translateSpecialtyLabel(referral.specialty)}</div>
                    <div className="text-sm text-muted-foreground">{isBangla ? "প্রাপক" : "To"} {getProfileDisplayName(referral.to_doctor)} - {isBangla ? "প্রেরক" : "from"} {getProfileDisplayName(referral.from_doctor)}</div>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge label={referral.urgency} tone={referral.urgency} />
                    <StatusBadge label={referral.status} tone={referral.status} />
                  </div>
                </div>
                <div className="mt-3 text-sm leading-6 text-muted-foreground">{referral.notes}</div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">{isBangla ? "এই স্ক্যানের সঙ্গে এখনও কোনো রেফারাল যুক্ত হয়নি।" : "No referrals attached to this scan yet."}</div>}
          </CardContent>
        </Card>
      </div>

      {previousScan ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isBangla ? "আগের স্ক্যানের সঙ্গে তুলনা" : "Compare with previous scan"}</CardTitle>
            <CardDescription>{isBangla ? "দীর্ঘমেয়াদি রিভিউয়ের জন্য তীব্রতা ও এক্সপ্লেনেবিলিটি পাশাপাশি তুলনা করুন।" : "Side-by-side severity and explainability comparison for longitudinal review."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            {[previousScan, scan].map((item, index) => (
              <div key={item.id} className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{index === 0 ? (isBangla ? "আগের স্ক্যান" : "Previous scan") : (isBangla ? "বর্তমান স্ক্যান" : "Current scan")}</div>
                    <div className="text-sm text-muted-foreground">{formatDateTime(item.created_at)}</div>
                  </div>
                  <StatusBadge label={item.severity} tone={item.severity} />
                </div>
                <div className="mt-4 space-y-3">
                  {item.xai_data.map((region) => (
                    <div key={region.region} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{region.region.replaceAll("_", " ")}</span>
                        <span>{Math.round(region.attention * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${region.attention * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </PageTransition>
  );
}
