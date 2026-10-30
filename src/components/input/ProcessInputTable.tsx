import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProcessDraft, RowErrors } from "@/lib/validate";
import type { RawProcessRow } from "@/lib/parseInput";

interface ProcessInputTableProps {
  drafts: ProcessDraft[];
  rowErrors: Record<string, RowErrors>;
  formError?: string;
  onAdd: () => void;
  onChange: (id: string, field: keyof RawProcessRow, value: string) => void;
  onRemove: (id: string) => void;
}

interface FieldProps {
  label: string;
  value: string;
  error?: string;
  numeric?: boolean;
  onChange: (value: string) => void;
}

function Field({ label, value, error, numeric, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <Input
        aria-label={label}
        aria-invalid={error ? true : undefined}
        inputMode={numeric ? "numeric" : undefined}
        className={numeric ? "font-mono tabular-nums" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <p className="px-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ProcessInputTable({ drafts, rowErrors, formError, onAdd, onChange, onRemove }: ProcessInputTableProps) {
  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process ID</TableHead>
            <TableHead>Arrival Time</TableHead>
            <TableHead>Burst Time</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Remove</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drafts.map((draft) => {
            const errors = rowErrors[draft.id] ?? {};
            return (
              <TableRow key={draft.id} className="align-top hover:bg-transparent">
                <TableCell>
                  <Field
                    label="Process ID"
                    value={draft.pid}
                    error={errors.pid}
                    onChange={(value) => onChange(draft.id, "pid", value)}
                  />
                </TableCell>
                <TableCell>
                  <Field
                    label={`Arrival time of ${draft.pid}`}
                    value={draft.arrival}
                    error={errors.arrival}
                    numeric
                    onChange={(value) => onChange(draft.id, "arrival", value)}
                  />
                </TableCell>
                <TableCell>
                  <Field
                    label={`Burst time of ${draft.pid}`}
                    value={draft.burst}
                    error={errors.burst}
                    numeric
                    onChange={(value) => onChange(draft.id, "burst", value)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${draft.pid || "row"}`}
                    onClick={() => onRemove(draft.id)}
                  >
                    <RiDeleteBinLine />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button variant="outline" className="self-start" onClick={onAdd}>
        <RiAddLine data-icon="inline-start" />
        Add process
      </Button>
    </div>
  );
}
