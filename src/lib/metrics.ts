import type { Process } from "@/types/process";
import type { ProcessMetrics, Schedule, SimulationResult } from "@/types/schedule";

/**
 * Single source of truth for the formulas:
 *   TAT = Completion Time - Arrival Time
 *   WT  = Turnaround Time - Burst Time
 * Averages are kept at full precision; rounding is done only for display.
 */
export function computeMetrics(processes: Process[], schedule: Schedule): SimulationResult {
  const rows: ProcessMetrics[] = [];
  let totalTurnaroundTime = 0;
  let totalWaitingTime = 0;

  // Rows follow the input order of the processes.
  for (const process of processes) {
    const completionTime = schedule.completionTimes[process.pid];
    const turnaroundTime = completionTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;

    rows.push({ ...process, completionTime, turnaroundTime, waitingTime });
    totalTurnaroundTime = totalTurnaroundTime + turnaroundTime;
    totalWaitingTime = totalWaitingTime + waitingTime;
  }

  const count = processes.length;
  return {
    schedule,
    rows,
    averageTurnaroundTime: count === 0 ? 0 : totalTurnaroundTime / count,
    averageWaitingTime: count === 0 ? 0 : totalWaitingTime / count,
  };
}
