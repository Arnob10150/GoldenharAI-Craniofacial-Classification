import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCircle2, LoaderCircle } from "lucide-react";
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
import { Progress } from "@/shared/ui/progress";
import { UploadDropzone } from "@/features/patient/components/UploadDropzone";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { useChildren } from "@/shared/hooks/useChildren";
import {
  analyzeAndPersistScan,
  calculateAge,
  getOldestAllowedDob,
  getTodayInputDate,
  isValidPediatricDob,
  listChildren,
  MAX_CHILD_AGE,
} from "@/shared/lib/data";
import { translateSexLabel } from "@/shared/lib/i18n";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { ChildSex } from "@/shared/lib/types";

const createFormSchema = (isBangla: boolean) => z.object({
  childMode: z.enum(["saved", "new"]),
  childId: z.string().optional(),
  name: z.string().optional(),
  dob: z.string().optional(),
  sex: z.enum(["male", "female"]).optional(),
}).superRefine((value, ctx) => {
  if (value.childMode === "saved" && !value.childId) {
    ctx.addIssue({ code: "custom", path: ["childId"], message: isBangla ? "সংরক্ষিত শিশুর প্রোফাইল নির্বাচন করুন" : "Select a saved child profile" });
  }
  if (value.childMode === "new") {
    if (!value.name || value.name.length < 2) {
      ctx.addIssue({ code: "custom", path: ["name"], message: isBangla ? "শিশুর নাম লিখুন" : "Enter the child's name" });
    }
    if (!value.dob) {
      ctx.addIssue({ code: "custom", path: ["dob"], message: isBangla ? "জন্মতারিখ নির্বাচন করুন" : "Select date of birth" });
    } else if (!isValidPediatricDob(value.dob)) {
      ctx.addIssue({ code: "custom", path: ["dob"], message: isBangla ? `শিশুর বয়স ০-${MAX_CHILD_AGE} বছরের মধ্যে থাকতে হবে।` : `Child age must stay within 0-${MAX_CHILD_AGE} years.` });
    }
    if (!value.sex) {
      ctx.addIssue({ code: "custom", path: ["sex"], message: isBangla ? "লিঙ্গ নির্বাচন করুন" : "Select sex" });
    }
  }
});

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

const analysisSteps = {
  en: [
    "Uploading image securely",
    "Detecting patient regions",
    "Running inference and explainability",
    "Generating care pathway and report data",
  ],
  bn: [
    "নিরাপদভাবে ছবি আপলোড করা হচ্ছে",
    "রোগীর অঞ্চল শনাক্ত করা হচ্ছে",
    "ইনফারেন্স ও ব্যাখ্যাযোগ্যতা চালানো হচ্ছে",
    "কেয়ার পাথওয়ে ও রিপোর্ট ডেটা তৈরি করা হচ্ছে",
  ],
} as const;

