import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CircleMarker, MapContainer, TileLayer, Tooltip as MapTooltip } from "react-leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { useChildren } from "@/shared/hooks/useChildren";
import { calculateAge, listDoctors, listReferrals, listScans } from "@/shared/lib/data";
import { translateStatusLabel } from "@/shared/lib/i18n";
import { districtPoints } from "@/shared/lib/mock-data";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { Profile, ReferralRecord, ScanRecord } from "@/shared/lib/types";

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export default function Analytics() {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === "bn";
  const { profile } = useAuthStore();
  const { children, loading: childrenLoading } = useChildren(profile);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!profile) return;
      setLoading(true);
      const [scanRows, referralRows, doctorRows] = await Promise.all([
        listScans(profile),
        listReferrals(profile),
        listDoctors(),
      ]);
      if (!ignore) {
        setScans(scanRows);
        setReferrals(referralRows);
        setDoctors(doctorRows);
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
      const date = new Date(scan.created_at);
      const matchesFrom = dateFrom ? date >= new Date(dateFrom) : true;
      const matchesTo = dateTo ? date <= new Date(`${dateTo}T23:59:59`) : true;
      return matchesFrom && matchesTo;
    });
  }, [dateFrom, dateTo, scans]);

  const totalScans = filteredScans.length;
  const positiveDetections = filteredScans.filter((scan) => scan.classification === "positive").length;
  const avgAge = filteredScans.length
    ? (filteredScans.reduce((sum, scan) => {
        const child = children.find((entry) => entry.id === scan.child_id);
        return sum + (child ? calculateAge(child.dob) : 0);
      }, 0) / filteredScans.length).toFixed(1)
    : "0.0";
  const referralCompletionRate = referrals.length
    ? `${Math.round((referrals.filter((referral) => referral.status === "completed").length / referrals.length) * 100)}%`
    : "0%";

  const severityDistribution = ["mild", "moderate", "severe"].map((severity) => ({
    severity: translateStatusLabel(severity),
    count: filteredScans.filter((scan) => scan.severity === severity).length,
  }));

  const monthlyMap = new Map<string, number>();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - offset);
    monthlyMap.set(monthKey(date), 0);
  }
  filteredScans.forEach((scan) => {
    const key = monthKey(new Date(scan.created_at));
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
    }
  });
  const scansOverTime = Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count }));

  const ageDistribution = ["0-2", "3-5", "6-9", "10-13", "14+"];
  const ageHistogram = ageDistribution.map((bucket) => {
    const count = filteredScans.filter((scan) => {
      const child = children.find((entry) => entry.id === scan.child_id);
      if (!child) return false;
      const age = calculateAge(child.dob);
      if (bucket === "0-2") return age <= 2;
      if (bucket === "3-5") return age >= 3 && age <= 5;
      if (bucket === "6-9") return age >= 6 && age <= 9;
      if (bucket === "10-13") return age >= 10 && age <= 13;
      return age >= 14;
    }).length;
    return { bucket, count };
  });

  const districtCounts = districtPoints.map((point) => {
    const cases = filteredScans.filter((scan) => {
      const child = children.find((entry) => entry.id === scan.child_id);
      const doctor = doctors.find((entry) => entry.id === child?.assigned_doctor);
      const district = doctor?.district || profile?.district;
      return district === point.name;
    }).length;
    return { ...point, cases };
  }).filter((entry) => entry.cases > 0);

  const topDistricts = districtCounts.slice().sort((a, b) => b.cases - a.cases).slice(0, 5);

  if (!profile || loading || childrenLoading) {
    return <div className="space-y-4"><div className="h-12 rounded-2xl bg-muted animate-pulse" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-2xl bg-muted animate-pulse" />)}</div></div>;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={isBangla ? "অ্যানালিটিক্স" : "Analytics"}
        description={isBangla ? "দৃশ্যমান ডেটাসেট জুড়ে শনাক্তকরণ প্রবণতা, রেফারাল পারফরম্যান্স এবং জেলা-ভিত্তিক কেস ঘনত্ব ট্র্যাক করুন।" : "Track detection patterns, referral performance, and district-level concentration of cases across the visible dataset."}
      />

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{isBangla ? "তারিখের পরিসর" : "Date range"}</CardTitle>
          <CardDescription>{isBangla ? "এই ফিল্টার সব মেট্রিক কার্ড এবং চার্টে প্রয়োগ হবে।" : "Apply the filter to all metric cards and charts."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{isBangla ? "শুরু" : "From"}</label>
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{isBangla ? "শেষ" : "To"}</label>
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title={isBangla ? "মোট স্ক্যান" : "Total scans"} value={String(totalScans)} hint={isBangla ? "নির্বাচিত তারিখের মধ্যে" : "Within selected date range"} />
        <MetricCard title={isBangla ? "পজিটিভ শনাক্তকরণ" : "Positive detections"} value={String(positiveDetections)} hint={isBangla ? "এআই পজিটিভ হিসেবে ফ্ল্যাগ করেছে" : "AI flagged as positive"} />
        <MetricCard title={isBangla ? "শনাক্তকরণের গড় বয়স" : "Avg age at detection"} value={avgAge} hint={isBangla ? "বছর" : "Years"} />
        <MetricCard title={isBangla ? "রেফারাল সম্পন্ন" : "Referral completion"} value={referralCompletionRate} hint={isBangla ? "মোট রেফারালের মধ্যে সম্পন্ন" : "Completed referrals out of total"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isBangla ? "তীব্রতার বণ্টন" : "Severity distribution"}</CardTitle>
            <CardDescription>{isBangla ? "তীব্রতার স্তর অনুযায়ী স্ক্যানের সংখ্যা।" : "Count of scans by severity band."}</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityDistribution}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isBangla ? "সময়ের সাথে স্ক্যান" : "Scans over time"}</CardTitle>
            <CardDescription>{isBangla ? "গত ছয় মাসে মাসভিত্তিক স্ক্যানের সংখ্যা।" : "Monthly scan volume across the last six months."}</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scansOverTime}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line dataKey="count" stroke="var(--primary)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isBangla ? "জেলা হিটম্যাপ" : "District heatmap"}</CardTitle>
            <CardDescription>{isBangla ? "উপলব্ধ ডাক্তার-সংযুক্ত জেলা মেটাডেটা ব্যবহার করে কেস সংখ্যার ভিত্তিতে বৃত্তাকার মার্কার দেখানো হয়েছে।" : "Circle markers sized by case count using available doctor-linked district metadata."}</CardDescription>
          </CardHeader>
          <CardContent className="h-[430px] overflow-hidden rounded-3xl">
            <MapContainer center={[23.685, 90.3563]} zoom={7} scrollWheelZoom className="h-full w-full rounded-3xl">
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {districtCounts.map((district) => (
                <CircleMarker
                  key={district.name}
                  center={[district.lat, district.lng]}
                  radius={6 + district.cases * 2}
                  pathOptions={{ color: "#0F6E56", fillColor: "#0F6E56", fillOpacity: 0.55 }}
                >
                  <MapTooltip>
                    {district.name}: {district.cases} {isBangla ? "টি কেস" : "cases"}
                  </MapTooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{isBangla ? "শীর্ষ জেলা" : "Top districts"}</CardTitle>
              <CardDescription>{isBangla ? "নির্বাচিত পরিসরে সর্বোচ্চ দৃশ্যমান কেস সংখ্যা।" : "Highest visible case counts in the selected range."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topDistricts.map((district) => (
                <div key={district.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span>{district.name}</span><span>{district.cases}</span></div>
                  <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(district.cases * 15, 100)}%` }} /></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{isBangla ? "বয়সের বণ্টন" : "Age distribution"}</CardTitle>
              <CardDescription>{isBangla ? "স্ক্যানের সময় রোগীর বয়সের হিস্টোগ্রাম।" : "Histogram of patient age at scan time."}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageHistogram}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1D9E75" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
