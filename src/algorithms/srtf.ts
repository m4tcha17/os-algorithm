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
 * Shortest Remaining Time First (preemptive SJF).
 * The decision is re-made every time unit: the arrived process with the least
 * remaining time runs. A newly arrived shorter job preempts the running one.
 */
export function srtf(processes: Process[], _options: SchedulerOptions): Schedule {
  // Copy the input; track remaining time and original position (last tie-break).
  const states = processes.map((process, index) => ({
    ...process,
    index,
    remaining: process.burstTime,
  }));

  const segments: GanttSegment[] = [];
  const completionTimes: Record<string, number> = {};
  let time = 0;
  let finishedCount = 0;
  let running: (typeof states)[number] | null = null;

  while (finishedCount < states.length) {
    // The ready queue: arrived and still has work left.
    const ready = states.filter((process) => process.arrivalTime <= time && process.remaining > 0);

    // Ready queue is empty: idle until the next process arrives.
    if (ready.length === 0) {
      let nextArrival = Infinity;
      for (const process of states) {
        if (process.remaining > 0 && process.arrivalTime < nextArrival) {
          nextArrival = process.arrivalTime;
        }
      }
      addSegment(segments, null, time, nextArrival);
      time = nextArrival;
      running = null;
      continue;
    }

    // Find the best candidate: least remaining time; tie -> earlier arrival; tie -> input order.
    let best = ready[0];
    for (const candidate of ready) {
      if (candidate.remaining < best.remaining) {
        best = candidate;
      } else if (candidate.remaining === best.remaining) {
        if (candidate.arrivalTime < best.arrivalTime) {
          best = candidate;
        } else if (candidate.arrivalTime === best.arrivalTime && candidate.index < best.index) {
          best = candidate;
        }
      }
    }

    // Preempt only if the best candidate is strictly shorter than the running process.
    // An equal remaining time does not take the CPU away from the running process.
    if (running === null || running.remaining === 0 || best.remaining < running.remaining) {
      running = best;
    }

    // Run the chosen process for one time unit.
    addSegment(segments, running.pid, time, time + 1);
    running.remaining = running.remaining - 1;
    time = time + 1;

    // Process finished: record its completion time.
    if (running.remaining === 0) {
      completionTimes[running.pid] = time;
      finishedCount = finishedCount + 1;
    }
  }

  return { segments, completionTimes };
}
