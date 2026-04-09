import { useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, BrainCircuit, LockKeyhole, Mail } from "lucide-react";
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
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuthStore();
  const isBangla = i18n.language === "bn";

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
      toast.success(t("toast.welcomeBack"));
      navigate(nextPath || (profile ? homeByRole[profile.role] : "/"), { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toast.unableToSignIn", { defaultValue: "Unable to sign in." }));
    }
  });

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-4">
          <div>
            <Button asChild variant="ghost" className="gap-2 px-0 text-muted-foreground hover:text-foreground">
              <Link to="/">
                <ArrowLeft className="size-4" />
                {isBangla ? "হোমে ফিরে যান" : "Return to home"}
              </Link>
            </Button>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BrainCircuit className="size-6" />
          </div>
          <div>
            <CardTitle className="text-3xl">{isBangla ? "গোল্ডেনস্কোপ এআই-এ লগ ইন করুন" : "Log in to GoldenScope AI"}</CardTitle>
            <CardDescription className="mt-2 text-base leading-7">
              {isBangla
                ? "আপনার নিবন্ধিত অ্যাকাউন্ট ব্যবহার করে প্যারেন্ট পোর্টাল, ক্লিনিক্যাল ড্যাশবোর্ড বা সিএইচডব্লিউ ওয়ার্কফ্লোতে যান।"
                : "Continue to the parent portal, clinical dashboard, or CHW workflow using your registered account."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" className="pl-9" placeholder="doctor@goldenscope.ai" {...form.register("email")} />
              </div>
              {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" className="pl-9" placeholder={isBangla ? "আপনার পাসওয়ার্ড লিখুন" : "Enter your password"} {...form.register("password")} />
              </div>
              {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
            </div>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
              {loading ? (isBangla ? "লগ ইন করা হচ্ছে..." : "Signing you in...") : t("common.login")}
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            {isBangla ? "গোল্ডেনস্কোপ এআই-এ নতুন?" : "New to GoldenScope AI?"}{" "}
            <Link to="/auth/register" className="font-medium text-primary underline-offset-4 hover:underline">
              {isBangla ? "একটি অ্যাকাউন্ট তৈরি করুন" : "Create an account"}
            </Link>
          </p>
          <div className="mt-8 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
            {isBangla
              ? "মক মোডে ডেমো অ্যাকাউন্টগুলো আগে থেকেই আছে। Supabase কনফিগার করা থাকলে স্বয়ংক্রিয়ভাবে বাস্তব অথ ও প্রোফাইল রেকর্ড ব্যবহৃত হবে।"
              : "Demo accounts are seeded in mock mode. If Supabase is configured, real auth and profile records will be used automatically."}
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
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{isBangla ? "নিরাপদ ভূমিকা-ভিত্তিক প্রবেশাধিকার" : "Secure role-based access"}</p>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-balance">
          {isBangla ? "একটি লগইন, দুইটি সমন্বিত পোর্টাল, রিয়েলটাইম কেয়ার অবস্থা।" : "One sign-in, two coordinated portals, realtime care status."}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          {isBangla
            ? "অভিভাবকরা ফলাফল ও অ্যাপয়েন্টমেন্ট দেখেন, আর ডাক্তার ও সিএইচডব্লিউরা সরাসরি স্ক্যান ফলাফল থেকে রেফারাল, নোট ও ফলো-আপে যেতে পারেন।"
            : "Parents review results and appointments, while doctors and CHWs move directly from scan findings into referrals, notes, and follow-up tracking."}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [
              isBangla ? "অভিভাবক" : "Parents",
              isBangla ? "বাংলা বা ইংরেজিতে শিশু, রিপোর্ট, স্ক্যান ইতিহাস এবং অ্যাপয়েন্টমেন্ট ট্র্যাক করুন।" : "Track children, reports, scan history, and appointments in Bengali or English.",
            ],
            [
              isBangla ? "ডাক্তার" : "Doctors",
              isBangla ? "ব্যাখ্যাযোগ্য ফলাফল দেখুন, রেফারাল পাঠান এবং সময়ের সাথে স্ক্যান তুলনা করুন।" : "Review explainable findings, send referrals, and compare scans longitudinally.",
            ],
            [
              isBangla ? "সিএইচডব্লিউ" : "CHWs",
              isBangla ? "মাঠে স্ক্যান জমা দিন এবং তাৎক্ষণিক ডাক্তার নোটিফিকেশন পাঠান।" : "Submit scans in the field and trigger instant doctor notifications.",
            ],
            [
              isBangla ? "অ্যাডমিন" : "Admins",
              isBangla ? "সিস্টেম-ব্যাপী অ্যানালিটিক্স, কভারেজ গ্যাপ এবং রেফারাল সম্পন্ন হওয়া পর্যবেক্ষণ করুন।" : "Monitor system-wide analytics, coverage gaps, and referral completion.",
            ],
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
