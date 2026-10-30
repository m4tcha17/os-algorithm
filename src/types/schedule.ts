import type { Process } from "@/types/process";

export type AlgorithmId = "fcfs" | "sjf" | "srtf" | "rr";

export interface SchedulerOptions {
  timeQuantum?: number; // required for "rr", integer >= 1
}

export interface GanttSegment {
  pid: string | null; // null = CPU idle
  start: number;
  end: number;
}

export interface Schedule {
  segments: GanttSegment[]; // ordered, contiguous, adjacent same-pid merged
  completionTimes: Record<string, number>; // pid -> CT
}

export interface ProcessMetrics extends Process {
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
}

export interface SimulationResult {
  schedule: Schedule;
  rows: ProcessMetrics[];
  averageTurnaroundTime: number;
  averageWaitingTime: number;
}

// Every algorithm in src/algorithms/ has this shape.
export type Scheduler = (processes: Process[], options: SchedulerOptions) => Schedule;
