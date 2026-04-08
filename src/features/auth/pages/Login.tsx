import { useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BrainCircuit, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useAuthStore } from "@/features/auth/store/authStore";
import { homeByRole } from "@/shared/lib/navigation";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuthStore();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const nextPath = useMemo(() => {
    const state = location.state as { from?: Location } | undefined;
    return state?.from?.pathname;
  }, [location.state]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      const profile = useAuthStore.getState().profile;
      toast.success("Welcome back to GoldenScope AI.");
      navigate(nextPath || (profile ? homeByRole[profile.role] : "/"), { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    }
  });

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BrainCircuit className="size-6" />
          </div>
          <div>
            <CardTitle className="text-3xl">Log in to GoldenScope AI</CardTitle>
            <CardDescription className="mt-2 text-base leading-7">
              Continue to the parent portal, clinical dashboard, or CHW workflow using your registered account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" className="pl-9" placeholder="doctor@goldenscope.ai" {...form.register("email")} />
              </div>
              {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" className="pl-9" placeholder="Enter your password" {...form.register("password")} />
              </div>
              {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
            </div>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
              {loading ? "Signing you in..." : "Log in"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            New to GoldenScope AI? <Link to="/auth/register" className="font-medium text-primary underline-offset-4 hover:underline">Create an account</Link>
          </p>
          <div className="mt-8 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
            Demo accounts are seeded in mock mode. If Supabase is configured, real auth and profile records will be used automatically.
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Arnob", "arnob@gmail.com", "arnob123"],
              ["Tutul", "tutul@goldenscope.ai", "tutul123"],
              ["Naim", "naim@goldenscope.ai", "naim123"],
              ["Sadia", "sadia@goldenscope.ai", "sadia123"],
              ["Nasif", "nasif@goldenscope.ai", "nasif123"],
            ].map(([name, email, password]) => (
              <div key={email} className="rounded-2xl border border-border/60 bg-card/70 p-3 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">{name}</div>
                <div>{email}</div>
                <div>{password}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Secure role-based access</p>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-balance">One sign-in, two coordinated portals, realtime care status.</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          Parents review results and appointments, while doctors and CHWs move directly from scan findings into referrals, notes, and follow-up tracking.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Parents", "Track children, reports, scan history, and appointments in Bengali or English."],
            ["Doctors", "Review explainable findings, send referrals, and compare scans longitudinally."],
            ["CHWs", "Submit scans in the field and trigger instant doctor notifications."],
            ["Admins", "Monitor system-wide analytics, coverage gaps, and referral completion."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
              <div className="font-semibold">{title}</div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
