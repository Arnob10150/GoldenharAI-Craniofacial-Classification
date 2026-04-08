import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FilePlus2, LoaderCircle, SendHorizontal } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";
import { Progress } from "@/shared/ui/progress";
import { UploadDropzone } from "@/features/patient/components/UploadDropzone";
import { ScanResultPanel } from "@/features/patient/components/ScanResultPanel";
import { LoadingPanel } from "@/shared/components/LoadingPanel";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { useChildren } from "@/shared/hooks/useChildren";
import {
  analyzeAndPersistScan,
  calculateAge,
  createReferral,
  createReferralDraft,
  getOldestAllowedDob,
  getTodayInputDate,
  isValidPediatricDob,
  listChildren,
  listDoctors,
  MAX_CHILD_AGE,
} from "@/shared/lib/data";
import { downloadClinicalReport, downloadPatientReport } from "@/shared/lib/pdf";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { Child, ChildSex, Profile, ReferralRecord, ScanRecord, SegmentationFinding, Specialty } from "@/shared/lib/types";

const scanSchema = z.object({
  patientMode: z.enum(["saved", "new"]),
  childId: z.string().optional(),
  name: z.string().optional(),
  dob: z.string().optional(),
  sex: z.enum(["male", "female"]).optional(),
}).superRefine((value, ctx) => {
  if (value.patientMode === "saved" && !value.childId) {
    ctx.addIssue({ code: "custom", path: ["childId"], message: "Select a patient" });
  }
  if (value.patientMode === "new") {
    if (!value.name) ctx.addIssue({ code: "custom", path: ["name"], message: "Enter patient name" });
    if (!value.dob) ctx.addIssue({ code: "custom", path: ["dob"], message: "Select date of birth" });
    else if (!isValidPediatricDob(value.dob)) ctx.addIssue({ code: "custom", path: ["dob"], message: `Patient age must stay within 0-${MAX_CHILD_AGE} years.` });
    if (!value.sex) ctx.addIssue({ code: "custom", path: ["sex"], message: "Select sex" });
  }
});

const referralSchema = z.object({
  specialty: z.enum(["ENT", "Ophthalmology", "Cardiology", "Genetics", "Neurology", "Craniofacial", "Audiology"]),
  urgency: z.enum(["routine", "urgent", "emergency"]),
  toDoctor: z.string().min(1, "Select receiving doctor"),
  notes: z.string().min(10, "Provide enough context for the referral letter"),
  appointmentDate: z.string().optional(),
});

type ScanForm = z.infer<typeof scanSchema>;
type ReferralForm = z.infer<typeof referralSchema>;

const analysisSteps = [
  "Upload and storage",
  "Clinical ROI processing",
  "Model inference + explainability",
  "Care pathway preparation",
];

