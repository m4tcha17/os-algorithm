import { useEffect, useMemo, useRef, useState } from "react";
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

// The page starts clean: one row with only its Process ID filled in, no results.
const FIRST_ROW: RawProcessRow = { pid: "P1", arrival: "", burst: "" };
const DEFAULT_ALGORITHM: AlgorithmId = "fcfs";
// The math is instant; a random "thinking" pause makes each run feel deliberate. Change the range below as you like.
const MIN_THINKING_DELAY_MS = 200;
const MAX_THINKING_DELAY_MS = 5000;

/** "idle" before the first click, "thinking" during the fake delay, "done" after. */
export type RunStatus = "idle" | "thinking" | "done";

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

// Key for one input field, used to remember which fields the user has edited.
function fieldKey(id: string, field: keyof RawProcessRow): string {
  return `${id}:${field}`;
}
const TIME_QUANTUM_FIELD = "timeQuantum";

/**
 * Holds the form state and runs the simulation.
 * Validation is live, but an error only shows once its field has been edited
 * (or for every field after "Run simulation" is clicked), so the blank start stays clean.
 * The simulation itself only runs when the user clicks "Run simulation".
 */
export function useSimulator() {
  const [drafts, setDrafts] = useState<ProcessDraft[]>(() => [makeDraft(FIRST_ROW)]);
  const [algorithm, setAlgorithm] = useState<AlgorithmId>(DEFAULT_ALGORITHM);
  const [timeQuantum, setTimeQuantumText] = useState("");
  const [lastRun, setLastRun] = useState<SimulationRun | null>(null);
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [showAllErrors, setShowAllErrors] = useState(false);

  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel a pending run if the page unmounts mid-delay.
  useEffect(() => {
    return () => {
      if (thinkingTimer.current) {
        clearTimeout(thinkingTimer.current);
      }
    };
  }, []);

  const validation: ValidationResult = useMemo(
    () => validateInput(drafts, algorithm, timeQuantum),
    [drafts, algorithm, timeQuantum],
  );

  // Same result, but with errors hidden for fields the user has not edited yet.
  const visibleErrors = useMemo(() => {
    const rowErrors: ValidationResult["rowErrors"] = {};
    for (const [id, errors] of Object.entries(validation.rowErrors)) {
      rowErrors[id] = {
        pid: showAllErrors || touched.has(fieldKey(id, "pid")) ? errors.pid : undefined,
        arrival: showAllErrors || touched.has(fieldKey(id, "arrival")) ? errors.arrival : undefined,
        burst: showAllErrors || touched.has(fieldKey(id, "burst")) ? errors.burst : undefined,
      };
    }
    const showQuantum = showAllErrors || touched.has(TIME_QUANTUM_FIELD);
    return {
      rowErrors,
      timeQuantumError: showQuantum ? validation.timeQuantumError : undefined,
      formError: validation.formError, // only appears after the user removes every row
    };
  }, [validation, touched, showAllErrors]);

  // Run stays clickable until it has revealed the errors once; after that it waits for valid input.
  const canRun = runStatus !== "thinking" && (validation.valid || !showAllErrors);

  function markTouched(key: string) {
    if (!touched.has(key)) {
      setTouched(new Set(touched).add(key));
    }
  }

  // Invalid input: show every error instead of running. Ignored while a run is in progress.
  function runSimulation() {
    if (runStatus === "thinking") {
      return;
    }
    const run = simulate(drafts, algorithm, timeQuantum);
    if (!run) {
      setShowAllErrors(true);
      return;
    }
    // Hide the old output, then reveal the new result after the random delay.
    setLastRun(null);
    setRunStatus("thinking");
    const delay = MIN_THINKING_DELAY_MS + Math.random() * (MAX_THINKING_DELAY_MS - MIN_THINKING_DELAY_MS);
    thinkingTimer.current = setTimeout(() => {
      setLastRun(run);
      setRunStatus("done");
      thinkingTimer.current = null;
    }, delay);
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
    markTouched(fieldKey(id, field));
    setDrafts(drafts.map((draft) => (draft.id === id ? { ...draft, [field]: value } : draft)));
  }

  function setTimeQuantum(value: string) {
    markTouched(TIME_QUANTUM_FIELD);
    setTimeQuantumText(value);
  }

  function removeRow(id: string) {
    setDrafts(drafts.filter((draft) => draft.id !== id));
  }

  // Rows from a file were not typed by hand, so show their errors straight away.
  function replaceRows(rows: RawProcessRow[]) {
    setDrafts(rows.map(makeDraft));
    setShowAllErrors(true);
  }

  return {
    drafts,
    algorithm,
    timeQuantum,
    validation,
    visibleErrors,
    canRun,
    lastRun,
    runStatus,
    runSimulation,
    setAlgorithm,
    setTimeQuantum,
    addRow,
    updateRow,
    removeRow,
    replaceRows,
  };
}
