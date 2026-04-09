import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const exportCsv = (rows: Array<Record<string, string | number>>, filename: string) => {
  const headers = Object.keys(rows[0] || {});
  const lines = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function PatientList() {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === "bn";
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
    return (
      <LoadingPanel
        title={isBangla ? "রোগীর তালিকা লোড হচ্ছে" : "Loading patient list"}
        description={isBangla ? "রোগীর তালিকা, সর্বশেষ স্ক্যান এবং রেফারাল অবস্থা প্রস্তুত করা হচ্ছে।" : "Preparing patient roster, latest scans, and referral status."}
      />
    );
  }

  const csvRows = rows.map(({ child, latestScan, latestReferral }) => ({
    Name: child.name,
    Age: calculateAge(child.dob),
    Severity: latestScan?.severity ?? (isBangla ? "কোনো স্ক্যান নেই" : "No scans"),
    LastScan: latestScan ? formatDate(latestScan.created_at) : "",
    ReferralStatus: latestReferral?.status ?? "",
    Specialist: latestReferral ? getProfileDisplayName(latestReferral.to_doctor) : "",
  }));

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={isBangla ? "রোগীর তালিকা" : "Patient list"}
        description={isBangla ? "স্ক্যানের তীব্রতা এবং রেফারাল অবস্থার ভিত্তিতে রোগীর তালিকা অনুসন্ধান, ফিল্টার এবং এক্সপোর্ট করুন।" : "Search, filter, and export the patient roster based on scan severity and referral status."}
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => exportCsv(csvRows, isBangla ? "goldenscope-patient-list-bn.csv" : "goldenscope-patient-list.csv")}
          >
            <Download className="size-4" /> {isBangla ? "CSV এক্সপোর্ট" : "Export CSV"}
          </Button>
        }
      />

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{isBangla ? "ফিল্টার" : "Filters"}</CardTitle>
          <CardDescription>{isBangla ? "তীব্র, অসম্পূর্ণ রেফারাল, অথবা আসন্ন সার্জিকাল উইন্ডো দ্রুত খুঁজে নিন।" : "Quickly focus on severity, pending referrals, or upcoming surgical windows."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={isBangla ? "নাম দিয়ে রোগী খুঁজুন" : "Search patient by name"}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="all">{isBangla ? "সব" : "All"}</TabsTrigger>
              <TabsTrigger value="severe">{isBangla ? "তীব্র" : "Severe"}</TabsTrigger>
              <TabsTrigger value="pending-referral">{isBangla ? "অপেক্ষমাণ রেফারাল" : "Pending referral"}</TabsTrigger>
              <TabsTrigger value="window">{isBangla ? "সার্জিকাল উইন্ডো" : "Surgical window"}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{isBangla ? "রোস্টার" : "Roster"}</CardTitle>
          <CardDescription>{isBangla ? `ফিল্টারের পরে ${rows.length} জন রোগী দেখা যাচ্ছে।` : `${rows.length} visible patients after filters.`}</CardDescription>
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
                  <TableHead>{isBangla ? "নির্ধারিত বিশেষজ্ঞ" : "Assigned specialist"}</TableHead>
                  <TableHead>{isBangla ? "অ্যাকশন" : "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ child, latestScan, latestReferral }) => (
                  <TableRow key={child.id}>
                    <TableCell className="font-medium">{child.name}</TableCell>
                    <TableCell>{calculateAge(child.dob)}</TableCell>
                    <TableCell>{latestScan ? formatDate(latestScan.created_at) : (isBangla ? "কোনো স্ক্যান নেই" : "No scans")}</TableCell>
                    <TableCell>
                      {latestScan ? (
                        <StatusBadge label={latestScan.severity} tone={latestScan.severity} />
                      ) : (
                        <StatusBadge label="pending" tone="negative" />
                      )}
                    </TableCell>
                    <TableCell>{latestReferral ? getProfileDisplayName(latestReferral.to_doctor) : (isBangla ? "নির্ধারিত নয়" : "Not assigned")}</TableCell>
                    <TableCell>
                      {latestScan ? (
                        <Button asChild variant="ghost">
                          <Link to={`/doctor/scans/${latestScan.id}`}>{isBangla ? "কেস খুলুন" : "Open case"}</Link>
                        </Button>
                      ) : (
                        <Button asChild variant="outline">
                          <Link to="/doctor/new-scan">{isBangla ? "নতুন স্ক্যান" : "New scan"}</Link>
                        </Button>
                      )}
                    </TableCell>
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
