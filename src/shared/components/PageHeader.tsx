import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-start">
    <div className="min-w-0 md:flex-1">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap gap-2 md:ml-auto md:justify-end">{actions}</div> : null}
  </div>
);
