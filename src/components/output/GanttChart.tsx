import type { CSSProperties } from "react";
import type { GanttSegment, ProcessMetrics } from "@/types/schedule";
import { cn } from "@/lib/utils";
import { processColor } from "@/components/output/processColors";

interface GanttChartProps {
  segments: GanttSegment[];
  rows: ProcessMetrics[]; // input order, used for lane order and each process's stable color
}

interface Block {
  start: number;
  end: number;
}

// Diagonal stripes mark CPU idle time.
const IDLE_CLASS =
  "bg-[repeating-linear-gradient(135deg,var(--muted)_0_6px,transparent_6px_12px)] text-muted-foreground";

// Label column | timeline | WT column, shared by every row so the lanes line up.
const ROW_CLASS = "grid grid-cols-[3.5rem_1fr_3rem] items-center gap-3";

// Places a block on the timeline as a percentage of the total time.
function blockStyle(block: Block, totalTime: number): CSSProperties {
  return {
    left: `${(block.start / totalTime) * 100}%`,
    width: `${((block.end - block.start) / totalTime) * 100}%`,
  };
}

// Waiting = from arrival to completion, every stretch where the process is not on the CPU.
function waitingBlocks(row: ProcessMetrics, runs: Block[]): Block[] {
  const waits: Block[] = [];
  let time = row.arrivalTime;
  for (const run of runs) {
    if (run.start > time) waits.push({ start: time, end: run.start });
    time = run.end;
  }
  return waits;
}

export function GanttChart({ segments, rows }: GanttChartProps) {
  const totalTime = segments.length > 0 ? segments[segments.length - 1].end : 0;
  // One faint gridline per time unit behind every lane.
  const gridStyle: CSSProperties = {
    backgroundImage: "linear-gradient(90deg, var(--border) 1px, transparent 1px)",
    backgroundSize: `${100 / totalTime}% 100%`,
  };
  // Axis labels at every segment boundary.
  const ticks = [...new Set(segments.flatMap((segment) => [segment.start, segment.end]))];

  return (
    <div className="overflow-x-auto pb-2">
      {/* Every unit of time gets at least 2rem (plus the label columns) so long timelines scroll instead of squashing. */}
      <div className="flex flex-col gap-1.5 font-mono tabular-nums" style={{ minWidth: `calc(${totalTime * 2}rem + 8rem)` }}>
        {/* CPU row: the actual schedule, one bar per segment. */}
        <div className={ROW_CLASS}>
          <span className="text-xs font-semibold">CPU</span>
          <div className="relative h-12" style={gridStyle}>
            {segments.map((segment) => {
              const isIdle = segment.pid === null;
              const index = rows.findIndex((row) => row.pid === segment.pid);
              return (
                <div
                  key={segment.start}
                  title={`${isIdle ? "Idle" : segment.pid}: ${segment.start} → ${segment.end}`}
                  className={cn(
                    "absolute inset-y-0 flex flex-col items-center justify-center overflow-hidden border-r border-background last:border-r-0",
                    isIdle && IDLE_CLASS,
                  )}
                  style={{ ...blockStyle(segment, totalTime), backgroundColor: isIdle ? undefined : processColor(index) }}
                >
                  <span className={cn("text-xs font-semibold", isIdle && "font-normal italic")}>
                    {isIdle ? "Idle" : segment.pid}
                  </span>
                  <span className="text-[0.65rem] opacity-70">{segment.end - segment.start}</span>
                </div>
              );
            })}
          </div>
          <span className="text-right text-xs text-muted-foreground">WT</span>
        </div>

        {/* One lane per process: solid = running, hatched = waiting in the ready queue. */}
        {rows.map((row, index) => {
          const runs = segments.filter((segment) => segment.pid === row.pid);
          const color = processColor(index);
          const hatch = `repeating-linear-gradient(135deg, ${color} 0 2px, transparent 2px 6px)`;
          return (
            <div key={row.pid} className={ROW_CLASS}>
              <span className="flex items-center gap-2 text-xs font-semibold">
                <span className="size-2.5" style={{ backgroundColor: color }} />
                {row.pid}
              </span>
              <div className="relative h-6" style={gridStyle}>
                {waitingBlocks(row, runs).map((wait) => (
                  <div
                    key={`wait-${wait.start}`}
                    title={`${row.pid} waiting: ${wait.start} → ${wait.end}`}
                    className="absolute inset-y-1"
                    style={{ ...blockStyle(wait, totalTime), backgroundImage: hatch }}
                  />
                ))}
                {runs.map((run) => (
                  <div
                    key={`run-${run.start}`}
                    title={`${row.pid} running: ${run.start} → ${run.end}`}
                    className="absolute inset-y-1"
                    style={{ ...blockStyle(run, totalTime), backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-right text-xs">{row.waitingTime}</span>
            </div>
          );
        })}

        {/* Time axis under the timeline column. */}
        <div className={ROW_CLASS}>
          <span />
          <div className="relative h-5">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute -translate-x-1/2 text-xs text-muted-foreground"
                style={{ left: `${(tick / totalTime) * 100}%` }}
              >
                {tick}
              </span>
            ))}
          </div>
          <span />
        </div>
      </div>
    </div>
  );
}
