import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCheck, Clock3, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useRealtimeReferrals } from "@/shared/hooks/useRealtimeReferrals";
import { getChildDisplayName, getProfileDisplayName, listReferrals, updateReferralStatus } from "@/shared/lib/data";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { ReferralRecord } from "@/shared/lib/types";

const statusOrder: ReferralRecord["status"][] = ["sent", "accepted", "booked", "completed"];

export default function Referrals() {
  const { profile } = useAuthStore();
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const rows = await listReferrals(profile);
    setReferrals(rows);
    setSelectedId((current) => current ?? rows[0]?.id ?? null);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeReferrals(profile, refresh);

  const selectedReferral = useMemo(() => referrals.find((referral) => referral.id === selectedId) ?? null, [referrals, selectedId]);

  useEffect(() => {
    setAppointmentDate(selectedReferral?.appointment_date ?? "");
  }, [selectedReferral?.appointment_date, selectedReferral?.id]);

  const advanceStatus = async (status: ReferralRecord["status"]) => {
    if (!selectedReferral) return;
    const updated = await updateReferralStatus(selectedReferral.id, status, appointmentDate || selectedReferral.appointment_date);
    if (updated) {
      setReferrals((current) => current.map((referral) => referral.id === updated.id ? updated : referral));
      toast.success(`Referral marked as ${status}.`);
    }
  };

  if (!profile || loading) {
    return <div className="space-y-4"><div className="h-12 rounded-2xl bg-muted animate-pulse" /><div className="h-96 rounded-2xl bg-muted animate-pulse" /></div>;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader title="Referrals" description="Monitor sent and received referrals with realtime status updates across the care pipeline." />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Referral queue</CardTitle>
            <CardDescription>{referrals.length} total referrals in your visible workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {referrals.map((referral) => (
              <button
                key={referral.id}
                type="button"
                className={`w-full rounded-3xl border p-4 text-left transition ${selectedId === referral.id ? "border-primary bg-primary/5" : "border-border/60 bg-card/60 hover:bg-muted/40"}`}
                onClick={() => setSelectedId(referral.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{getChildDisplayName(referral.child_id)} - {referral.specialty}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{getProfileDisplayName(referral.from_doctor)}{" -> "}{getProfileDisplayName(referral.to_doctor)}</div>
                  </div>
                  <StatusBadge label={referral.status} tone={referral.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{formatDateTime(referral.created_at)}</span>
                  <StatusBadge label={referral.urgency} tone={referral.urgency} className="text-[11px]" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Referral detail</CardTitle>
            <CardDescription>Open a referral to inspect notes, appointment timing, and move it through the pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedReferral ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-muted/40 p-4">
                    <div className="text-sm text-muted-foreground">Child</div>
                    <div className="mt-2 text-xl font-semibold">{getChildDisplayName(selectedReferral.child_id)}</div>
                  </div>
                  <div className="rounded-3xl bg-muted/40 p-4">
                    <div className="text-sm text-muted-foreground">Specialty</div>
                    <div className="mt-2 text-xl font-semibold">{selectedReferral.specialty}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold">Status pipeline</div>
                  <div className="grid gap-3 md:grid-cols-4">
                    {statusOrder.map((status) => (
                      <div key={status} className={`rounded-2xl border p-3 text-center ${statusOrder.indexOf(status) <= statusOrder.indexOf(selectedReferral.status) ? "border-primary bg-primary/5" : "border-border/60 bg-card/60"}`}>
                        <div className="text-sm font-medium capitalize">{status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold"><SendHorizontal className="size-4 text-primary" /> Routing</div>
                    <div className="mt-3 text-sm text-muted-foreground">From {getProfileDisplayName(selectedReferral.from_doctor)}</div>
                    <div className="mt-1 text-sm text-muted-foreground">To {getProfileDisplayName(selectedReferral.to_doctor)}</div>
                    <div className="mt-1 text-sm text-muted-foreground">Created {formatDateTime(selectedReferral.created_at)}</div>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="size-4 text-primary" /> Appointment</div>
                    <Input className="mt-3" type="date" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} />
                    <div className="mt-2 text-sm text-muted-foreground">Current: {selectedReferral.appointment_date ? formatDate(selectedReferral.appointment_date) : "Not booked"}</div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-sm">
                  <div className="text-sm font-semibold">Referral note</div>
                  <div className="mt-3 text-sm leading-7 text-muted-foreground">{selectedReferral.notes}</div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {selectedReferral.status === "sent" ? <Button className="gap-2" onClick={() => void advanceStatus("accepted")}><CheckCheck className="size-4" /> Accept</Button> : null}
                  {selectedReferral.status === "accepted" ? <Button className="gap-2" onClick={() => void advanceStatus("booked")}><CalendarDays className="size-4" /> Mark booked</Button> : null}
                  {selectedReferral.status === "booked" ? <Button className="gap-2" onClick={() => void advanceStatus("completed")}><Clock3 className="size-4" /> Mark completed</Button> : null}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">No referral selected yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

