import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BrainCircuit } from "lucide-react";
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
import { DISTRICT_OPTIONS, SPECIALTY_OPTIONS } from "@/shared/lib/types";
import type { LanguagePref, Specialty } from "@/shared/lib/types";
import { useAuthStore } from "@/features/auth/store/authStore";
import { homeByRole } from "@/shared/lib/navigation";

const allowedRoles = ["parent", "doctor", "chw"] as const;
const allowedLanguages = ["en", "bn"] as const;
type AllowedRole = (typeof allowedRoles)[number];

const registerSchema = z.object({
  fullName: z.string().min(3, "Enter the full name"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(allowedRoles),
  institution: z.string().min(2, "Enter your institution or organization"),
  district: z.enum(DISTRICT_OPTIONS),
  languagePref: z.enum(allowedLanguages),
  specialty: z.enum(SPECIALTY_OPTIONS).nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.role === "doctor" && !value.specialty) {
    ctx.addIssue({ code: "custom", path: ["specialty"], message: "Select a specialty for doctor accounts" });
  }
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preferredRole = params.get("role");
  const { register, loading } = useAuthStore();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: (allowedRoles.includes(preferredRole as AllowedRole) ? preferredRole : "parent") as AllowedRole,
      institution: "",
      district: "Dhaka",
      languagePref: "en",
      specialty: null,
    },
  });

  const selectedRole = useWatch({ control: form.control, name: "role" });

  useEffect(() => {
    if (selectedRole !== "doctor") {
      form.setValue("specialty", null);
    }
  }, [form, selectedRole]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
        institution: values.institution,
        district: values.district,
        languagePref: values.languagePref as LanguagePref,
        specialty: values.specialty as Specialty | null,
      });
      const profile = useAuthStore.getState().profile;
      toast.success("Account created successfully.");
      navigate(profile ? homeByRole[profile.role] : "/", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account.");
    }
  });

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Join the care network</p>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-balance">Create the GoldenScope AI workspace your role actually needs.</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          Registration sets up role-based access, language preference, district context, and the clinical workflow that appears after sign-in.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Parent", "Track children, reports, specialist recommendations, and community support."],
            ["Doctor", "Review scans, comorbidities, surgical windows, and referral pipelines."],
            ["CHW", "Capture field scans, alert doctors instantly, and reduce referral delays."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-3xl border border-border/60 bg-card/75 p-5 shadow-sm">
              <div className="font-semibold">{title}</div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">{body}</div>
            </div>
          ))}
        </div>
      </div>

      <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BrainCircuit className="size-6" />
          </div>
          <div>
            <CardTitle className="text-3xl">Create your account</CardTitle>
            <CardDescription className="mt-2 text-base leading-7">
              Choose your role and district so GoldenScope AI can personalize referrals, analytics, and language defaults.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="Dr. Nadia Rahman" {...form.register("fullName")} />
              {form.formState.errors.fullName ? <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" {...form.register("email")} />
              {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Minimum 6 characters" {...form.register("password")} />
              {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="chw">Community health worker</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred language</Label>
              <Controller
                control={form.control}
                name="languagePref"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">Bangla</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="institution">Institution</Label>
              <Input id="institution" placeholder="Dhaka Shishu Hospital / Community Care Network" {...form.register("institution")} />
              {form.formState.errors.institution ? <p className="text-sm text-destructive">{form.formState.errors.institution.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Controller
                control={form.control}
                name="district"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRICT_OPTIONS.map((district) => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Controller
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <Select value={field.value ?? undefined} onValueChange={field.onChange} disabled={selectedRole !== "doctor"}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedRole === "doctor" ? "Select specialty" : "Only required for doctors"} />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTY_OPTIONS.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.specialty ? <p className="text-sm text-destructive">{form.formState.errors.specialty.message}</p> : null}
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            Already registered? <Link to="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
