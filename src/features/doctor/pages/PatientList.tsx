import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { LoadingPanel } from "@/shared/components/LoadingPanel";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useChildren } from "@/shared/hooks/useChildren";
import { useRealtimeReferrals } from "@/shared/hooks/useRealtimeReferrals";
import { calculateAge, getProfileDisplayName, listReferrals, listScans } from "@/shared/lib/data";
import { formatDate } from "@/shared/lib/format";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { ReferralRecord, ScanRecord } from "@/shared/lib/types";

const exportCsv = (rows: Array<Record<string, string | number>>) => {
  const headers = Object.keys(rows[0] || {});
  const lines = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "goldenscope-patient-list.csv";
  link.click();
  URL.revokeObjectURL(url);
};

export default function PatientList() {
  const { profile } = useAuthStore();
  const { children, loading: childrenLoading } = useChildren(profile);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");

  const refresh = useCallback(async () => {
    if (!profile) return;
    const [scanRows, referralRows] = await Promise.all([listScans(profile), listReferrals(profile)]);
    setScans(scanRows);
    setReferrals(referralRows);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeReferrals(profile, refresh);

  const rows = useMemo(() => {
    return children
      .map((child) => {
        const latestScan = scans.find((scan) => scan.child_id === child.id);
        const childReferrals = referrals.filter((referral) => referral.child_id === child.id);
        return {
          child,
          latestScan,
          latestReferral: childReferrals[0] ?? null,
        };
      })
      .filter(({ child, latestScan, latestReferral }) => {
        const matchesSearch = child.name.toLowerCase().includes(query.toLowerCase());
        if (!matchesSearch) return false;
        if (tab === "all") return true;
        if (tab === "severe") return latestScan?.severity === "severe";
        if (tab === "pending-referral") return latestReferral ? latestReferral.status !== "completed" : false;
        if (tab === "window") return latestScan ? latestScan.surgical_windows.some((window) => window.status === "upcoming" || window.status === "urgent") : false;
        return true;
      });
  }, [children, query, referrals, scans, tab]);

  if (!profile || loading || childrenLoading) {
    return <LoadingPanel title="Loading patient list" description="Preparing patient roster, latest scans, and referral status." />;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Patient list"
        description="Search, filter, and export the patient roster based on scan severity and referral status."
        actions={<Button variant="outline" className="gap-2" onClick={() => exportCsv(rows.map(({ child, latestScan, latestReferral }) => ({ Name: child.name, Age: calculateAge(child.dob), Severity: latestScan?.severity ?? "No scans", LastScan: latestScan ? formatDate(latestScan.created_at) : "", ReferralStatus: latestReferral?.status ?? "", Specialist: latestReferral ? getProfileDisplayName(latestReferral.to_doctor) : "" })))}><Download className="size-4" /> Export CSV</Button>}
      />

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Quickly focus on severity, pending referrals, or upcoming surgical windows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search patient by name" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="severe">Severe</TabsTrigger>
              <TabsTrigger value="pending-referral">Pending referral</TabsTrigger>
              <TabsTrigger value="window">Surgical window</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>{rows.length} visible patients after filters.</CardDescription>
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
                  <TableHead>Assigned specialist</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ child, latestScan, latestReferral }) => (
                  <TableRow key={child.id}>
                    <TableCell className="font-medium">{child.name}</TableCell>
                    <TableCell>{calculateAge(child.dob)}</TableCell>
                    <TableCell>{latestScan ? formatDate(latestScan.created_at) : "No scans"}</TableCell>
                    <TableCell>{latestScan ? <StatusBadge label={latestScan.severity} tone={latestScan.severity} /> : <StatusBadge label="pending" tone="negative" />}</TableCell>
                    <TableCell>{latestReferral ? getProfileDisplayName(latestReferral.to_doctor) : "Not assigned"}</TableCell>
                    <TableCell>{latestScan ? <Button asChild variant="ghost"><Link to={`/doctor/scans/${latestScan.id}`}>Open case</Link></Button> : <Button asChild variant="outline"><Link to="/doctor/new-scan">New scan</Link></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
