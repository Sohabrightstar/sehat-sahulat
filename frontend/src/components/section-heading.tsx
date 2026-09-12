import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
  titleClassName?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  titleClassName,
}: Props) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary",
          )}
        >
          <span className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "mt-4 font-display text-3xl font-semibold tracking-tight leading-[1.15] sm:text-4xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
