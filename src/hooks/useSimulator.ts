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

/**
 * Holds the form state and runs the simulation.
 * Validation is live so errors show while typing; the simulation itself
 * only runs when the user clicks "Run simulation".
 */
export function useSimulator() {
  const [drafts, setDrafts] = useState<ProcessDraft[]>([]);
  const [algorithm, setAlgorithm] = useState<AlgorithmId>("fcfs");
  const [timeQuantum, setTimeQuantum] = useState("2");
  const [lastRun, setLastRun] = useState<SimulationRun | null>(null);

  const validation: ValidationResult = useMemo(
    () => validateInput(drafts, algorithm, timeQuantum),
    [drafts, algorithm, timeQuantum],
  );

  // Input -> validate -> algorithm -> metrics. Does nothing while the input has errors.
  function runSimulation() {
    if (!validation.valid) {
      return;
    }
    const schedule = runScheduler(algorithm, validation.processes, validation.options);
    const result = computeMetrics(validation.processes, schedule);
    setLastRun({ algorithm, result });
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
