import * as React from "react";
import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  default: "bg-muted-bg text-muted",
};

export function Badge({
  className,
  status = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { status?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[status] ?? variants.default,
        className,
      )}
      {...props}
    />
  );
}
