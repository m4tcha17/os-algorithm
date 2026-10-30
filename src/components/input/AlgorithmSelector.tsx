import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { algorithms } from "@/algorithms";
import type { AlgorithmId } from "@/types/schedule";

interface AlgorithmSelectorProps {
  algorithm: AlgorithmId;
  timeQuantum: string;
  timeQuantumError?: string;
  onAlgorithmChange: (id: AlgorithmId) => void;
  onTimeQuantumChange: (value: string) => void;
}

const ALGORITHM_IDS = Object.keys(algorithms) as AlgorithmId[];

// value -> label, so the closed Select shows the label instead of the raw id.
const SELECT_ITEMS: Record<string, string> = {};
for (const id of ALGORITHM_IDS) {
  SELECT_ITEMS[id] = algorithms[id].label;
}

export function AlgorithmSelector({
  algorithm,
  timeQuantum,
  timeQuantumError,
  onAlgorithmChange,
  onTimeQuantumChange,
}: AlgorithmSelectorProps) {
  const selected = algorithms[algorithm];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="algorithm">Scheduling algorithm</Label>
        <Select
          items={SELECT_ITEMS}
          value={algorithm}
          onValueChange={(value) => {
            if (value) onAlgorithmChange(value as AlgorithmId);
          }}
        >
          <SelectTrigger id="algorithm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALGORITHM_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {algorithms[id].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant={selected.preemptive ? "default" : "secondary"}>
          {selected.preemptive ? "Preemptive" : "Non-preemptive"}
        </Badge>
      </div>

      {algorithm === "rr" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="time-quantum">Time Quantum</Label>
          <Input
            id="time-quantum"
            inputMode="numeric"
            className="font-mono tabular-nums"
            aria-invalid={timeQuantumError ? true : undefined}
            value={timeQuantum}
            onChange={(event) => onTimeQuantumChange(event.target.value)}
          />
          {timeQuantumError && <p className="px-3 text-xs text-destructive">{timeQuantumError}</p>}
        </div>
      )}
    </div>
  );
}
