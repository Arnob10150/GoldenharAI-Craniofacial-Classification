import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, ClipboardList, ScanSearch, Send, UsersRound } from "lucide-react";
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
        title={`Clinical dashboard${profile.role === "chw" ? " (CHW)" : ""}`}
        description="Monitor urgent findings, recent patients, and referral workload across your GoldenScope AI workspace."
        actions={
          <>
            <Button asChild variant="outline" className="gap-2"><Link to="/doctor/referrals"><Send className="size-4" /> Send referral</Link></Button>
            <Button asChild className="gap-2"><Link to="/doctor/new-scan"><ScanSearch className="size-4" /> New scan</Link></Button>
          </>
        }
      />

      {urgentScans.length ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-5 py-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" /> Urgent follow-up required</div>
          <div className="mt-1">{urgentScans.length} patients have severe findings with high-priority comorbidity flags. Prioritize cardiac screening and referral coordination.</div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total patients" value={String(children.length)} hint="Assigned or visible in your role" icon={<UsersRound className="size-4 text-primary" />} />
        <MetricCard title="Scans this month" value={String(thisMonthScans)} hint="Fresh activity in current month" icon={<ScanSearch className="size-4 text-primary" />} />
        <MetricCard title="Pending referrals" value={String(referrals.filter((referral) => referral.status !== "completed").length)} hint="Sent, accepted, or booked" icon={<Send className="size-4 text-primary" />} />
        <MetricCard title="Avg severity" value={avgSeverity} hint="1 mild - 2 moderate - 3 severe" icon={<ClipboardList className="size-4 text-primary" />} />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Recent patients</CardTitle>
          <CardDescription>Open any case to review scans, notes, and referrals.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Last scan</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {children.map((child) => {
                  const latestScan = scans.find((scan) => scan.child_id === child.id);
                  return (
                    <TableRow key={child.id}>
                      <TableCell className="font-medium">{child.name}</TableCell>
                      <TableCell>{calculateAge(child.dob)}</TableCell>
                      <TableCell>{latestScan ? formatDate(latestScan.created_at) : "No scans"}</TableCell>
                      <TableCell>{latestScan ? <StatusBadge label={latestScan.severity} tone={latestScan.severity} /> : <StatusBadge label="pending" tone="negative" />}</TableCell>
                      <TableCell>
                        {latestScan ? (
                          <Button asChild variant="ghost" className="gap-2"><Link to={`/doctor/scans/${latestScan.id}`}>Open case <ArrowRight className="size-4" /></Link></Button>
                        ) : (
                          <Button asChild variant="outline"><Link to="/doctor/new-scan">New scan</Link></Button>
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

