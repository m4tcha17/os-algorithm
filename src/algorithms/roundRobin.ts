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
 * Round Robin (preemptive).
 * Processes take turns from a FIFO ready queue. Each turn lasts at most one time quantum;
 * a process that still has work left goes to the back of the queue.
 */
export function roundRobin(processes: Process[], options: SchedulerOptions): Schedule {
  const quantum = options.timeQuantum;
  if (quantum === undefined || !Number.isInteger(quantum) || quantum < 1) {
    throw new Error("Round Robin needs a time quantum that is an integer >= 1.");
  }

  // Copy the input, add remaining time, and order by arrival.
  // Array.prototype.sort is stable, so equal arrivals keep their input order.
  const arrivals = processes
    .map((process) => ({ ...process, remaining: process.burstTime }))
    .sort((a, b) => a.arrivalTime - b.arrivalTime);

  const segments: GanttSegment[] = [];
  const completionTimes: Record<string, number> = {};
  const readyQueue: typeof arrivals = [];
  let nextArrivalIndex = 0; // first process in `arrivals` not yet put in the queue
  let finishedCount = 0;
  let time = 0;

  // Move every process that has arrived by `currentTime` into the back of the ready queue.
  function admitArrivals(currentTime: number): void {
    while (nextArrivalIndex < arrivals.length && arrivals[nextArrivalIndex].arrivalTime <= currentTime) {
      readyQueue.push(arrivals[nextArrivalIndex]);
      nextArrivalIndex = nextArrivalIndex + 1;
    }
  }

  while (finishedCount < arrivals.length) {
    admitArrivals(time);

    // Ready queue is empty: idle until the next process arrives.
    if (readyQueue.length === 0) {
      const nextArrival = arrivals[nextArrivalIndex].arrivalTime;
      addSegment(segments, null, time, nextArrival);
      time = nextArrival;
      continue;
    }

    // Take the process at the front of the queue.
    const current = readyQueue.shift()!;

    // Run for one quantum, or less if the process finishes sooner
    // (a finished process releases the CPU immediately).
    const runTime = Math.min(quantum, current.remaining);
    addSegment(segments, current.pid, time, time + runTime);
    time = time + runTime;
    current.remaining = current.remaining - runTime;

    // Processes that arrived during this turn (or exactly at its end) join the queue
    // BEFORE the current process is put back.
    admitArrivals(time);

    if (current.remaining > 0) {
      // Quantum expired with work left: go to the back of the queue.
      readyQueue.push(current);
    } else {
      // Process finished: record its completion time.
      completionTimes[current.pid] = time;
      finishedCount = finishedCount + 1;
    }
  }

  return { segments, completionTimes };
}
