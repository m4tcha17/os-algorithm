# CLAUDE.md — Quanta (CPU Scheduling Simulator)

Operating Systems presentation project. A browser-based simulator that shows how the
short-term CPU scheduler picks processes from the ready queue and allocates the CPU, and
reports per-process and average Turnaround Time and Waiting Time.

## Rules

1. Only use the skills necessary for the task given.
2. No version control manipulation at any cost (no `git add`, `commit`, `push`, `branch`,
   `checkout`, `reset`, `stash`, etc.) unless the user explicitly asks for it.
3. Strictly follow the system design and scope in this file to avoid scope creep. Anything
   outside it (new pages, features, libraries) must be proposed to and approved by the user first.
4. Use React Bits (`@react-bits` registry in `components.json`) for UI animations. Install with
   `npx shadcn@latest add @react-bits/<Component>`. React Bits is **optional**: only add it once
   the core simulator is finished and time allows. Tailwind + shadcn are already set up; the
   `@react-bits` registry still has to be added to `components.json` first.
5. Do not make any decision without consulting the user beforehand. Anything this file does not
   explicitly specify (layout, visual style, behavior, wording, default data, extra files, token or
   config changes, deleting files) must be listed and approved by the user before it is implemented.
6. Strictly follow the scope. Do not add anything outside of it, however small, unless the user
   approved it first.

## Stack

| Concern         | Choice                                            |
| --------------- | ------------------------------------------------- |
| Language        | TypeScript (strict)                               |
| UI              | React 19, client-side only                        |
| Build / dev     | Vite                                              |
| Lint            | oxlint                                            |
| Styling         | Tailwind CSS v4 (`@tailwindcss/vite`) + `tw-animate-css` |
| UI components   | shadcn (`base-luma` style, `mist` base color) on Base UI (`@base-ui/react`) |
| Variants / classes | `class-variance-authority`, `cn` (replaces clsx + tailwind-merge) |
| Icons           | Remix Icon (`@remixicon/react`)                   |
| Fonts           | Merriweather, Lora, Geist Mono (`@fontsource-variable/*`); Geist Mono for the main heading and all numbers |
| Animations      | React Bits — optional, see Rule 4; `gsap` + `@gsap/react` (required by React Bits SplitText, approved) |
| Package manager | npm                                               |

Path alias: `@/*` -> `src/*` (set in `tsconfig.json`, `tsconfig.app.json`, `vite.config.ts`).
shadcn config lives in `components.json`; add components with `npx shadcn@latest add <component>`.
The `@react-bits` registry is not yet added to `components.json` (`"registries": {}`).

No server, no Next.js, no backend, no database. Everything runs in the browser.
File uploads are read with the browser `FileReader` / `File.text()` API.

## Scope

### In scope

**Algorithms (locked — exactly these four)**

| Algorithm   | Type           | Extra input   |
| ----------- | -------------- | ------------- |
| FCFS        | Non-preemptive | —             |
| SJF         | Non-preemptive | —             |
| SRTF        | Preemptive     | —             |
| Round Robin | Preemptive     | Time Quantum  |

**Input**

- Dynamic entry: add / edit / remove rows of `Process ID`, `Arrival Time`, `Burst Time`.
- File upload: `.csv` or `.json` with the same three fields (formats below).
- Algorithm selector, plus a Time Quantum field shown only for Round Robin.
- Validation with clear inline error messages.
- Preemptive / Non-preemptive badge under the algorithm selector.
- "Run simulation" button: the simulation runs on click. Clean start: one process row (PID "P1", other fields blank)
  (grey placeholders), FCFS selected, Time Quantum blank, nothing run on load.
  Validation stays live, but an error only shows once its field is edited; clicking Run with
  invalid input reveals every error (Run is then disabled until the input is valid). Rows loaded
  from a file show their errors immediately.
- Links to the sample `.csv` / `.json` files under the upload button.

**Output**

- Gantt chart as process lanes: a CPU row (each bar shows its PID and duration, idle gaps striped),
  then one lane per process where solid blocks are running time and hatched blocks are time waiting
  in the ready queue (arrival to completion), with that process's WT at the end of the lane. Mono
  time axis. Hover tooltips on every block; the section shows a badge with the algorithm that was run.
