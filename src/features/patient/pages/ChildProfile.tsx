import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
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
import { translateSexLabel, translateSpecialtyLabel } from "@/shared/lib/i18n";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { Child, Profile, ReferralRecord, ScanRecord } from "@/shared/lib/types";

const createChildSchema = (isBangla: boolean) => z.object({
  id: z.string().optional(),
  name: z.string().min(2, isBangla ? "শিশুর নাম লিখুন" : "Enter the child's name"),
  dob: z.string().min(1, isBangla ? "জন্মতারিখ নির্বাচন করুন" : "Select date of birth"),
  sex: z.enum(["male", "female"]),
  assigned_doctor: z.string().nullable().optional(),
}).superRefine((value, ctx) => {
  if (!isValidPediatricDob(value.dob)) {
    ctx.addIssue({
      code: "custom",
      path: ["dob"],
      message: isBangla ? `শিশুর বয়স ০-${MAX_CHILD_AGE} বছরের মধ্যে থাকতে হবে।` : `Child age must stay within 0-${MAX_CHILD_AGE} years.`,
    });
  }
});

type ChildForm = z.infer<ReturnType<typeof createChildSchema>>;

const emptyForm: ChildForm = {
  name: "",
  dob: "",
  sex: "male",
  assigned_doctor: null,
};

