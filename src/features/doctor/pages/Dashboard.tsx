import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, ClipboardList, ScanSearch, Send, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useChildren } from "@/shared/hooks/useChildren";
import { calculateAge, listReferrals, listScans } from "@/shared/lib/data";
import { formatDate } from "@/shared/lib/format";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { ReferralRecord, ScanRecord } from "@/shared/lib/types";

export default function DoctorDashboard() {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === "bn";
  const { profile } = useAuthStore();
  const { children, loading: childrenLoading } = useChildren(profile);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!profile) return;
      setLoading(true);
      const [scanRows, referralRows] = await Promise.all([listScans(profile), listReferrals(profile)]);
      if (!ignore) {
        setScans(scanRows);
        setReferrals(referralRows);
        setLoading(false);
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [profile]);

  const thisMonthScans = useMemo(() => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    return scans.filter((scan) => {
      const date = new Date(scan.created_at);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length;
  }, [scans]);

  const urgentScans = scans.filter((scan) => scan.severity === "severe" && scan.comorbidity_flags.some((flag) => flag.condition === "cardiac_defects" || flag.condition === "conductive_hearing_loss"));
  const avgSeverity = scans.length ? (scans.reduce((sum, scan) => sum + ({ mild: 1, moderate: 2, severe: 3 })[scan.severity], 0) / scans.length).toFixed(2) : "0.00";

  if (!profile || loading || childrenLoading) {
    return <div className="space-y-4"><div className="h-12 rounded-2xl bg-muted animate-pulse" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}</div></div>;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={isBangla ? `ক্লিনিক্যাল ড্যাশবোর্ড${profile.role === "chw" ? " (সিএইচডব্লিউ)" : ""}` : `Clinical dashboard${profile.role === "chw" ? " (CHW)" : ""}`}
        description={isBangla ? "আপনার গোল্ডেনস্কোপ এআই ওয়ার্কস্পেসে জরুরি ফলাফল, সাম্প্রতিক রোগী এবং রেফারাল কাজ পর্যবেক্ষণ করুন।" : "Monitor urgent findings, recent patients, and referral workload across your GoldenScope AI workspace."}
        actions={
          <>
            <Button asChild variant="outline" className="gap-2"><Link to="/doctor/referrals"><Send className="size-4" /> {isBangla ? "রেফারাল পাঠান" : "Send referral"}</Link></Button>
            <Button asChild className="gap-2"><Link to="/doctor/new-scan"><ScanSearch className="size-4" /> {profile.role === "chw" ? (isBangla ? "স্ক্যান জমা দিন" : "Submit scan") : (isBangla ? "নতুন স্ক্যান" : "New scan")}</Link></Button>
          </>
        }
      />

      {urgentScans.length ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-5 py-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" /> {isBangla ? "জরুরি ফলো-আপ প্রয়োজন" : "Urgent follow-up required"}</div>
          <div className="mt-1">
            {isBangla
              ? `${urgentScans.length} জন রোগীর তীব্র ফলাফল ও উচ্চ-অগ্রাধিকার কোমরবিডিটি ফ্ল্যাগ রয়েছে। কার্ডিয়াক স্ক্রিনিং ও রেফারাল সমন্বয়কে অগ্রাধিকার দিন।`
              : `${urgentScans.length} patients have severe findings with high-priority comorbidity flags. Prioritize cardiac screening and referral coordination.`}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title={isBangla ? "মোট রোগী" : "Total patients"} value={String(children.length)} hint={isBangla ? "আপনার ভূমিকায় নির্ধারিত বা দৃশ্যমান" : "Assigned or visible in your role"} icon={<UsersRound className="size-4 text-primary" />} />
        <MetricCard title={isBangla ? "এই মাসের স্ক্যান" : "Scans this month"} value={String(thisMonthScans)} hint={isBangla ? "বর্তমান মাসের নতুন কার্যক্রম" : "Fresh activity in current month"} icon={<ScanSearch className="size-4 text-primary" />} />
        <MetricCard title={isBangla ? "অপেক্ষমাণ রেফারাল" : "Pending referrals"} value={String(referrals.filter((referral) => referral.status !== "completed").length)} hint={isBangla ? "পাঠানো, গৃহীত বা বুকড" : "Sent, accepted, or booked"} icon={<Send className="size-4 text-primary" />} />
        <MetricCard title={isBangla ? "গড় তীব্রতা" : "Avg severity"} value={avgSeverity} hint={isBangla ? "১ মৃদু - ২ মাঝারি - ৩ তীব্র" : "1 mild - 2 moderate - 3 severe"} icon={<ClipboardList className="size-4 text-primary" />} />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{isBangla ? "সাম্প্রতিক রোগী" : "Recent patients"}</CardTitle>
          <CardDescription>{isBangla ? "স্ক্যান, নোট এবং রেফারাল পর্যালোচনা করতে যেকোনো কেস খুলুন।" : "Open any case to review scans, notes, and referrals."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isBangla ? "নাম" : "Name"}</TableHead>
                  <TableHead>{isBangla ? "বয়স" : "Age"}</TableHead>
                  <TableHead>{isBangla ? "সর্বশেষ স্ক্যান" : "Last scan"}</TableHead>
                  <TableHead>{isBangla ? "তীব্রতা" : "Severity"}</TableHead>
                  <TableHead>{isBangla ? "অ্যাকশন" : "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {children.map((child) => {
                  const latestScan = scans.find((scan) => scan.child_id === child.id);
                  return (
                    <TableRow key={child.id}>
                      <TableCell className="font-medium">{child.name}</TableCell>
                      <TableCell>{calculateAge(child.dob)}</TableCell>
                      <TableCell>{latestScan ? formatDate(latestScan.created_at) : (isBangla ? "কোনো স্ক্যান নেই" : "No scans")}</TableCell>
                      <TableCell>{latestScan ? <StatusBadge label={latestScan.severity} tone={latestScan.severity} /> : <StatusBadge label="pending" tone="negative" />}</TableCell>
                      <TableCell>
                        {latestScan ? (
                          <Button asChild variant="ghost" className="gap-2"><Link to={`/doctor/scans/${latestScan.id}`}>{isBangla ? "কেস খুলুন" : "Open case"} <ArrowRight className="size-4" /></Link></Button>
                        ) : (
                          <Button asChild variant="outline"><Link to="/doctor/new-scan">{isBangla ? "নতুন স্ক্যান" : "New scan"}</Link></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
