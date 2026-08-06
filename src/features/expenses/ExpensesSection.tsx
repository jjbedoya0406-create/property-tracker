import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoggedStamp } from "@/components/LoggedStamp";
import { toDisplayCase } from "@/lib/text";
import { useCategories } from "../categories/hooks";
import { useExpenses } from "./hooks";

interface ExpensesSectionProps {
  propertyId: string;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function ExpensesSection({ propertyId }: ExpensesSectionProps) {
  const { data: expenses, isPending, isError, error } = useExpenses(propertyId);
  // Unfiltered (includes archived) so historical expenses still resolve a
  // name for categories that have since been archived (Story 1.6).
  const { data: categories } = useCategories();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const location = useLocation();
  const justLoggedExpenseId = (
    location.state as { justLoggedExpenseId?: string } | null
  )?.justLoggedExpenseId;

  // Running total reflects all expenses for the property, independent of
  // the date-range filter below (PRD §7 lists these as two separate
  // requirements: a filterable list, and a running total).
  const runningTotal = useMemo(
    () => (expenses ?? []).reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const categoryNameById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.categoryId, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    return (expenses ?? [])
      .filter(
        (expense) =>
          (!fromDate || expense.date >= fromDate) &&
          (!toDate || expense.date <= toDate),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, fromDate, toDate]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-lg">Expenses</CardTitle>
        <p className="tabular-nums">
          <span className="text-muted-foreground">Total</span>{" "}
          <span className="font-medium">
            {currencyFormatter.format(runningTotal)}
          </span>
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button asChild className="self-start">
          <Link to={`/capture?propertyId=${propertyId}`}>Log expense</Link>
        </Button>

        {isPending && (
          <p className="text-muted-foreground">Loading expenses…</p>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Failed to load expenses."}
            </AlertDescription>
          </Alert>
        )}

        {!isPending && !isError && (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expenses-from">From</Label>
                <Input
                  id="expenses-from"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expenses-to">To</Label>
                <Input
                  id="expenses-to"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-muted-foreground">
                {(expenses ?? []).length === 0
                  ? "No expenses yet — log one above to get started."
                  : "No expenses in this date range."}
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border">
                {filtered.map((expense) => (
                  <div
                    key={expense.expenseId}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {toDisplayCase(expense.vendor)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {expense.date}
                        </span>
                        <span className="rounded-[6px] bg-category-pill px-2 py-0.5 text-[11px] text-category-pill-foreground">
                          {categoryNameById.get(expense.categoryId) ??
                            "Unknown category"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expense.expenseId === justLoggedExpenseId && (
                        <LoggedStamp />
                      )}
                      <span className="tabular-nums font-medium">
                        {currencyFormatter.format(expense.amount)}
                      </span>
                      {expense.receiptDriveUrl && (
                        <Button asChild variant="ghost" size="icon-sm">
                          <a
                            href={expense.receiptDriveUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="View receipt"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
