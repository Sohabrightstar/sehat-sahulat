import { CircleAlert, ShieldAlert, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export type Flag = "normal" | "high" | "low" | "unknown";
export type Urgency = "Routine" | "Needs Attention" | "Urgent";

const flagTone: Record<Flag, { pill: string; dot: string; label: string }> = {
  normal: { pill: "bg-routine-soft text-routine", dot: "bg-routine", label: "Normal" },
  high: { pill: "bg-attention-soft text-attention", dot: "bg-attention", label: "High" },
  low: { pill: "bg-low-soft text-low", dot: "bg-low", label: "Low" },
  unknown: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", label: "Unknown" },
};

const urgencyTone: Record<Urgency, { classes: string; dot: string; icon: typeof CircleAlert }> = {
  Routine: { classes: "bg-routine-soft text-routine", dot: "bg-routine", icon: Sparkles },
  "Needs Attention": {
    classes: "bg-attention-soft text-attention",
    dot: "bg-attention",
    icon: CircleAlert,
  },
  Urgent: { classes: "bg-urgent-soft text-urgent", dot: "bg-urgent", icon: ShieldAlert },
};

export function FlagDot({ flag, className }: { flag: Flag; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-2.5 shrink-0 rounded-full", flagTone[flag].dot, className)}
    />
  );
}

export function FlagPill({ flag, label }: { flag: Flag; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        flagTone[flag].pill,
      )}
    >
      <span className={cn("size-1.5 rounded-full", flagTone[flag].dot)} />
      {label ?? flagTone[flag].label}
    </span>
  );
}

export function UrgencyBadge({
  urgency,
  className,
  size = "md",
}: {
  urgency: Urgency;
  className?: string;
  size?: "sm" | "md";
}) {
  const tone = urgencyTone[urgency];
  const Icon = tone.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold",
        size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        tone.classes,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden />
      <Icon className="size-3.5" aria-hidden />
      {urgency}
    </span>
  );
}
