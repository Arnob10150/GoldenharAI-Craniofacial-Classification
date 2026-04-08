import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { ScanResultPanel } from "@/features/patient/components/ScanResultPanel";
import { LoadingPanel } from "@/shared/components/LoadingPanel";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { SpecialistFinderSheet } from "@/shared/components/SpecialistFinderSheet";
import { getChildById, getScanById, listReferrals } from "@/shared/lib/data";
import { downloadPatientReport } from "@/shared/lib/pdf";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { Child, ReferralRecord, ScanRecord } from "@/shared/lib/types";

export default function PatientScanResult() {
  const { scanId } = useParams();
  const { profile } = useAuthStore();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [referral, setReferral] = useState<ReferralRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [finderOpen, setFinderOpen] = useState(false);

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
      const [childRow, referrals] = await Promise.all([
        getChildById(scanRow.child_id),
        listReferrals(profile),
      ]);
      if (!ignore) {
        setScan(scanRow);
        setChild(childRow);
        setReferral(referrals.find((entry) => entry.scan_id === scanRow.id) ?? null);
        setLoading(false);
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [profile, scanId]);

  if (loading) {
    return <LoadingPanel title="Opening result board" description="Loading the scan summary, care pathway, and referral status." />;
  }

  if (!profile || !scan || !child) {
    return (
      <PageTransition>
        <Card>
          <CardContent className="p-6">
            Scan result not found or unavailable in this account.
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={`Result board for ${child.name}`}
        description="Review the AI finding in a dedicated screen with care pathway, comorbidity flags, and specialist next steps."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/patient/new-scan">Analyze another image</Link>
            </Button>
            <Button asChild>
              <Link to="/patient/history">View scan history</Link>
            </Button>
          </>
        }
      />

      <ScanResultPanel
        scan={scan}
        child={child}
        referral={referral}
        onDownloadPatient={() => downloadPatientReport(scan, child, profile.language_pref)}
        onFindSpecialist={() => setFinderOpen(true)}
      />

      <SpecialistFinderSheet open={finderOpen} onOpenChange={setFinderOpen} district={profile.district} />
    </PageTransition>
  );
}
