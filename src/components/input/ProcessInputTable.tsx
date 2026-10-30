import { RiAddLine, RiCloseLine } from "@remixicon/react";
import Magnet from "@/components/animation/Magnet";
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
  placeholder?: string;
  onChange: (value: string) => void;
}

function Field({ label, value, error, numeric, placeholder, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <Input
        aria-label={label}
        aria-invalid={error ? true : undefined}
        inputMode={numeric ? "numeric" : undefined}
        className={numeric ? "font-mono tabular-nums" : undefined}
        value={value}
        placeholder={placeholder}
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
            <TableHead className="w-9 px-0">
              <span className="sr-only">Remove</span>
            </TableHead>
            <TableHead>Process ID</TableHead>
            <TableHead>Arrival Time</TableHead>
            <TableHead>Burst Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drafts.map((draft, index) => {
            const errors = rowErrors[draft.id] ?? {};
            return (
              <TableRow key={draft.id} className="group align-top hover:bg-transparent">
                <TableCell className="px-0">
                  {/* Shown only while the mouse is over the row (or the button has keyboard focus); always shown on touch */}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${draft.pid || "row"}`}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-remove [@media(hover:none)]:opacity-100"
                    onClick={() => onRemove(draft.id)}
                  >
                    <RiCloseLine />
                  </Button>
                </TableCell>
                <TableCell>
                  <Field
                    label="Process ID"
                    value={draft.pid}
                    error={errors.pid}
                    placeholder={`P${index + 1}`}
                    onChange={(value) => onChange(draft.id, "pid", value)}
                  />
                </TableCell>
                <TableCell>
                  <Field
                    label={`Arrival time of ${draft.pid}`}
                    value={draft.arrival}
                    error={errors.arrival}
                    numeric
                    placeholder="0"
                    onChange={(value) => onChange(draft.id, "arrival", value)}
                  />
                </TableCell>
                <TableCell>
                  <Field
                    label={`Burst time of ${draft.pid}`}
                    value={draft.burst}
                    error={errors.burst}
                    numeric
                    placeholder="5"
                    onChange={(value) => onChange(draft.id, "burst", value)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Magnet wrapperClassName="self-start" innerClassName="flex" padding={0} magnetStrength={8} maxOffset={4}>
        <Button variant="outline" onClick={onAdd}>
          <RiAddLine data-icon="inline-start" />
          Add process
        </Button>
      </Magnet>
    </div>
  );
}
