import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { LoadingPanel } from "@/shared/components/LoadingPanel";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { ScanResultPanel } from "@/features/patient/components/ScanResultPanel";
import { SpecialistFinderSheet } from "@/shared/components/SpecialistFinderSheet";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useChildren } from "@/shared/hooks/useChildren";
import { listReferrals, listScans } from "@/shared/lib/data";
import { downloadPatientReport } from "@/shared/lib/pdf";
import { formatDate } from "@/shared/lib/format";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { ReferralRecord, ScanRecord } from "@/shared/lib/types";

const severityToScore = { mild: 1, moderate: 2, severe: 3 };

export default function ScanHistory() {
  const { profile } = useAuthStore();
  const { children, loading: childrenLoading } = useChildren(profile);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);
  const [childFilter, setChildFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [finderOpen, setFinderOpen] = useState(false);

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

  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const matchesChild = childFilter === "all" ? true : scan.child_id === childFilter;
      const matchesSeverity = severityFilter === "all" ? true : scan.severity === severityFilter;
      const scanDate = new Date(scan.created_at);
      const matchesFrom = dateFrom ? scanDate >= new Date(dateFrom) : true;
      const matchesTo = dateTo ? scanDate <= new Date(`${dateTo}T23:59:59`) : true;
      return matchesChild && matchesSeverity && matchesFrom && matchesTo;
    });
  }, [childFilter, dateFrom, dateTo, scans, severityFilter]);

  const chartData = useMemo(() => {
    return filteredScans
      .slice()
      .reverse()
      .map((scan) => ({
        date: formatDate(scan.created_at, "dd MMM"),
        severity: severityToScore[scan.severity],
        child: children.find((child) => child.id === scan.child_id)?.name || "Unknown",
      }));
  }, [children, filteredScans]);

  if (!profile || loading || childrenLoading) {
    return <LoadingPanel title="Loading scan history" description="Assembling past results, trends, and inline review panels." />;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader title="Scan history" description="Filter, review, and expand previous scan results for every linked child." />

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="size-4" /> Filters</CardTitle>
          <CardDescription>Use child, date, and severity filters to focus the timeline.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Child</label>
            <Select value={childFilter} onValueChange={setChildFilter}>
              <SelectTrigger><SelectValue placeholder="All children" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All children</SelectItem>
                {children.map((child) => <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Severity</label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger><SelectValue placeholder="All severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severity</SelectItem>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date from</label>
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date to</label>
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Severity trend</CardTitle>
          <CardDescription>Higher values indicate more severe AI findings over time.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="currentColor" tickLine={false} axisLine={false} />
              <YAxis domain={[1, 3]} tickFormatter={(value) => ["", "Mild", "Moderate", "Severe"][value]} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line dataKey="severity" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredScans.map((scan) => {
          const child = children.find((entry) => entry.id === scan.child_id);
          if (!child) return null;
          const referral = referrals.find((entry) => entry.scan_id === scan.id) ?? null;
          const expanded = expandedScanId === scan.id;
          return (
            <Card key={scan.id} className="border-border/70 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-lg font-semibold">{child.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{formatDate(scan.created_at)} · {scan.variant.replaceAll("_", " ")}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge label={scan.severity} tone={scan.severity} />
                    <span className="text-sm text-muted-foreground">Confidence {Math.round(scan.confidence * 100)}%</span>
                    <Button variant="outline" className="gap-2" onClick={() => setExpandedScanId(expanded ? null : scan.id)}>
                      {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      {expanded ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                </div>
                {expanded ? (
                  <div className="mt-6">
                    <ScanResultPanel
                      scan={scan}
                      child={child}
                      referral={referral}
                      onDownloadPatient={() => downloadPatientReport(scan, child, profile.language_pref)}
                      onFindSpecialist={() => setFinderOpen(true)}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SpecialistFinderSheet open={finderOpen} onOpenChange={setFinderOpen} district={profile.district} />
    </PageTransition>
  );
}
