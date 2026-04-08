import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

const toneMap = {
  positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  negative: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
  inconclusive: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  mild: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  severe: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  routine: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
  emergency: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  sent: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
  accepted: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  booked: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
} as const;

interface StatusBadgeProps {
  label: string;
  tone: keyof typeof toneMap;
  className?: string;
}

export const StatusBadge = ({ label, tone, className }: StatusBadgeProps) => (
  <Badge className={cn("rounded-full border-0 px-3 py-1 text-xs font-medium", toneMap[tone], className)}>
    {label}
  </Badge>
);
