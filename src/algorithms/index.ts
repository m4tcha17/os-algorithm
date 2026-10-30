import type { Process } from "@/types/process";
import type { AlgorithmId, Schedule, Scheduler, SchedulerOptions } from "@/types/schedule";
import { fcfs } from "@/algorithms/fcfs";
import { sjf } from "@/algorithms/sjf";
import { srtf } from "@/algorithms/srtf";
import { roundRobin } from "@/algorithms/roundRobin";

export interface AlgorithmInfo {
  label: string;
  preemptive: boolean;
  scheduler: Scheduler;
}

// Registry: AlgorithmId -> scheduler + display label.
export const algorithms: Record<AlgorithmId, AlgorithmInfo> = {
  fcfs: { label: "First Come First Serve (FCFS)", preemptive: false, scheduler: fcfs },
  sjf: { label: "Shortest Job First (SJF)", preemptive: false, scheduler: sjf },
  srtf: { label: "Shortest Remaining Time First (SRTF)", preemptive: true, scheduler: srtf },
  rr: { label: "Round Robin (RR)", preemptive: true, scheduler: roundRobin },
};

export function runScheduler(id: AlgorithmId, processes: Process[], options: SchedulerOptions): Schedule {
  return algorithms[id].scheduler(processes, options);
}
