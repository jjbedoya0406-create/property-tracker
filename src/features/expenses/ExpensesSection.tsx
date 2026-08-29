import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, ExternalLink, MoreVertical } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoggedStamp } from "@/components/LoggedStamp";
import { UndoBanner } from "@/components/UndoBanner";
import { queryKeys } from "@/api/queryKeys";
import { formatCurrency } from "@/lib/currency";
import { isYearClosed } from "@/lib/closedYears";
import { useUndoableDelete } from "@/lib/useUndoableDelete";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import { useCategories } from "../categories/hooks";
import { useClosedYears } from "../closedYears/hooks";
import type { Expense } from "../../types";
import { ExpenseEditForm } from "./ExpenseEditForm";
import { useDeleteExpense, useExpenses, useUpdateExpense } from "./hooks";

interface ExpensesSectionProps {
  propertyId: string;
}

export function ExpensesSection({ propertyId }: ExpensesSectionProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const { data: expenses, isPending, isError, error } = useExpenses(propertyId);
  // Unfiltered (includes archived) so historical expenses still resolve a
  // name for categories that have since been archived (Story 1.6).
  const { data: categories } = useCategories();
  const { data: closedYears } = useClosedYears();
  const updateExpense = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const undoableDelete = useUndoableDelete<Expense>({
    queryKey: queryKeys.expenses.all,
    getId: (expense) => expense.expenseId,
    onCommit: (expense) => deleteExpenseMutation.mutateAsync(expense.expenseId),
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
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
        <CardTitle className="text-lg">{t("expenses.title")}</CardTitle>
        <p className="tabular-nums">
          <span className="text-muted-foreground">{t("expenses.total")}</span>{" "}
          <span className="font-medium">
            {formatCurrency(runningTotal, currency)}
          </span>
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button asChild className="self-start">
          <Link to={`/capture?propertyId=${propertyId}`}>
            {t("expenses.logButton")}
          </Link>
        </Button>

        {isPending && (
          <p className="text-muted-foreground">{t("expenses.loading")}</p>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {error instanceof Error ? error.message : t("expenses.loadError")}
            </AlertDescription>
          </Alert>
        )}

        {!isPending && !isError && (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expenses-from">{t("expenses.fromLabel")}</Label>
                <Input
                  id="expenses-from"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expenses-to">{t("expenses.toLabel")}</Label>
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
                  ? t("expenses.emptyNoneYet")
                  : t("expenses.emptyNoneInRange")}
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border">
                {filtered.map((expense) =>
                  editingId === expense.expenseId ? (
                    <div key={expense.expenseId} className="px-4 py-3">
                      <ExpenseEditForm
                        expense={expense}
                        categories={categories ?? []}
                        isSubmitting={updateExpense.isPending}
                        onSubmit={(input) => {
                          updateExpense.mutate(
                            { ...expense, ...input },
                            { onSuccess: () => setEditingId(null) },
                          );
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    <div
                      key={expense.expenseId}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {categoryNameById.get(expense.categoryId) ??
                            t("expenses.unknownCategory")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {expense.date}
                        </span>
                        {expense.notes && (
                          <span className="text-sm text-muted-foreground">
                            {expense.notes}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {expense.expenseId === justLoggedExpenseId && (
                          <LoggedStamp />
                        )}
                        <span className="tabular-nums font-medium">
                          {formatCurrency(expense.amount, currency)}
                        </span>
                        {expense.receiptDriveUrl && (
                          <Button asChild variant="ghost" size="icon-sm">
                            <a
                              href={expense.receiptDriveUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={t("expenses.viewReceipt")}
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        )}
                        {isYearClosed(closedYears ?? [], expense.date) ? (
                          <Badge variant="secondary">{t("common.closed")}</Badge>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("expenses.rowActions")}
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onSelect={() => setEditingId(expense.expenseId)}
                              >
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => undoableDelete.remove(expense)}
                              >
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      {undoableDelete.pendingItem && (
        <UndoBanner
          message={t("expenses.deletedMessage")}
          onUndo={undoableDelete.undo}
        />
      )}
    </Card>
  );
}
