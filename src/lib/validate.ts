import type { Process } from "@/types/process";
import type { AlgorithmId, SchedulerOptions } from "@/types/schedule";

/**
 * One row of the input form, exactly as the user typed it.
 * Values stay as strings so a half-typed number never breaks the form.
 */
export interface ProcessDraft {
  id: string; // stable React key, not shown to the user
  pid: string;
  arrival: string;
  burst: string;
}

export interface RowErrors {
  pid?: string;
  arrival?: string;
  burst?: string;
}

export interface ValidationResult {
  valid: boolean;
  processes: Process[];
  options: SchedulerOptions;
  rowErrors: Record<string, RowErrors>; // draft id -> errors for that row
  timeQuantumError?: string;
  formError?: string;
}

// Only plain digits are accepted, so "1.5", "-2", "1e3" and "" are all rejected.
function parseNonNegativeInteger(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  return Number(trimmed);
}

export function validateInput(
  drafts: ProcessDraft[],
  algorithm: AlgorithmId,
  timeQuantumText: string,
): ValidationResult {
  const processes: Process[] = [];
  const rowErrors: Record<string, RowErrors> = {};
  let valid = true;

  // Rule: at least 1 process.
  let formError: string | undefined;
  if (drafts.length === 0) {
    formError = "Add at least one process.";
    valid = false;
  }

  // Count each PID first so every duplicate row can be flagged, not just the second one.
  const pidCounts: Record<string, number> = {};
  for (const draft of drafts) {
    const pid = draft.pid.trim();
    pidCounts[pid] = (pidCounts[pid] ?? 0) + 1;
  }

  for (const draft of drafts) {
    const errors: RowErrors = {};
    const pid = draft.pid.trim();

    // Rule: PID non-empty and unique.
    if (pid === "") {
      errors.pid = "Process ID is required.";
    } else if (pidCounts[pid] > 1) {
      errors.pid = `"${pid}" is used more than once.`;
    }

    // Rule: Arrival Time is an integer >= 0.
    const arrivalTime = parseNonNegativeInteger(draft.arrival);
    if (arrivalTime === null) {
      errors.arrival = "Must be a whole number ≥ 0.";
    }

    // Rule: Burst Time is an integer >= 1.
    const burstTime = parseNonNegativeInteger(draft.burst);
    if (burstTime === null || burstTime < 1) {
      errors.burst = "Must be a whole number ≥ 1.";
    }

    if (errors.pid || errors.arrival || errors.burst) {
      rowErrors[draft.id] = errors;
      valid = false;
    } else {
      processes.push({ pid, arrivalTime: arrivalTime!, burstTime: burstTime! });
    }
  }

  // Rule: Time Quantum (Round Robin only) is an integer >= 1.
  const options: SchedulerOptions = {};
  let timeQuantumError: string | undefined;
  if (algorithm === "rr") {
    const timeQuantum = parseNonNegativeInteger(timeQuantumText);
    if (timeQuantum === null || timeQuantum < 1) {
      timeQuantumError = "Time Quantum must be a whole number ≥ 1.";
      valid = false;
    } else {
      options.timeQuantum = timeQuantum;
    }
  }

  return { valid, processes, options, rowErrors, timeQuantumError, formError };
}
