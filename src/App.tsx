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
  const pidOrder = lastRun ? lastRun.result.rows.map((row) => row.pid) : [];

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">CPU Scheduling Simulator</h1>
          <p className="text-sm text-muted-foreground">
            How the short-term scheduler picks a process from the ready queue and allocates the CPU.
          </p>
        </header>

        {/* Input */}
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
          <Section title="Processes" description="Add, edit or remove processes in the ready queue.">
            <ProcessInputTable
              drafts={simulator.drafts}
              rowErrors={validation.rowErrors}
              formError={validation.formError}
              onAdd={simulator.addRow}
              onChange={simulator.updateRow}
              onRemove={simulator.removeRow}
            />
          </Section>

          <div className="flex flex-col gap-6">
            <Section title="Algorithm">
              <AlgorithmSelector
                algorithm={simulator.algorithm}
                timeQuantum={simulator.timeQuantum}
                timeQuantumError={validation.timeQuantumError}
                onAlgorithmChange={simulator.setAlgorithm}
                onTimeQuantumChange={simulator.setTimeQuantum}
              />
              <Button className="mt-5 w-full" disabled={!validation.valid} onClick={simulator.runSimulation}>
                <RiPlayLine data-icon="inline-start" />
                Run simulation
              </Button>
            </Section>
            <Section title="Import from file">
              <FileUpload onLoad={simulator.replaceRows} />
            </Section>
          </div>
        </div>

        {/* Output */}
        {lastRun ? (
          <>
            <Section
              title="Gantt Chart"
              description="Execution timeline. Striped blocks are CPU idle time."
              action={<Badge variant="outline">{algorithms[lastRun.algorithm].label}</Badge>}
            >
              <GanttChart segments={lastRun.result.schedule.segments} pidOrder={pidOrder} />
            </Section>

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
              <Section title="Process Table">
                <ResultsTable rows={lastRun.result.rows} />
              </Section>
              <Section title="System Averages">
                <AveragesSummary
                  averageTurnaroundTime={lastRun.result.averageTurnaroundTime}
                  averageWaitingTime={lastRun.result.averageWaitingTime}
                />
              </Section>
            </div>
          </>
        ) : (
          <div className="rounded-4xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
            {validation.valid
              ? "Click “Run simulation” to see the schedule."
              : "Fix the highlighted input errors, then run the simulation."}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
