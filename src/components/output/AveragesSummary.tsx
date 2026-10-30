interface AveragesSummaryProps {
  averageTurnaroundTime: number;
  averageWaitingTime: number;
}

interface StatProps {
  label: string;
  value: number;
  formula: string;
}

function Stat({ label, value, formula }: StatProps) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-muted px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      {/* Rounded for display only; metrics keep full precision. */}
      <span className="font-mono text-3xl font-semibold tabular-nums">{value.toFixed(2)}</span>
      <span className="font-mono text-xs text-muted-foreground">{formula}</span>
    </div>
  );
}

export function AveragesSummary({ averageTurnaroundTime, averageWaitingTime }: AveragesSummaryProps) {
  return (
    <div className="gap-3">
      <Stat label="Average Turnaround Time" value={averageTurnaroundTime} formula="TAT = CT − AT" />
      <Stat label="Average Waiting Time" value={averageWaitingTime} formula="WT = TAT − BT" />
    </div>
  );
}
