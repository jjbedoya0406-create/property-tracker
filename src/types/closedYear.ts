// A tax year that's been permanently locked at the portfolio level
// (issue #10) — once closed, no expense or income entry dated within it
// can be added, edited, or deleted, across every property/unit. No
// reopen path for v1: closing is a one-way, append-only record.
export interface ClosedYear {
  year: number;
  closedAt: string;
}
