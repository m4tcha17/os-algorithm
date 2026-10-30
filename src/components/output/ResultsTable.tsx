import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProcessMetrics } from "@/types/schedule";
import { cn } from "@/lib/utils";
import { processColor } from "@/components/output/processColors";

interface ResultsTableProps {
  rows: ProcessMetrics[];
}

const COLUMNS = [
  { key: "arrivalTime", label: "Arrival", abbr: "AT" },
  { key: "burstTime", label: "Burst", abbr: "BT" },
  { key: "completionTime", label: "Completion", abbr: "CT" },
  { key: "turnaroundTime", label: "Turnaround", abbr: "TAT" },
  { key: "waitingTime", label: "Waiting", abbr: "WT" },
] as const;

const HEAD_CLASS = "font-mono text-xs tracking-wider uppercase";

export function ResultsTable({ rows }: ResultsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={HEAD_CLASS}>PID</TableHead>
          {COLUMNS.map((column) => (
            <TableHead key={column.key} className={cn(HEAD_CLASS, "text-right")}>
              {column.label} <span className="text-muted-foreground">({column.abbr})</span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Empty state before the first run. */}
        {rows.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={COLUMNS.length + 1} className="py-8 text-center text-sm text-muted-foreground">
              No results yet.
            </TableCell>
          </TableRow>
        )}
        {rows.map((row, index) => (
          <TableRow key={row.pid}>
            <TableCell className="font-mono bold">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: processColor(index) }} />
                {row.pid}
              </span>
            </TableCell>
            {COLUMNS.map((column) => (
              <TableCell key={column.key} className="text-right font-mono tabular-nums">
                {row[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
