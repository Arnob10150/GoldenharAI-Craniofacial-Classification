import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, NotebookText, Stethoscope, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingPanel } from "@/shared/components/LoadingPanel";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useChildren } from "@/shared/hooks/useChildren";
import {
  calculateAge,
  getChildDisplayName,
  getSeverityAverage,
  listReferrals,
  listScans,
} from "@/shared/lib/data";
import { formatDate } from "@/shared/lib/format";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { ReferralRecord, ScanRecord } from "@/shared/lib/types";

export default function PatientDashboard() {
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

  const latestScan = scans[0] ?? null;
  const nextAppointment = referrals
    .filter((referral) => referral.appointment_date)
    .sort((left, right) => new Date(left.appointment_date || 0).getTime() - new Date(right.appointment_date || 0).getTime())[0] ?? null;

  const summary = useMemo(() => {
    return {
      totalChildren: children.length,
      totalScans: scans.length,
      latestSeverity: latestScan?.severity ?? "No scans yet",
      avgSeverity: scans.length ? String(getSeverityAverage(scans)) : "0.00",
    };
  }, [children.length, latestScan?.severity, scans]);

  if (!profile || loading || childrenLoading) {
    return <LoadingPanel title="Loading parent dashboard" description="Bringing together your children, scans, and upcoming care steps." />;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile.full_name.split(" ")[0]}`}
        description="Track your child's scan history, referrals, and next care steps from one place."
        actions={
          <>
            <Button asChild variant="outline"><Link to="/patient/children">Manage child profiles</Link></Button>
            <Button asChild><Link to="/patient/new-scan">Start new scan</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Children linked" value={String(summary.totalChildren)} hint="Profiles you can scan and track" icon={<Users className="size-4 text-primary" />} />
        <MetricCard title="Total scans" value={String(summary.totalScans)} hint="All scans across your children" icon={<NotebookText className="size-4 text-primary" />} />
        <MetricCard title="Latest severity" value={String(summary.latestSeverity)} hint={latestScan ? `Last scan on ${formatDate(latestScan.created_at)}` : "No result yet"} icon={<Stethoscope className="size-4 text-primary" />} />
        <MetricCard title="Next appointment" value={nextAppointment?.appointment_date ? formatDate(nextAppointment.appointment_date) : "Pending"} hint={nextAppointment ? nextAppointment.specialty : "No booked referral yet"} icon={<CalendarDays className="size-4 text-primary" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Family overview</CardTitle>
            <CardDescription>Each child profile with age, assigned doctor, and most recent scan status.</CardDescription>
          </CardHeader>
          <CardContent>
            {children.length ? (
              <div className="space-y-4">
                {children.map((child) => {
                  const childScans = scans.filter((scan) => scan.child_id === child.id);
                  const latest = childScans[0];
                  return (
                    <div key={child.id} className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/60 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-semibold">{child.name}</div>
                        <div className="text-sm text-muted-foreground">{calculateAge(child.dob)} years · {child.sex}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge label={latest?.severity ?? "no scans"} tone={latest ? latest.severity : "negative"} />
                        <Button asChild variant="ghost" className="gap-2"><Link to="/patient/history">View history <ArrowRight className="size-4" /></Link></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No child profiles yet" description="Add your first child profile to start scans, reports, and specialist follow-up." actionLabel="Add child" onAction={() => window.location.assign("/patient/children")} />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Recent scan results</CardTitle>
            <CardDescription>Latest findings across all linked children.</CardDescription>
          </CardHeader>
          <CardContent>
            {scans.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Child</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scans.slice(0, 5).map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">{getChildDisplayName(scan.child_id)}</TableCell>
                        <TableCell><StatusBadge label={scan.severity} tone={scan.severity} /></TableCell>
                        <TableCell>{Math.round(scan.confidence * 100)}%</TableCell>
                        <TableCell>{formatDate(scan.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No scans submitted" description="Start with a new scan to generate AI results, PDF reports, and specialist recommendations." actionLabel="New scan" onAction={() => window.location.assign("/patient/new-scan")} />
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
