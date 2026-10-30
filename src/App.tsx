import { useCallback, useState } from "react";
import { RiPlayLine } from "@remixicon/react";
import LatticeLoader from "@/components/animation/LatticeLoader";
import LetterGlitch from "@/components/animation/LetterGlitch";
import Magnet from "@/components/animation/Magnet";
import SplitText from "@/components/animation/SplitText";
import VariableProximity from "@/components/animation/VariableProximity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/layout/Section";
import { ProcessInputTable } from "@/components/input/ProcessInputTable";
import { AlgorithmSelector } from "@/components/input/AlgorithmSelector";
import { FileUpload } from "@/components/input/FileUpload";
import { GanttChart } from "@/components/output/GanttChart";
import { ResultsTable } from "@/components/output/ResultsTable";
import { AveragesSummary } from "@/components/output/AveragesSummary";
import { useSimulator } from "@/hooks/useSimulator";
import { algorithms } from "@/algorithms";
import { cn } from "@/lib/utils";

// The glitch canvas needs real color strings, so read the theme tokens' current values.
function readThemeColor(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

// Blocks fade up one after another: the whole page in reading order on load, the output again after each run.
const REVEAL = "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both";

function App() {
  const simulator = useSimulator();
  const { visibleErrors, canRun, lastRun, runStatus } = simulator;
  // On first load the output follows the input panels (80ms steps); after a run it starts right away.
  const outputDelays = runStatus === "idle" ? ["delay-320", "delay-400", "delay-480"] : ["delay-0", "delay-80", "delay-160"];

  // Remember the output's height so the "thinking" placeholder can take the same space (no page jump).
  const [outputHeight, setOutputHeight] = useState<number>();
  const measureOutput = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => setOutputHeight(entry.borderBoxSize[0].blockSize));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-10 sm:px-6">
        <header className={cn("flex flex-col gap-2 px-6 py-8", REVEAL)}>
          <h1 className="font-mono text-4xl font-semibold tracking-tight">
            {/* Letters near the cursor swell from semibold (600) to black (900); Geist Mono only has a weight axis. */}
            <VariableProximity
              label="Quanta"
              fromFontVariationSettings="'wght' 600"
              toFontVariationSettings="'wght' 900"
              radius={100}
              falloff="linear"
              style={{ fontFamily: "inherit" }}
            />
          </h1>
          <p className="text-sm text-muted-foreground">
            <SplitText
              text="Enter processes, pick a scheduling algorithm, and see the order the CPU runs them in."
              className="align-top"
              tag="span"
              splitType="words"
              effect="rise"
              trigger="load"
              textAlign="left"
            />
          </p>
        </header>

        <div className="flex flex-col divide-y">
          {/* Input */}
          <div className="grid divide-y lg:grid-cols-[30rem_1fr] lg:divide-y-0">
            <div className="flex flex-col divide-y">
              <Section label="01 — Input" title="Algorithm" className={cn(REVEAL, "delay-80")}>
                <AlgorithmSelector
                  algorithm={simulator.algorithm}
                  timeQuantum={simulator.timeQuantum}
                  timeQuantumError={visibleErrors.timeQuantumError}
                  onAlgorithmChange={simulator.setAlgorithm}
                  onTimeQuantumChange={simulator.setTimeQuantum}
                />
                <div className="flex items-center gap-4">
                  <Magnet innerClassName="flex" padding={0} magnetStrength={8} maxOffset={4} disabled={!canRun}>
                    <Button className="max-w-40" disabled={!canRun} onClick={simulator.runSimulation}>
                      <RiPlayLine data-icon="inline-start" />
                      Run simulation
                    </Button>
                  </Magnet>
                  {runStatus !== "idle" && (
                    <LatticeLoader
                      status={runStatus === "thinking" ? "working" : "done"}
                      doneColor="currentColor"
                      className="text-muted-foreground"
                    />
                  )}
                </div>
              </Section>
              <Section label="02 — Input" title="Import from file" className={cn(REVEAL, "delay-160")}>
                <FileUpload onLoad={simulator.replaceRows} />
              </Section>
            </div>
            <Section
              label="03 — Input"
              title="Processes"
              description="Add, edit or remove processes in the ready queue."
              className={cn(REVEAL, "delay-240")}
            >
              <ProcessInputTable
                drafts={simulator.drafts}
                rowErrors={visibleErrors.rowErrors}
                formError={visibleErrors.formError}
                onAdd={simulator.addRow}
                onChange={simulator.updateRow}
                onRemove={simulator.removeRow}
              />
            </Section>
          </div>

          {/* Output */}
          {runStatus === "thinking" ? (
            // Placeholder while "thinking" (same height as the last output; 24rem if there was none): letters rest in the muted color and glitch in the P1–P5 colors.
            <LetterGlitch
              className="h-96"
              style={{ height: outputHeight }}
              baseColor={readThemeColor("--muted-foreground")}
              glitchColors={[1, 2, 3, 4, 5].map((n) => readThemeColor(`--chart-${n}`))}
              fontFamily={readThemeColor("--font-mono")}
            />
          ) : (
            // Before the first run the same panels render empty (clean state).
            <div ref={measureOutput} className="flex flex-col divide-y">
              <div className="grid divide-y xl:grid-cols-[1fr_18rem] xl:divide-y-0">
                <Section label="04 — Output" title="Process Table" className={cn(REVEAL, outputDelays[0])}>
                  <ResultsTable rows={lastRun?.result.rows ?? []} />
                </Section>
                <Section label="05 — Output" title="System Averages" className={cn(REVEAL, outputDelays[1])}>
                  <AveragesSummary
                    averageTurnaroundTime={lastRun?.result.averageTurnaroundTime}
                    averageWaitingTime={lastRun?.result.averageWaitingTime}
                  />
                </Section>
              </div>

              <Section
                label="06 — Output"
                title="Gantt Chart"
                description="Top row: which process the CPU runs over time (striped = CPU idle). Rows below: each process, solid when running, hatched while waiting in the ready queue."
                action={lastRun && <Badge variant="outline">{algorithms[lastRun.algorithm].label}</Badge>}
                className={cn(REVEAL, outputDelays[2])}
              >
                <GanttChart segments={lastRun?.result.schedule.segments ?? []} rows={lastRun?.result.rows ?? []} />
              </Section>
            </div>
          )}
        </div>

        <footer
          className={cn(
            "mt-10 flex flex-col gap-1 px-6 pt-6 text-sm text-muted-foreground sm:flex-row sm:justify-between",
            REVEAL,
            "delay-560",
          )}
        >
          <p>
            <span className="font-mono text-foreground">Quanta</span> — Operating Systems
          </p>
          <p className="font-mono">© 2026 University of San Carlos</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