- Process table: PID, Arrival, Burst, Completion Time (CT), Turnaround Time (TAT), Waiting Time (WT).
- System averages: average TAT and average WT, each with its formula shown underneath.
- Each process has a stable color by input position, shared by the Gantt chart and the process
  table: P1–P5 use the theme `--chart-1..5` tokens; from the 6th process on, colors are generated
  with the same lightness/chroma and golden-angle hue steps, skipping hues near the theme colors
  and the coral primary.
  Deterministic, never repeats.
- Palette "Sandy Cobalt": warm sand background and neutrals (no pure white), soft coral primary,
  desaturated process colors.
- Page header with title "Quanta" (Geist Mono) and a one-line subtitle; short descriptions under section titles.
- Each section has a small numbered mono label above its title: 01–03 "Input", 04–06 "Output".
- Single page, stacked rows: input row (left: Algorithm + Run, then Import; right: Processes),
  then Process Table | System Averages, then Gantt chart full width. Flat panels; 1px hairlines between
  rows only (no column dividers, no outer frame), no cards.
- No rounded corners anywhere (`--radius: 0`), except the process color dots (circles) in the table and Gantt lanes.
- Results table headers in small uppercase Geist Mono; numeric columns right-aligned, `tabular-nums`.
- Footer below the main grid (separate): "Quanta — Operating Systems" on the left,
  "© 2026 University of San Carlos" on the right.
- Before the first run, the output panels render empty: table headers with "No results yet.",
  averages "—" with formulas, and an empty CPU row with "Run a simulation to see the schedule."

**Formulas (single source of truth: `src/lib/metrics.ts`)**

```
TAT = Completion Time - Arrival Time
WT  = Turnaround Time - Burst Time
```

### Out of scope (needs approval first)

- Priority scheduling and priority input fields, MLFQ, any other algorithm.
- Side-by-side comparison of several algorithms.
- Extra metrics (response time, throughput, CPU utilization %).
- Step-by-step playback / animation of the scheduler.
- Routing, multiple pages, persistence (localStorage), export/download.
- Any new dependency beyond the Stack table (charting library, state library, test runner, etc.).
  Adding shadcn components from the existing registry is allowed when a planned component needs them.

## System Design

Data flows one way:

```
Input (form / file) -> validate -> Process[] + options
  -> algorithm(processes, options) -> Schedule (Gantt segments + completion times)
  -> computeMetrics(processes, schedule) -> rows + averages
  -> Output (Gantt chart, process table, averages)
```

### Data contracts (`src/types/`)

```ts
// process.ts
export interface Process {
  pid: string;         // unique, e.g. "P1"
  arrivalTime: number; // integer >= 0
  burstTime: number;   // integer >= 1
}

// schedule.ts
export type AlgorithmId = "fcfs" | "sjf" | "srtf" | "rr";

export interface SchedulerOptions {
  timeQuantum?: number; // required for "rr", integer >= 1
}

export interface GanttSegment {
  pid: string | null;  // null = CPU idle
  start: number;
  end: number;
}

export interface Schedule {
  segments: GanttSegment[];               // ordered, contiguous, adjacent same-pid merged
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
```

### Algorithm contract (`src/algorithms/`)

Every algorithm is a **pure function**:

```ts
type Scheduler = (processes: Process[], options: SchedulerOptions) => Schedule;
```

- No React, no DOM, no side effects, never mutates its input (copy first).
- Returns only the timeline and completion times. Metrics are computed in `lib/metrics.ts`, never inside an algorithm.
- Time is discrete integer units. Clock starts at 0.
- If the ready queue is empty, the CPU idles until the next arrival (emit an idle segment).
- `algorithms/index.ts` maps `AlgorithmId` to its scheduler and display label.
- Code must be readable line by line — the team defends these files in person. Prefer clear
  loops and named variables over clever one-liners. Comment each scheduling decision.

### Tie-breaking (deterministic — must match hand-calculated answers)

| Algorithm | Rule                                                                                         |
| --------- | -------------------------------------------------------------------------------------------- |
| FCFS      | Earlier arrival first; tie → input order.                                                     |
| SJF       | Among arrived processes, shortest burst first; tie → earlier arrival; tie → input order.      |
| SRTF      | Re-evaluate every time unit; shortest remaining time first; tie → earlier arrival; tie → input order. Running process is not preempted by an equal remaining time. |
| RR        | FIFO ready queue. Processes arriving at time `t` are enqueued **before** a process whose quantum expires at `t`. A process that finishes before its quantum ends releases the CPU immediately. |