export default function PatientNewScan() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isBangla = i18n.language === "bn";
  const formSchema = useMemo(() => createFormSchema(isBangla), [isBangla]);
  const { profile } = useAuthStore();
  const { children, loading, setChildren } = useChildren(profile);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const minDob = useMemo(() => getOldestAllowedDob(), []);
  const maxDob = useMemo(() => getTodayInputDate(), []);
  const localizedSteps = isBangla ? analysisSteps.bn : analysisSteps.en;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childMode: children.length ? "saved" : "new",
      childId: children[0]?.id,
      name: "",
      dob: "",
      sex: "male",
    },
  });

  const childMode = useWatch({ control: form.control, name: "childMode" });
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!analyzing) return;
    const timer = window.setInterval(() => {
      setAnalysisStep((current) => Math.min(current + 1, localizedSteps.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [analyzing, localizedSteps.length]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!profile || !file) {
      toast.error(isBangla ? "জমা দেওয়ার আগে একটি ছবি আপলোড করুন।" : "Upload an image before submitting.");
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisStep(0);

      const selectedChild = values.childMode === "saved"
        ? children.find((child) => child.id === values.childId) ?? null
        : null;

      const patientAge = selectedChild ? calculateAge(selectedChild.dob) : calculateAge(values.dob || new Date().toISOString());
      const patientSex = (selectedChild?.sex || values.sex || "male") as ChildSex;

      const scan = await analyzeAndPersistScan({
        file,
        childId: selectedChild?.id,
        childDraft: values.childMode === "new"
          ? {
              name: values.name || "",
              dob: values.dob || "",
              sex: patientSex,
            }
          : undefined,
        patientAge,
        patientSex,
        actorProfile: profile,
      });

      const refreshedChildren = await listChildren(profile);
      setChildren(refreshedChildren);
      toast.success(isBangla ? "স্ক্যান সম্পন্ন হয়েছে। রেজাল্ট বোর্ড খোলা হচ্ছে।" : "Scan complete. Opening the result board.");
      navigate(`/patient/results/${scan.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isBangla ? "স্ক্যান বিশ্লেষণ করা যায়নি।" : "Unable to analyze scan."));
      setAnalyzing(false);
      setAnalysisStep(0);
    }
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={isBangla ? "নতুন স্ক্যান" : "New scan"}
        description={isBangla ? "একটি ক্লিনিক্যাল ছবি আপলোড করুন, সংরক্ষিত শিশু নির্বাচন করুন অথবা নতুন প্রোফাইল তৈরি করুন, তারপর আলাদা রেজাল্ট বোর্ডে ফলাফল খুলুন।" : "Upload a clinical image, select a saved child or create a new profile, and open the result on a dedicated board."}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isBangla ? "স্ক্যান জমা" : "Scan submission"}</CardTitle>
            <CardDescription>{isBangla ? "ফলাফল স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে এবং আলাদা রেজাল্ট বোর্ডে খোলা হবে।" : "The result is saved automatically and opened on its own result board."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label>{isBangla ? "শিশুর উৎস" : "Child source"}</Label>
                <Controller
                  control={form.control}
                  name="childMode"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder={isBangla ? "শিশুর উৎস নির্বাচন করুন" : "Select child source"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saved">{isBangla ? "সংরক্ষিত শিশুর প্রোফাইল ব্যবহার করুন" : "Use saved child profile"}</SelectItem>
                        <SelectItem value="new">{isBangla ? "নতুন শিশুর রেকর্ড তৈরি করুন" : "Create a new child record"}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {childMode === "saved" ? (
                <div className="space-y-2">
                  <Label>{isBangla ? "সংরক্ষিত শিশু" : "Saved child"}</Label>
                  <Controller
                    control={form.control}
                    name="childId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={loading || !children.length}>
                        <SelectTrigger><SelectValue placeholder={children.length ? (isBangla ? "শিশু নির্বাচন করুন" : "Select child") : (isBangla ? "কোনো সংরক্ষিত প্রোফাইল নেই" : "No saved profiles")} /></SelectTrigger>
                        <SelectContent>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>{child.name} · {calculateAge(child.dob)} {isBangla ? "বছর" : "years"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.childId ? <p className="text-sm text-destructive">{form.formState.errors.childId.message}</p> : null}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">{isBangla ? "শিশুর নাম" : "Child name"}</Label>
                    <Input id="name" placeholder={isBangla ? "শিশুর নাম লিখুন" : "Enter child name"} {...form.register("name")} />
                    {form.formState.errors.name ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}
                  </div>
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
                          <SelectTrigger><SelectValue placeholder={isBangla ? "লিঙ্গ নির্বাচন করুন" : "Select sex"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">{translateSexLabel("male")}</SelectItem>
                            <SelectItem value="female">{translateSexLabel("female")}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.sex ? <p className="text-sm text-destructive">{form.formState.errors.sex.message}</p> : null}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{isBangla ? "ক্লিনিক্যাল ছবি" : "Clinical image"}</Label>
                <UploadDropzone value={file} onChange={setFile} />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={analyzing || !file}>
                {analyzing ? (isBangla ? "এআই বিশ্লেষণ করছে..." : "AI analyzing...") : (isBangla ? "স্ক্যান জমা দিন" : "Submit scan")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isBangla ? "প্রিভিউ ও অগ্রগতি" : "Preview and progress"}</CardTitle>
            <CardDescription>{isBangla ? "এই পেজে আপলোড ও অগ্রগতি দেখুন। স্ক্যান শেষ হলে পূর্ণ ফলাফল আলাদা বোর্ডে খুলবে।" : "Use this page for upload and monitoring. The full result opens on a separate board once the scan finishes."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {previewUrl ? (
              <img src={previewUrl} alt={isBangla ? "স্ক্যান প্রিভিউ" : "Scan preview"} className="h-80 w-full rounded-3xl object-cover" />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                {isBangla ? "ছবির প্রিভিউ এখানে দেখা যাবে।" : "Image preview will appear here."}
              </div>
            )}
            <div className="space-y-4 rounded-3xl bg-muted/35 p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{isBangla ? "বিশ্লেষণের অগ্রগতি" : "Analysis progress"}</div>
                <div className="text-sm text-muted-foreground">{analyzing ? (isBangla ? "চলছে" : "Running") : (isBangla ? "অপেক্ষায়" : "Waiting")}</div>
              </div>
              <Progress value={analyzing ? ((analysisStep + 1) / localizedSteps.length) * 100 : 0} />
              <div className="space-y-3">
                {localizedSteps.map((step, index) => {
                  const complete = analyzing ? index <= analysisStep : false;
                  return (
                    <div key={step} className="flex items-center gap-3 text-sm">
                      {complete ? <CheckCircle2 className="size-4 text-primary" /> : <LoaderCircle className={`size-4 ${analyzing && index === analysisStep ? "animate-spin text-primary" : "text-muted-foreground"}`} />}
                      <span className={complete ? "font-medium text-foreground" : "text-muted-foreground"}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