export default function ChildProfile() {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === "bn";
  const childSchema = useMemo(() => createChildSchema(isBangla), [isBangla]);
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
      toast.success(selectedChildId ? (isBangla ? "শিশুর প্রোফাইল আপডেট হয়েছে।" : "Child profile updated.") : (isBangla ? "শিশুর প্রোফাইল তৈরি হয়েছে।" : "Child profile created."));
      startEditing(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isBangla ? "শিশুর প্রোফাইল সংরক্ষণ করা যায়নি।" : "Unable to save child profile."));
    }
  });

  const onDelete = async (child: Child) => {
    if (!profile) return;
    const confirmed = window.confirm(
      isBangla
        ? `${child.name}-এর প্রোফাইল এবং যুক্ত সব স্ক্যান/রেফারাল মুছে ফেলতে চান? এটি আর ফেরত আনা যাবে না।`
        : `Delete ${child.name}'s profile and all linked scans/referrals? This cannot be undone.`,
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
      toast.success(isBangla ? "শিশুর প্রোফাইল মুছে ফেলা হয়েছে।" : "Child profile deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isBangla ? "শিশুর প্রোফাইল মুছে ফেলা যায়নি।" : "Unable to delete child profile."));
    }
  };

  if (!profile || loading) {
    return (
      <LoadingPanel
        title={isBangla ? "শিশুর প্রোফাইল লোড হচ্ছে" : "Loading child profiles"}
        description={isBangla ? "শিশুর রেকর্ড, যুক্ত স্ক্যান এবং আসন্ন অ্যাপয়েন্টমেন্ট প্রস্তুত করা হচ্ছে।" : "Preparing child records, linked scans, and upcoming appointments."}
      />
    );
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={isBangla ? "শিশুর প্রোফাইল" : "Child profiles"}
        description={isBangla ? "শিশুর রেকর্ড যোগ বা আপডেট করুন, যুক্ত স্ক্যান দেখুন, এবং নির্ধারিত বিশেষজ্ঞকে নজরে রাখুন।" : "Add or update child records, review linked scans, and keep assigned specialists in view."}
        actions={<Button variant="outline" className="gap-2" onClick={resetForm}><Plus className="size-4" /> {isBangla ? "নতুন প্রোফাইল" : "New profile"}</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{selectedChild ? (isBangla ? `${selectedChild.name} সম্পাদনা` : `Editing ${selectedChild.name}`) : (isBangla ? "শিশু যোগ করুন" : "Add a child")}</CardTitle>
            <CardDescription>{isBangla ? "স্ক্যানিং, ইতিহাস, রিপোর্ট এবং রেফারাল ওয়ার্কফ্লোতে এই প্রোফাইল ব্যবহার করা হয়।" : "Profiles are used across scanning, history, reporting, and referral workflows."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">{isBangla ? "নাম" : "Name"}</Label>
                <Input id="name" placeholder={isBangla ? "শিশুর নাম" : "Child name"} {...form.register("name")} />
                {form.formState.errors.name ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dob">{isBangla ? "জন্মতারিখ" : "Date of birth"}</Label>
                  <Input id="dob" type="date" min={minDob} max={maxDob} {...form.register("dob")} />
                  {form.formState.errors.dob ? <p className="text-sm text-destructive">{form.formState.errors.dob.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label>{isBangla ? "লিঙ্গ" : "Sex"}</Label>
                  <Controller
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={isBangla ? "লিঙ্গ নির্বাচন করুন" : "Select sex"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{translateSexLabel("male")}</SelectItem>
                          <SelectItem value="female">{translateSexLabel("female")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? "নির্ধারিত বিশেষজ্ঞ" : "Assigned specialist"}</Label>
                <Controller
                  control={form.control}
                  name="assigned_doctor"
                  render={({ field }) => (
                    <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={isBangla ? "নির্ধারিত ডাক্তার নির্বাচন করুন" : "Select assigned doctor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.full_name} - {doctor.specialty ? translateSpecialtyLabel(doctor.specialty) : doctor.district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit">{selectedChild ? (isBangla ? "পরিবর্তন সংরক্ষণ করুন" : "Save changes") : (isBangla ? "শিশু যোগ করুন" : "Add child")}</Button>
                {selectedChild ? <Button type="button" variant="outline" onClick={resetForm}>{isBangla ? "সম্পাদনা বাতিল" : "Cancel edit"}</Button> : null}
                {selectedChild ? <Button type="button" variant="destructive" onClick={() => void onDelete(selectedChild)}>{isBangla ? "প্রোফাইল মুছুন" : "Delete profile"}</Button> : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{isBangla ? "সংরক্ষিত শিশুর প্রোফাইল" : "Saved child profiles"}</CardTitle>
              <CardDescription>{isBangla ? "প্যারেন্ট পোর্টালের সাথে যুক্ত সবকিছু এখানে দেখা যাবে।" : "Everything linked to the parent portal appears here."}</CardDescription>
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
                            <div className="mt-1 text-sm text-muted-foreground">
                              {calculateAge(child.dob)} {isBangla ? "বছর" : "years"} - {translateSexLabel(child.sex)} - {isBangla ? "জন্ম" : "DOB"} {formatDate(child.dob)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {latestScan ? <StatusBadge label={latestScan.severity} tone={latestScan.severity} /> : <StatusBadge label="no_scans" tone="negative" />}
                            <Button variant="outline" className="gap-2" onClick={() => startEditing(child)}><Edit3 className="size-4" /> {isBangla ? "সম্পাদনা" : "Edit"}</Button>
                            <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => void onDelete(child)}><Trash2 className="size-4" /> {isBangla ? "মুছুন" : "Delete"}</Button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl bg-muted/40 p-4">
                            <div className="text-sm text-muted-foreground">{isBangla ? "মোট স্ক্যান" : "Total scans"}</div>
                            <div className="mt-2 text-2xl font-semibold">{childScans.length}</div>
                          </div>
                          <div className="rounded-2xl bg-muted/40 p-4">
                            <div className="text-sm text-muted-foreground">{isBangla ? "নির্ধারিত বিশেষজ্ঞ" : "Assigned specialist"}</div>
                            <div className="mt-2 font-semibold">{assignedDoctor?.full_name || (isBangla ? "নির্ধারিত নয়" : "Not assigned")}</div>
                          </div>
                          <div className="rounded-2xl bg-muted/40 p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" /> {isBangla ? "পরবর্তী অ্যাপয়েন্টমেন্ট" : "Next appointment"}</div>
                            <div className="mt-2 font-semibold">{nextAppointment?.appointment_date ? formatDate(nextAppointment.appointment_date) : (isBangla ? "বুক করা হয়নি" : "Not booked")}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title={isBangla ? "এখনও কোনো শিশুর প্রোফাইল নেই" : "No child profiles yet"} description={isBangla ? "স্ক্যান, PDF রিপোর্ট এবং কেয়ার ট্র্যাকিং চালু করতে প্রথম শিশুর প্রোফাইল তৈরি করুন।" : "Create the first child profile to unlock scanning, PDF reports, and care tracking."} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
