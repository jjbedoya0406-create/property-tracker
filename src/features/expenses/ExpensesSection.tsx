import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Running total reflects all expenses for the property, independent of
  // the date-range filter below (PRD §7 lists these as two separate
  // requirements: a filterable list, and a running total).
  const runningTotal = useMemo(
    () => (expenses ?? []).reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
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
    <section>
      <h2>Expenses</h2>
      <p>
        <Link to={`/capture?propertyId=${propertyId}`}>Add expense</Link>
      </p>

      {isPending && <p>Loading expenses…</p>}
      {isError && (
        <p role="alert">
          {error instanceof Error ? error.message : "Failed to load expenses."}
        </p>
      )}

      {!isPending && !isError && (
        <>
          <p>Total: {currencyFormatter.format(runningTotal)}</p>

          <div>
            <label htmlFor="expenses-from">From</label>
            <input
              id="expenses-from"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
            <label htmlFor="expenses-to">To</label>
            <input
              id="expenses-to"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p>
              {(expenses ?? []).length === 0
                ? "No expenses yet."
                : "No expenses in this date range."}
            </p>
          ) : (
            <ul>
              {filtered.map((expense) => (
                <li key={expense.expenseId}>
                  {expense.date} — {expense.vendor} —{" "}
                  {currencyFormatter.format(expense.amount)} —{" "}
                  {expense.category}
                  {expense.receiptDriveUrl && (
                    <>
                      {" — "}
                      <a
                        href={expense.receiptDriveUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Receipt
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