export default function DoctorNewScan() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { children, loading, setChildren } = useChildren(profile);
  const [file, setFile] = useState<File | null>(null);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [activeScan, setActiveScan] = useState<ScanRecord | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [receivingDoctors, setReceivingDoctors] = useState<Profile[]>([]);
  const [currentReferral, setCurrentReferral] = useState<ReferralRecord | null>(null);
  const minDob = useMemo(() => getOldestAllowedDob(), []);
  const maxDob = useMemo(() => getTodayInputDate(), []);

  const scanForm = useForm<ScanForm>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      patientMode: children.length ? "saved" : "new",
      childId: children[0]?.id,
      name: "",
      dob: "",
      sex: "male",
    },
  });

  const referralForm = useForm<ReferralForm>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      specialty: "ENT",
      urgency: "routine",
      toDoctor: "",
      notes: "",
      appointmentDate: "",
    },
  });

  const patientMode = scanForm.watch("patientMode");
  const selectedChildId = scanForm.watch("childId");
  const selectedSpecialty = referralForm.watch("specialty");

  useEffect(() => {
    const child = children.find((entry) => entry.id === selectedChildId) ?? null;
    if (patientMode === "saved") {
      setActiveChild(child);
    }
  }, [children, patientMode, selectedChildId]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      const doctors = await listDoctors(selectedSpecialty as Specialty);
      if (!ignore) {
        setReceivingDoctors(doctors.filter((doctor) => doctor.id !== profile?.id));
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [profile?.id, selectedSpecialty]);

  useEffect(() => {
    if (!analyzing) return;
    const timer = window.setInterval(() => {
      setAnalysisStep((current) => (current + 1) % analysisSteps.length);
    }, 800);
    return () => clearInterval(timer);
  }, [analyzing]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const submitScan = scanForm.handleSubmit(async (values) => {
    if (!profile || !file) {
      toast.error("Upload a patient image before running analysis.");
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisStep(0);
      setActiveScan(null);
      setCurrentReferral(null);

      const selectedChild = values.patientMode === "saved"
        ? children.find((child) => child.id === values.childId) ?? null
        : null;
      const patientAge = selectedChild ? calculateAge(selectedChild.dob) : calculateAge(values.dob || new Date().toISOString());
      const patientSex = (selectedChild?.sex || values.sex || "male") as ChildSex;

      const scan = await analyzeAndPersistScan({
        file,
        childId: selectedChild?.id,
        childDraft: values.patientMode === "new"
          ? { name: values.name || "", dob: values.dob || "", sex: patientSex, assigned_doctor: profile.id }
          : undefined,
        patientAge,
        patientSex,
        actorProfile: profile,
      });

      const refreshedChildren = await listChildren(profile);
      setChildren(refreshedChildren);
      const child = refreshedChildren.find((entry) => entry.id === scan.child_id) ?? selectedChild;
      setActiveChild(child ?? null);
      setActiveScan(scan);
      if (child) {
        const draft = await createReferralDraft(scan, child);
        referralForm.reset({
          specialty: "ENT",
          urgency: scan.severity === "severe" ? "urgent" : "routine",
          toDoctor: "",
          notes: draft,
          appointmentDate: "",
        });
      }
      toast.success("Clinical result ready. Opening the full result board.");
      navigate(`/doctor/scans/${scan.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to analyze patient image.");
    } finally {
      setAnalyzing(false);
      setAnalysisStep(analysisSteps.length - 1);
    }
  });

  const submitReferral = referralForm.handleSubmit(async (values) => {
    if (!profile || !activeScan || !activeChild) return;
    try {
      const referral = await createReferral({
        scanId: activeScan.id,
        childId: activeChild.id,
        fromDoctor: profile.id,
        toDoctor: values.toDoctor,
        specialty: values.specialty,
        urgency: values.urgency,
        notes: values.notes,
        appointmentDate: values.appointmentDate || null,
      });
      setCurrentReferral(referral);
      toast.success("Referral sent successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send referral.");
    }
  });

  if (!profile || loading) {
    return <LoadingPanel title="Loading clinical scan workspace" description="Preparing patients, referral networks, and scan tools." />;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader title={profile.role === "chw" ? "Submit scan" : "New clinical scan"} description="Run AI-supported analysis, review segmentation and risks, then send the patient into the right specialty workflow." />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Patient + image input</CardTitle>
            <CardDescription>Select an existing patient or create a new one before running analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submitScan}>
              <div className="space-y-2">
                <Label>Patient source</Label>
                <Controller
                  control={scanForm.control}
                  name="patientMode"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select patient mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saved">Select from patient list</SelectItem>
                        <SelectItem value="new">Create new patient</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {patientMode === "saved" ? (
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Controller
                    control={scanForm.control}
                    name="childId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                        <SelectContent>
                          {children.map((child) => <SelectItem key={child.id} value={child.id}>{child.name} · {calculateAge(child.dob)} years</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="patient-name">Patient name</Label>
                    <Input id="patient-name" {...scanForm.register("name")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-dob">Date of birth</Label>
                    <Input id="patient-dob" type="date" min={minDob} max={maxDob} {...scanForm.register("dob")} />
                    {scanForm.formState.errors.dob ? <p className="text-sm text-destructive">{scanForm.formState.errors.dob.message}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Sex</Label>
                    <Controller
                      control={scanForm.control}
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
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Clinical image</Label>
                <UploadDropzone value={file} onChange={setFile} />
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={analyzing || !file}>
                <FilePlus2 className="size-4" />
                {analyzing ? "AI analyzing..." : "Analyze image"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Preview & progress</CardTitle>
              <CardDescription>The inference workflow now uses the real MorphoFusion model service and stays compatible with the Railway deployment contract.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {previewUrl ? <img src={previewUrl} alt="Clinical preview" className="h-72 w-full rounded-3xl object-cover" /> : <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">Upload an image to see the preview.</div>}
              <Progress value={analyzing ? ((analysisStep + 1) / analysisSteps.length) * 100 : activeScan ? 100 : 0} />
              <div className="space-y-3 rounded-3xl bg-muted/35 p-5 text-sm">
                {analysisSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <LoaderCircle className={`size-4 ${analyzing && analysisStep === index ? "animate-spin text-primary" : index <= analysisStep && activeScan ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={index <= analysisStep && (analyzing || activeScan) ? "font-medium text-foreground" : "text-muted-foreground"}>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {activeScan && activeChild ? (
            <>
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Segmentation findings</CardTitle>
                  <CardDescription>Local findings produced by the inference API.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Label</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead>Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeScan.segmentation_data.map((item: SegmentationFinding) => (
                          <TableRow key={`${item.label}-${item.side}`}>
                            <TableCell className="font-medium">{item.label.replaceAll("_", " ")}</TableCell>
                            <TableCell>{item.side}</TableCell>
                            <TableCell>{Math.round(item.confidence * 100)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <ScanResultPanel
                scan={activeScan}
                child={activeChild}
                referral={currentReferral}
                onDownloadPatient={() => downloadPatientReport(activeScan, activeChild, profile.language_pref)}
                onDownloadClinical={() => downloadClinicalReport(activeScan, activeChild, profile, currentReferral ?? undefined)}
                referralComposer={
                  <form className="space-y-4" onSubmit={submitReferral}>
                    <div>
                      <div className="mb-2 text-lg font-semibold">Referral sender</div>
                      <p className="text-sm text-muted-foreground">Select specialty, urgency, receiving doctor, and adjust the auto-drafted letter before sending.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Specialty</Label>
                        <Controller
                          control={referralForm.control}
                          name="specialty"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                              <SelectContent>
                                {["ENT", "Ophthalmology", "Cardiology", "Genetics", "Neurology", "Craniofacial", "Audiology"].map((specialty) => (
                                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Urgency</Label>
                        <Controller
                          control={referralForm.control}
                          name="urgency"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger><SelectValue placeholder="Select urgency" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="routine">Routine</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="emergency">Emergency</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Receiving doctor</Label>
                      <Controller
                        control={referralForm.control}
                        name="toDoctor"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select receiving doctor" /></SelectTrigger>
                            <SelectContent>
                              {receivingDoctors.map((doctor) => <SelectItem key={doctor.id} value={doctor.id}>{doctor.full_name} · {doctor.specialty || doctor.district}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appointmentDate">Appointment date</Label>
                      <Input id="appointmentDate" type="date" {...referralForm.register("appointmentDate")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Referral letter</Label>
                      <Textarea id="notes" rows={7} {...referralForm.register("notes")} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" className="gap-2"><SendHorizontal className="size-4" /> Send referral</Button>
                      <Button type="button" variant="outline" onClick={() => toast.success(`ICD-10 suggestions: ${(activeScan.icd10_codes || []).join(", ")}`)}>ICD-10 suggestions</Button>
                      <Button type="button" variant="secondary" onClick={() => toast.success("Scan is already stored in the patient record.")}>Add to patient record</Button>
                    </div>
                  </form>
                }
              />
            </>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
