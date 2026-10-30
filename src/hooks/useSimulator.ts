import { useMemo, useState } from "react";
import type { AlgorithmId, SimulationResult } from "@/types/schedule";
import { runScheduler } from "@/algorithms";
import { computeMetrics } from "@/lib/metrics";
import { validateInput, type ProcessDraft, type ValidationResult } from "@/lib/validate";
import type { RawProcessRow } from "@/lib/parseInput";

// Gives each form row a unique React key that survives edits and reordering.
let nextDraftId = 0;
function makeDraft(row: RawProcessRow): ProcessDraft {
  nextDraftId = nextDraftId + 1;
  return { id: `row-${nextDraftId}`, ...row };
}

/** The output of one "Run simulation" click, with the algorithm that produced it. */
export interface SimulationRun {
  algorithm: AlgorithmId;
  result: SimulationResult;
}

// Placeholder rows (same as public/samples) so the whole page is visible on first load.
const SAMPLE_ROWS: RawProcessRow[] = [
  { pid: "P1", arrival: "0", burst: "5" },
  { pid: "P2", arrival: "1", burst: "3" },
  { pid: "P3", arrival: "2", burst: "8" },
  { pid: "P4", arrival: "3", burst: "6" },
  { pid: "P5", arrival: "12", burst: "2" },
];
const DEFAULT_ALGORITHM: AlgorithmId = "fcfs";
const DEFAULT_TIME_QUANTUM = "2";

// Input -> validate -> algorithm -> metrics. Returns null while the input has errors.
function simulate(drafts: ProcessDraft[], algorithm: AlgorithmId, timeQuantum: string): SimulationRun | null {
  const validation = validateInput(drafts, algorithm, timeQuantum);
  if (!validation.valid) {
    return null;
  }
  const schedule = runScheduler(algorithm, validation.processes, validation.options);
  const result = computeMetrics(validation.processes, schedule);
  return { algorithm, result };
}

/**
 * Holds the form state and runs the simulation.
 * Validation is live so errors show while typing; the simulation itself
 * only runs when the user clicks "Run simulation" (plus once on load for the sample rows).
 */
export function useSimulator() {
  const [drafts, setDrafts] = useState<ProcessDraft[]>(() => SAMPLE_ROWS.map(makeDraft));
  const [algorithm, setAlgorithm] = useState<AlgorithmId>(DEFAULT_ALGORITHM);
  const [timeQuantum, setTimeQuantum] = useState(DEFAULT_TIME_QUANTUM);
  const [lastRun, setLastRun] = useState<SimulationRun | null>(() =>
    simulate(drafts, DEFAULT_ALGORITHM, DEFAULT_TIME_QUANTUM),
  );

  const validation: ValidationResult = useMemo(
    () => validateInput(drafts, algorithm, timeQuantum),
    [drafts, algorithm, timeQuantum],
  );

  // Does nothing while the input has errors.
  function runSimulation() {
    const run = simulate(drafts, algorithm, timeQuantum);
    if (run) {
      setLastRun(run);
    }
  }

  function addRow() {
    // Suggest the next free "P<n>" id so a new row is valid straight away.
    const usedPids = new Set(drafts.map((draft) => draft.pid.trim()));
    let n = drafts.length + 1;
    while (usedPids.has(`P${n}`)) {
      n = n + 1;
    }
    setDrafts([...drafts, makeDraft({ pid: `P${n}`, arrival: "0", burst: "1" })]);
  }

  function updateRow(id: string, field: keyof RawProcessRow, value: string) {
    setDrafts(drafts.map((draft) => (draft.id === id ? { ...draft, [field]: value } : draft)));
  }

  function removeRow(id: string) {
    setDrafts(drafts.filter((draft) => draft.id !== id));
  }

  function replaceRows(rows: RawProcessRow[]) {
    setDrafts(rows.map(makeDraft));
  }

  return {
    drafts,
    algorithm,
    timeQuantum,
    validation,
    lastRun,
    runSimulation,
    setAlgorithm,
    setTimeQuantum,
    addRow,
    updateRow,
    removeRow,
    replaceRows,
  };
}
