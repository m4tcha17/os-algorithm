import { RiPlayLine } from "@remixicon/react";
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

function App() {
  const simulator = useSimulator();
  const { validation, lastRun } = simulator;

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-2 px-6 py-8">
          <h1 className="font-mono text-4xl font-semibold tracking-tight">Quanta</h1>
          <p className="text-sm text-muted-foreground">
            How the short-term scheduler picks a process from the ready queue and allocates the CPU.
          </p>
        </header>

        <div className="flex flex-col divide-y">
          {/* Input */}
          <div className="grid divide-y lg:grid-cols-[30rem_1fr] lg:divide-y-0">
            <div className="flex flex-col divide-y">
              <Section label="01 — Input" title="Algorithm">
                <AlgorithmSelector
                  algorithm={simulator.algorithm}
                  timeQuantum={simulator.timeQuantum}
                  timeQuantumError={validation.timeQuantumError}
                  onAlgorithmChange={simulator.setAlgorithm}
                  onTimeQuantumChange={simulator.setTimeQuantum}
                />
                <Button className="w-full" disabled={!validation.valid} onClick={simulator.runSimulation}>
                  <RiPlayLine data-icon="inline-start" />
                  Run simulation
                </Button>
              </Section>
              <Section label="02 — Input" title="Import from file">
                <FileUpload onLoad={simulator.replaceRows} />
              </Section>
            </div>
            <Section label="03 — Input" title="Processes" description="Add, edit or remove processes in the ready queue.">
              <ProcessInputTable
                drafts={simulator.drafts}
                rowErrors={validation.rowErrors}
                formError={validation.formError}
                onAdd={simulator.addRow}
                onChange={simulator.updateRow}
                onRemove={simulator.removeRow}
              />
            </Section>
          </div>

          {/* Output */}
          {lastRun ? (
            <>
              <div className="grid divide-y xl:grid-cols-[1fr_18rem] xl:divide-y-0">
                <Section label="04 — Output" title="Process Table">
                  <ResultsTable rows={lastRun.result.rows} />
                </Section>
                <Section label="05 — Output" title="System Averages">
                  <AveragesSummary
                    averageTurnaroundTime={lastRun.result.averageTurnaroundTime}
                    averageWaitingTime={lastRun.result.averageWaitingTime}
                  />
                </Section>
              </div>

              <Section
                label="06 — Output"
                title="Gantt Chart"
                description="CPU timeline, then one lane per process. Hatched time is spent waiting in the ready queue; striped CPU time is idle."
                action={<Badge variant="outline">{algorithms[lastRun.algorithm].label}</Badge>}
              >
                <GanttChart segments={lastRun.result.schedule.segments} rows={lastRun.result.rows} />
              </Section>
            </>
          ) : (
            validation.valid && (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                Click “Run simulation” to see the schedule.
              </p>
            )
          )}
        </div>

        <footer className="mt-10 flex flex-col gap-1 px-6 pt-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
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
