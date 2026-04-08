import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ title, description, actionLabel, onAction }: EmptyStateProps) => (
  <Card className="border-dashed bg-muted/30">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    {actionLabel && onAction ? (
      <CardContent>
        <Button onClick={onAction}>{actionLabel}</Button>
      </CardContent>
    ) : null}
  </Card>
);
