export interface Process {
  pid: string; // unique, e.g. "P1"
  arrivalTime: number; // integer >= 0
  burstTime: number; // integer >= 1
}
