import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
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
import { useAuthStore } from "@/features/auth/store/authStore";
import type { ChildSex } from "@/shared/lib/types";

const formSchema = z.object({
  childMode: z.enum(["saved", "new"]),
  childId: z.string().optional(),
  name: z.string().optional(),
  dob: z.string().optional(),
  sex: z.enum(["male", "female"]).optional(),
}).superRefine((value, ctx) => {
  if (value.childMode === "saved" && !value.childId) {
    ctx.addIssue({ code: "custom", path: ["childId"], message: "Select a saved child profile" });
  }
  if (value.childMode === "new") {
    if (!value.name || value.name.length < 2) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "Enter the child's name" });
    }
    if (!value.dob) {
      ctx.addIssue({ code: "custom", path: ["dob"], message: "Select date of birth" });
    } else if (!isValidPediatricDob(value.dob)) {
      ctx.addIssue({ code: "custom", path: ["dob"], message: `Child age must stay within 0-${MAX_CHILD_AGE} years.` });
    }
    if (!value.sex) {
      ctx.addIssue({ code: "custom", path: ["sex"], message: "Select sex" });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

const analysisSteps = [
  "Uploading image securely",
  "Detecting patient regions",
  "Running inference and explainability",
  "Generating care pathway and report data",
];

export default function PatientNewScan() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { children, loading, setChildren } = useChildren(profile);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const minDob = useMemo(() => getOldestAllowedDob(), []);
  const maxDob = useMemo(() => getTodayInputDate(), []);

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
      setAnalysisStep((current) => Math.min(current + 1, analysisSteps.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [analyzing]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!profile || !file) {
      toast.error("Upload an image before submitting.");
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
      toast.success("Scan complete. Opening the result board.");
      navigate(`/patient/results/${scan.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to analyze scan.");
      setAnalyzing(false);
      setAnalysisStep(0);
    }
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader title="New scan" description="Upload a clinical image, select a saved child or create a new profile, and open the result on a dedicated board." />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Scan submission</CardTitle>
            <CardDescription>The result is saved automatically and opened on its own result board.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label>Child source</Label>
                <Controller
                  control={form.control}
                  name="childMode"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select child source" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saved">Use saved child profile</SelectItem>
                        <SelectItem value="new">Create a new child record</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {childMode === "saved" ? (
                <div className="space-y-2">
                  <Label>Saved child</Label>
                  <Controller
                    control={form.control}
                    name="childId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={loading || !children.length}>
                        <SelectTrigger><SelectValue placeholder={children.length ? "Select child" : "No saved profiles"} /></SelectTrigger>
                        <SelectContent>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>{child.name} · {calculateAge(child.dob)} years</SelectItem>
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
                    <Label htmlFor="name">Child name</Label>
                    <Input id="name" placeholder="Enter child name" {...form.register("name")} />
                    {form.formState.errors.name ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}
                  </div>
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
                          <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.sex ? <p className="text-sm text-destructive">{form.formState.errors.sex.message}</p> : null}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Clinical image</Label>
                <UploadDropzone value={file} onChange={setFile} />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={analyzing || !file}>
                {analyzing ? "AI analyzing..." : "Submit scan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Preview and progress</CardTitle>
            <CardDescription>Use this page for upload and monitoring. The full result opens on a separate board once the scan finishes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {previewUrl ? (
              <img src={previewUrl} alt="Scan preview" className="h-80 w-full rounded-3xl object-cover" />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                Image preview will appear here.
              </div>
            )}
            <div className="space-y-4 rounded-3xl bg-muted/35 p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Analysis progress</div>
                <div className="text-sm text-muted-foreground">{analyzing ? "Running" : "Waiting"}</div>
              </div>
              <Progress value={analyzing ? ((analysisStep + 1) / analysisSteps.length) * 100 : 0} />
              <div className="space-y-3">
                {analysisSteps.map((step, index) => {
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
