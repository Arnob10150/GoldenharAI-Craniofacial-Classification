import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarDays, Edit3, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingPanel } from "@/shared/components/LoadingPanel";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useChildren } from "@/shared/hooks/useChildren";
import {
  calculateAge,
  deleteChildProfile,
  getOldestAllowedDob,
  getTodayInputDate,
  isValidPediatricDob,
  listDoctors,
  listReferrals,
  listScans,
  MAX_CHILD_AGE,
  upsertChild,
} from "@/shared/lib/data";
import { formatDate } from "@/shared/lib/format";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { Child, Profile, ReferralRecord, ScanRecord } from "@/shared/lib/types";

const childSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Enter the child's name"),
  dob: z.string().min(1, "Select date of birth"),
  sex: z.enum(["male", "female"]),
  assigned_doctor: z.string().nullable().optional(),
}).superRefine((value, ctx) => {
  if (!isValidPediatricDob(value.dob)) {
    ctx.addIssue({
      code: "custom",
      path: ["dob"],
      message: `Child age must stay within 0-${MAX_CHILD_AGE} years.`,
    });
  }
});

type ChildForm = z.infer<typeof childSchema>;

const emptyForm: ChildForm = {
  name: "",
  dob: "",
  sex: "male",
  assigned_doctor: null,
};

export default function ChildProfile() {
  const { profile } = useAuthStore();
  const { children, loading, setChildren } = useChildren(profile);
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const minDob = useMemo(() => getOldestAllowedDob(), []);
  const maxDob = useMemo(() => getTodayInputDate(), []);

  const form = useForm<ChildForm>({
    resolver: zodResolver(childSchema),
    defaultValues: emptyForm,
  });

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!profile) return;
      const [doctorRows, scanRows, referralRows] = await Promise.all([
        listDoctors(),
        listScans(profile),
        listReferrals(profile),
      ]);
      if (!ignore) {
        setDoctors(doctorRows);
        setScans(scanRows);
        setReferrals(referralRows);
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [profile]);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId],
  );

  const startEditing = (child: Child) => {
    setSelectedChildId(child.id);
    form.reset({
      id: child.id,
      name: child.name,
      dob: child.dob,
      sex: child.sex,
      assigned_doctor: child.assigned_doctor ?? null,
    });
  };

  const resetForm = () => {
    setSelectedChildId(null);
    form.reset(emptyForm);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!profile) return;
    try {
      const saved = await upsertChild(profile, values);
      setChildren((current) => {
        const exists = current.some((entry) => entry.id === saved.id);
        return exists ? current.map((entry) => (entry.id === saved.id ? saved : entry)) : [saved, ...current];
      });
      toast.success(selectedChildId ? "Child profile updated." : "Child profile created.");
      startEditing(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save child profile.");
    }
  });

  const onDelete = async (child: Child) => {
    if (!profile) return;
    const confirmed = window.confirm(
      `Delete ${child.name}'s profile and all linked scans/referrals? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteChildProfile(profile, child.id);
      setChildren((current) => current.filter((entry) => entry.id !== child.id));
      setScans((current) => current.filter((entry) => entry.child_id !== child.id));
      setReferrals((current) => current.filter((entry) => entry.child_id !== child.id));
      if (selectedChildId === child.id) {
        resetForm();
      }
      toast.success("Child profile deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete child profile.");
    }
  };

  if (!profile || loading) {
    return <LoadingPanel title="Loading child profiles" description="Preparing child records, linked scans, and upcoming appointments." />;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Child profiles"
        description="Add or update child records, review linked scans, and keep assigned specialists in view."
        actions={<Button variant="outline" className="gap-2" onClick={resetForm}><Plus className="size-4" /> New profile</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{selectedChild ? `Editing ${selectedChild.name}` : "Add a child"}</CardTitle>
            <CardDescription>Profiles are used across scanning, history, reporting, and referral workflows.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Child name" {...form.register("name")} />
                {form.formState.errors.name ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input id="dob" type="date" min={minDob} max={maxDob} {...form.register("dob")} />
                    {form.formState.errors.dob ? <p className="text-sm text-destructive">{form.formState.errors.dob.message}</p> : null}
                  </div>
                <div className="space-y-2">
                  <Label>Sex</Label>
                  <Controller
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assigned specialist</Label>
                <Controller
                  control={form.control}
                  name="assigned_doctor"
                  render={({ field }) => (
                    <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assigned doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>{doctor.full_name} - {doctor.specialty || doctor.district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit">{selectedChild ? "Save changes" : "Add child"}</Button>
                {selectedChild ? <Button type="button" variant="outline" onClick={resetForm}>Cancel edit</Button> : null}
                {selectedChild ? <Button type="button" variant="destructive" onClick={() => void onDelete(selectedChild)}>Delete profile</Button> : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Saved child profiles</CardTitle>
              <CardDescription>Everything linked to the parent portal appears here.</CardDescription>
            </CardHeader>
            <CardContent>
              {children.length ? (
                <div className="space-y-4">
                  {children.map((child) => {
                    const childScans = scans.filter((scan) => scan.child_id === child.id);
                    const latestScan = childScans[0];
                    const nextAppointment = referrals.find((referral) => referral.child_id === child.id && referral.appointment_date);
                    const assignedDoctor = doctors.find((doctor) => doctor.id === child.assigned_doctor);

                    return (
                      <div key={child.id} className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-3 text-lg font-semibold">
                              <UserRound className="size-4 text-primary" />
                              {child.name}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">{calculateAge(child.dob)} years - {child.sex} - DOB {formatDate(child.dob)}</div>
                          </div>
                          <div className="flex gap-2">
                            {latestScan ? <StatusBadge label={latestScan.severity} tone={latestScan.severity} /> : <StatusBadge label="no scans" tone="negative" />}
                            <Button variant="outline" className="gap-2" onClick={() => startEditing(child)}><Edit3 className="size-4" /> Edit</Button>
                            <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => void onDelete(child)}><Trash2 className="size-4" /> Delete</Button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl bg-muted/40 p-4">
                            <div className="text-sm text-muted-foreground">Total scans</div>
                            <div className="mt-2 text-2xl font-semibold">{childScans.length}</div>
                          </div>
                          <div className="rounded-2xl bg-muted/40 p-4">
                            <div className="text-sm text-muted-foreground">Assigned specialist</div>
                            <div className="mt-2 font-semibold">{assignedDoctor?.full_name || "Not assigned"}</div>
                          </div>
                          <div className="rounded-2xl bg-muted/40 p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" /> Next appointment</div>
                            <div className="mt-2 font-semibold">{nextAppointment?.appointment_date ? formatDate(nextAppointment.appointment_date) : "Not booked"}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No child profiles yet" description="Create the first child profile to unlock scanning, PDF reports, and care tracking." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

