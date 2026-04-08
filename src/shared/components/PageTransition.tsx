import { cn } from "@/shared/lib/utils";
import type { PropsWithChildren } from "react";

export const PageTransition = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div className={cn("animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>{children}</div>
);
