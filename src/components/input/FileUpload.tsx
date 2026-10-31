import { useRef, useState, type ChangeEvent } from "react";
import { RiUploadLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { parseInputFile, type RawProcessRow } from "@/lib/parseInput";

interface FileUploadProps {
  onLoad: (rows: RawProcessRow[]) => void;
}

type Status = { kind: "idle" } | { kind: "loaded"; message: string } | { kind: "error"; message: string };

export function FileUpload({ onLoad }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;

    const parsed = parseInputFile(file.name, await file.text());
    if (parsed.ok) {
      onLoad(parsed.rows);
      setStatus({ kind: "loaded", message: `Loaded ${parsed.rows.length} processes from ${file.name}.` });
    } else {
      setStatus({ kind: "error", message: parsed.error });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={inputRef} type="file" accept=".csv,.json" className="hidden" onChange={handleChange} />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <RiUploadLine data-icon="inline-start" />
        Upload .csv or .json
      </Button>

      {status.kind === "loaded" && <p className="text-xs text-muted-foreground">{status.message}</p>}
      {status.kind === "error" && <p className="text-xs text-destructive">{status.message}</p>}

      <div className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Columns: <code className="font-mono">pid, arrival, burst</code>.
        </p>
        <p className="text-xs text-muted-foreground">
          Sample Files:{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="/samples/sample-processes.csv" download>
            CSV
          </a>{" "}
          ·{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="/samples/sample-processes.json" download>
            JSON
          </a>
        </p>
      </div>
    </div>
  );
}
