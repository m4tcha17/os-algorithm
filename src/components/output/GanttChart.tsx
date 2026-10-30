import type { GanttSegment } from "@/types/schedule";
import { cn } from "@/lib/utils";
import { processColorClass } from "@/components/output/processColors";

interface GanttChartProps {
  segments: GanttSegment[];
  pidOrder: string[]; // input order, used to give each process a stable color
}

// Diagonal stripes mark CPU idle time.
const IDLE_CLASS =
  "bg-[repeating-linear-gradient(135deg,var(--muted)_0_6px,transparent_6px_12px)] text-muted-foreground";

export function GanttChart({ segments, pidOrder }: GanttChartProps) {
  const totalTime = segments.length > 0 ? segments[segments.length - 1].end : 0;

  return (
    <div className="overflow-x-auto px-3 pb-2">
      {/* Every unit of time gets at least 2rem so long timelines scroll instead of squashing. */}
      <div className="flex flex-col gap-1" style={{ minWidth: `${totalTime * 2}rem` }}>
        <div className="flex overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          {segments.map((segment) => {
            const duration = segment.end - segment.start;
            const isIdle = segment.pid === null;
            return (
              <div
                key={segment.start}
                title={`${isIdle ? "Idle" : segment.pid}: ${segment.start} → ${segment.end}`}
                className={cn(
                  "flex h-14 min-w-10 flex-col items-center justify-center border-r border-background last:border-r-0",
                  isIdle ? IDLE_CLASS : processColorClass(pidOrder.indexOf(segment.pid!)),
                )}
                style={{ flexGrow: duration, flexBasis: 0 }}
              >
                <span className={cn("text-sm font-semibold", isIdle && "italic font-normal")}>
                  {isIdle ? "Idle" : segment.pid}
                </span>
                <span className="text-[0.65rem] tabular-nums opacity-70">{duration}</span>
              </div>
            );
          })}
        </div>

        {/* Time markers sit under each segment boundary, using the same widths as the bars. */}
        <div className="flex h-5">
          {segments.map((segment, index) => (
            <div
              key={segment.start}
              className="relative min-w-10"
              style={{ flexGrow: segment.end - segment.start, flexBasis: 0 }}
            >
              <span className="absolute left-0 -translate-x-1/2 text-xs tabular-nums text-muted-foreground">
                {segment.start}
              </span>
              {index === segments.length - 1 && (
                <span className="absolute right-0 translate-x-1/2 text-xs tabular-nums text-muted-foreground">
                  {segment.end}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
