// Theme chart tokens, cycled by the process's position in the input.
// Listed as full class names so Tailwind can see them at build time.
const PROCESS_COLOR_CLASSES = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

export function processColorClass(index: number): string {
  return PROCESS_COLOR_CLASSES[index % PROCESS_COLOR_CLASSES.length];
}
