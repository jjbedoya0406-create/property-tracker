// Fixed 5-color cap (4 categories + "Other") — never an uncapped rainbow
// legend, per the issue's own requirement. Index-based, not tied to any
// particular category, since which category lands in which slot changes
// month to month.
//
// Chosen for hue + lightness spread rather than brand cohesion — the
// Design System's core palette clusters several tokens at similar dark,
// desaturated tones (--action, --stamp, --ink-muted), which reads fine
// for buttons/text but made adjacent pie slices hard to tell apart. Also
// avoids reusing `--stamp` (#2B3A55), which the design doc reserves
// exclusively for the "LOGGED" save-stamp mark.
export const CATEGORY_CHART_COLORS = [
  "#2F5233", // action green (ledger's primary accent)
  "#A13D2F", // error/rust red
  "#B8862E", // warm gold
  "#4E6E8E", // dusty blue
  "#9C9186", // warm taupe (reserved for "Other")
];

interface DonutSlice {
  amount: number;
  percent: number;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
}

// Hand-rolled inline SVG — no chart dependency, since 5 slices max is
// simple enough to not warrant one (issue #4). Concentric-stroke
// technique: one circle per slice, same radius, each offset by the
// running total of percent-so-far via stroke-dasharray/dashoffset —
// simpler and more robust than computing arc paths by hand.
export function DonutChart({ slices, size = 160 }: DonutChartProps) {
  const strokeWidth = size * 0.22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Expense category breakdown"
    >
      {slices.map((slice, index) => {
        const dash = (slice.percent / 100) * circumference;
        const offset = -((cumulativePercent / 100) * circumference);
        cumulativePercent += slice.percent;
        return (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
    </svg>
  );
}
