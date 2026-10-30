import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import SplitText from "@/components/animation/SplitText";

interface SectionProps {
  label?: string; // small numbered eyebrow above the title, e.g. "01 — Input"
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

// Flat panel; the page grid draws the hairlines between panels.
export function Section({ label, title, description, action, className, children }: SectionProps) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-5 p-6", className)}>
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {label && (
            <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{label}</span>
          )}
          {/* Title and plain-text description rise in word by word when the section mounts. */}
          <h2 className="font-heading text-lg font-semibold">
            <SplitText text={title} className="align-top" tag="span" splitType="words" effect="rise" trigger="load" textAlign="left" />
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">
              {typeof description === "string" ? (
                <SplitText text={description} className="align-top" tag="span" splitType="words" effect="rise" trigger="load" textAlign="left" />
              ) : (
                description
              )}
            </p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
