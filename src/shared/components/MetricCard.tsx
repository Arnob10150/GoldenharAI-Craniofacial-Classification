import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}

export const MetricCard = ({ title, value, hint, icon }: MetricCardProps) => (
  <Card className="border-border/70 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </CardContent>
  </Card>
);
