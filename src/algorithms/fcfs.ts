import type { Process } from "@/types/process";
import type { GanttSegment, Schedule, SchedulerOptions } from "@/types/schedule";

// Append a block of time to the Gantt chart.
// If the previous block belongs to the same pid and ends exactly here, extend it instead.
function addSegment(segments: GanttSegment[], pid: string | null, start: number, end: number): void {
  const last = segments[segments.length - 1];
  if (last !== undefined && last.pid === pid && last.end === start) {
    last.end = end;
    return;
  }
  segments.push({ pid, start, end });
}

/**
 * First Come First Serve (non-preemptive).
 * The process that arrived first gets the CPU and keeps it until it finishes.
 */
export function fcfs(processes: Process[], _options: SchedulerOptions): Schedule {
  // Copy before sorting so the caller's array is never changed.
  // Array.prototype.sort is stable, so processes with the same arrival keep their input order.
  const queue = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

  const segments: GanttSegment[] = [];
  const completionTimes: Record<string, number> = {};
  let time = 0;

  for (const process of queue) {
    // Nobody is ready yet: the CPU sits idle until this process arrives.
    if (time < process.arrivalTime) {
      addSegment(segments, null, time, process.arrivalTime);
      time = process.arrivalTime;
    }

    // Non-preemptive: run the whole burst in one go.
    const start = time;
    time = time + process.burstTime;
    addSegment(segments, process.pid, start, time);

    completionTimes[process.pid] = time;
  }

  return { segments, completionTimes };
}
