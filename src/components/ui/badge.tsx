import { clsx } from "clsx";

const VARIANTS: Record<string, string> = {
  active: "bg-[--color-badge-active-bg] text-[--color-badge-active-text]",
  muted: "bg-[--color-badge-muted-bg] text-[--color-badge-muted-text]",
  warning: "bg-[--color-warning-bg] text-[--color-warning]",
  danger: "bg-[--color-danger-bg] text-[--color-danger]",
};

export function Badge({
  children,
  variant = "muted",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return <span className={clsx("kf-badge", VARIANTS[variant], className)}>{children}</span>;
}

export function statusVariant(status: string): keyof typeof VARIANTS {
  switch (status) {
    case "active":
    case "operational":
    case "confirmed":
    case "fulfilled":
      return "active";
    case "deceased":
    case "cancelled":
    case "out_of_service":
    case "failed":
      return "danger";
    case "needs_service":
    case "pending":
    case "planned":
      return "warning";
    default:
      return "muted";
  }
}
