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
 * Shortest Job First (non-preemptive).
 * Whenever the CPU becomes free, pick the arrived process with the smallest burst
 * and run it to completion.
 */
export function sjf(processes: Process[], _options: SchedulerOptions): Schedule {
  // Copy the input and remember each process's original position (used for the last tie-break).
  const pending = processes.map((process, index) => ({ ...process, index }));

  const segments: GanttSegment[] = [];
  const completionTimes: Record<string, number> = {};
  let time = 0;

  while (pending.length > 0) {
    // The ready queue: every unfinished process that has arrived by now.
    const ready = pending.filter((process) => process.arrivalTime <= time);

    // Ready queue is empty: idle until the earliest pending process arrives.
    if (ready.length === 0) {
      let nextArrival = pending[0].arrivalTime;
      for (const process of pending) {
        if (process.arrivalTime < nextArrival) {
          nextArrival = process.arrivalTime;
        }
      }
      addSegment(segments, null, time, nextArrival);
      time = nextArrival;
      continue;
    }

    // Choose the shortest burst; tie -> earlier arrival; tie -> input order.
    let chosen = ready[0];
    for (const candidate of ready) {
      if (candidate.burstTime < chosen.burstTime) {
        chosen = candidate;
      } else if (candidate.burstTime === chosen.burstTime) {
        if (candidate.arrivalTime < chosen.arrivalTime) {
          chosen = candidate;
        } else if (candidate.arrivalTime === chosen.arrivalTime && candidate.index < chosen.index) {
          chosen = candidate;
        }
      }
    }

    // Non-preemptive: the chosen process runs its whole burst.
    const start = time;
    time = time + chosen.burstTime;
    addSegment(segments, chosen.pid, start, time);
    completionTimes[chosen.pid] = time;

    // Remove the finished process from the pending list.
    pending.splice(pending.indexOf(chosen), 1);
  }

  return { segments, completionTimes };
}
