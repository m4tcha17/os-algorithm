// The first five processes use the theme chart tokens (--chart-1..5).
const THEME_COLOR_COUNT = 5;

// Generated colors match the softness of the theme tokens: same lightness and chroma.
const LIGHTNESS = 0.72;
const CHROMA = 0.11;
const START_HUE = 262; // same hue as --chart-1
const GOLDEN_ANGLE = 137.508; // spreads hues evenly, so neighbouring processes never look alike

// Hues already in use: --chart-1..5 and the coral primary (25), so no process looks like a button.
const TAKEN_HUES = [262, 45, 165, 85, 305, 25];
const MIN_HUE_DISTANCE = 15; // degrees
const NUDGE = 20; // degrees to move a hue that lands too close to a taken one

// Shortest distance between two hues on the 0–360 color wheel.
function hueDistance(a: number, b: number): number {
  const difference = Math.abs(a - b) % 360;
  return Math.min(difference, 360 - difference);
}

function isTooClose(hue: number): boolean {
  return TAKEN_HUES.some((taken) => hueDistance(hue, taken) < MIN_HUE_DISTANCE);
}

// Returns a CSS color for the process at this position in the input.
// Deterministic: the same position always gets the same color.
export function processColor(index: number): string {
  if (index < THEME_COLOR_COUNT) {
    return `var(--chart-${index + 1})`;
  }

  let hue = (START_HUE + index * GOLDEN_ANGLE) % 360;
  // Move the hue along the wheel until it is clear of every taken hue (bounded, the wheel is never full).
  for (let attempt = 0; attempt < 18 && isTooClose(hue); attempt++) {
    hue = (hue + NUDGE) % 360;
  }
  return `oklch(${LIGHTNESS} ${CHROMA} ${hue.toFixed(1)})`;
}
