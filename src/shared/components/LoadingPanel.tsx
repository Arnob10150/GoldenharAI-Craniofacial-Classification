import { Skeleton } from "@/shared/ui/skeleton";

interface LoadingPanelProps {
  title?: string;
  description?: string;
}

export const LoadingPanel = ({ title, description }: LoadingPanelProps) => (
  <div className="space-y-4">
    {title ? <div className="space-y-2"><div className="text-sm font-medium text-muted-foreground">{title}</div>{description ? <div className="text-sm text-muted-foreground">{description}</div> : null}</div> : null}
    <Skeleton className="h-10 w-1/3" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-96 rounded-2xl" />
  </div>
);
