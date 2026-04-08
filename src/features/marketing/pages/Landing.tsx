import { useEffect, useMemo, useState } from "react";
import { Activity, BrainCircuit, FileSearch2, HeartPulse, ShieldCheck, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/shared/components/Navbar";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

const useCounter = (target: number, duration = 1400) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
};

export default function Landing() {
  const { t } = useTranslation();
  const childrenCounter = useCounter(3500);
  const speedCounter = useCounter(60);
  const accuracyCounter = useCounter(87);

  const steps = useMemo(
    () => [
      {
        icon: FileSearch2,
        title: "Upload a clinical image",
        description: "Parents, CHWs, or doctors upload a relevant photo and add the child details needed for age-aware analysis.",
      },
      {
        icon: BrainCircuit,
        title: "Receive explainable AI findings",
        description: "GoldenScope AI returns classification, confidence, comorbidity flags, surgical windows, and attention regions.",
      },
      {
        icon: Workflow,
        title: "Move directly into care coordination",
        description: "Generate reports, send referrals, monitor status in realtime, and track cases across districts and specialists.",
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="space-y-8">
            <Badge className="rounded-full bg-primary/10 px-4 py-1 text-primary hover:bg-primary/10">AI for pediatric screening, referrals, and follow-up</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                {t("landing.headline")}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                {t("landing.subheadline")} GoldenScope AI gives families, doctors, and community health workers one place to screen, explain, refer, and monitor Goldenhar-related care.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6 shadow-lg shadow-primary/20">
                <Link to="/patient/new-scan">{t("landing.checkChild")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                <Link to="/doctor/dashboard">{t("landing.dashboard")}</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border/70 bg-card/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Global rarity</CardDescription>
                  <CardTitle className="text-3xl">1 in {childrenCounter.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">A memorable awareness stat for the pitch and patient education flow.</CardContent>
              </Card>
              <Card className="border-border/70 bg-card/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>AI turnaround</CardDescription>
                  <CardTitle className="text-3xl">&lt; {speedCounter}s</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Upload to result with explainability, care pathway, and exportable report.</CardContent>
              </Card>
              <Card className="border-border/70 bg-card/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Model benchmark</CardDescription>
                  <CardTitle className="text-3xl">{accuracyCounter}%</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Use your current research metric here until the live inference service is connected.</CardContent>
              </Card>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-linear-to-br from-primary/18 via-transparent to-emerald-500/12 blur-3xl" />
            <Card className="relative overflow-hidden rounded-[2rem] border-border/70 bg-card/90 shadow-2xl shadow-primary/10">
              <CardHeader className="space-y-4 border-b border-border/60 pb-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <BrainCircuit className="size-6" />
                  </span>
                  <div>
                    <CardTitle className="text-2xl">Two-sided clinical platform</CardTitle>
                    <CardDescription>Designed for families, CHWs, pediatric specialists, and referral networks.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-muted/50 p-5">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div className="font-semibold">Parent portal</div>
                    <p className="mt-2 text-sm text-muted-foreground">Upload scans, review care pathways, track appointments, and access bilingual resources.</p>
                  </div>
                  <div className="rounded-3xl bg-muted/50 p-5">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
                      <HeartPulse className="size-5" />
                    </div>
                    <div className="font-semibold">Doctor dashboard</div>
                    <p className="mt-2 text-sm text-muted-foreground">Review AI findings, send referrals, compare scans, and monitor district-level trends.</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
                  <div className="flex items-start gap-3">
                    <Activity className="mt-1 size-5 text-primary" />
                    <div>
                      <div className="font-semibold">Built for fragmented pediatric care settings</div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        GoldenScope AI combines early screening, clinical explainability, referral routing, and community support so families do not have to navigate multiple disconnected tools.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{t("landing.howItWorks")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Simple workflow, clinically useful output</h2>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="rounded-[1.75rem] border-border/70 bg-card/85 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-sm font-semibold text-muted-foreground">0{index + 1}</span>
                    </div>
                    <CardTitle className="pt-4 text-xl">{step.title}</CardTitle>
                    <CardDescription className="leading-6">{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
      <footer className="border-t border-border/60 bg-card/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="font-semibold">GoldenScope AI</div>
            <div className="mt-1 text-sm text-muted-foreground">Screening and care coordination platform for Goldenhar Syndrome.</div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="rounded-full border border-border/60 px-4 py-2">Harvard HSIL</div>
            <div className="rounded-full border border-border/60 px-4 py-2">AIUB</div>
            <div className="rounded-full border border-border/60 px-4 py-2">GoldenScope AI research stack</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