### Input validation (`src/lib/validate.ts`)

- At least 1 process.
- PID non-empty and unique.
- Arrival Time: integer >= 0. Burst Time: integer >= 1.
- Time Quantum (RR only): integer >= 1.

### File formats (`src/lib/parseInput.ts`)

CSV — header row required, column order fixed:

```csv
pid,arrival,burst
P1,0,5
P2,1,3
```

JSON — array of objects:

```json
[
  { "pid": "P1", "arrival": 0, "burst": 5 },
  { "pid": "P2", "arrival": 1, "burst": 3 }
]
```

Parsed rows go through the same validation as manual entry. Samples live in `public/samples/`.

## Project Structure

```
os-algorithm/
├── CLAUDE.md
├── README.md
├── components.json               # shadcn config (style, aliases, registries)
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts                # react + tailwind plugins, @ alias
├── docs/                         # presentation notes, worked examples for the defense
├── public/
│   └── samples/                  # sample-processes.csv, sample-processes.json
└── src/
    ├── main.tsx                  # React entry
    ├── App.tsx                   # page layout; wires input -> useSimulator -> output
    ├── index.css                 # Tailwind + shadcn theme tokens (light/dark), fonts
    ├── types/
    │   ├── process.ts            # Process
    │   └── schedule.ts           # AlgorithmId, SchedulerOptions, GanttSegment, Schedule, metrics types
    ├── algorithms/               # pure scheduling logic (core of the defense)
    │   ├── fcfs.ts
    │   ├── sjf.ts
    │   ├── srtf.ts
    │   ├── roundRobin.ts
    │   └── index.ts              # registry: AlgorithmId -> scheduler + label
    ├── lib/
    │   ├── utils.ts              # shadcn cn() helper (generated)
    │   ├── metrics.ts            # CT/TAT/WT per process + averages
    │   ├── validate.ts           # input validation rules
    │   └── parseInput.ts         # CSV / JSON file parsing
    ├── hooks/
    │   └── useSimulator.ts       # holds processes, algorithm, quantum, result; runs simulation
    └── components/
        ├── input/
        │   ├── ProcessInputTable.tsx  # dynamic add/edit/remove rows
        │   ├── FileUpload.tsx         # .csv / .json upload
        │   └── AlgorithmSelector.tsx  # algorithm dropdown + Time Quantum field (RR)
        ├── output/
        │   ├── GanttChart.tsx         # timeline bars + time markers, idle shown
        │   ├── ResultsTable.tsx       # per-process CT / TAT / WT
        │   ├── AveragesSummary.tsx    # average TAT / WT
        │   └── processColors.ts       # input position -> process color (shared by chart + table)
        ├── animation/
        │   ├── LetterGlitch.tsx       # React Bits glitch placeholder in the output area while "thinking"
        │   ├── LatticeLoader.tsx      # React Bits loader beside Run simulation (random delay; tune MIN/MAX_THINKING_DELAY_MS in useSimulator.ts as you like)
        │   ├── Magnet.tsx             # React Bits magnet hover (Run simulation, Add process)
        │   └── SplitText.tsx          # React Bits word rise-in on load: subtitle, section titles + descriptions
        ├── layout/
        │   └── Section.tsx            # shared card/section wrapper
        └── ui/                        # shadcn-generated primitives (button.tsx, ...)
```

## Conventions

- File names: components `PascalCase.tsx`, everything else `camelCase.ts`.
- Named exports only (except `App`).
- Build UI from `components/ui/` primitives and Tailwind classes; use theme tokens
  (`bg-background`, `text-primary`, ...) instead of hard-coded colors.
- Do not hand-edit files in `components/ui/` unless needed; prefer re-adding via the shadcn CLI.
  The oxlint `only-export-components` warning in shadcn files is expected.
- Import via the `@/` alias (e.g. `@/lib/metrics`).
- Components only render and collect input; no scheduling math in components.
- `algorithms/` and `lib/` must not import from React or `components/`.
- Display averages rounded to 2 decimal places; keep full precision internally.
- Use the `GanttSegment.pid === null` convention for idle time everywhere.
- Run `npm run lint` and `npm run build` before reporting work as done.
