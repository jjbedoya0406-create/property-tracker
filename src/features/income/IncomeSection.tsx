import { useMemo, useState } from "react";
import { AlertCircle, MoreVertical } from "lucide-react";
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
import { UndoBanner } from "@/components/UndoBanner";
import { queryKeys } from "@/api/queryKeys";
import { formatCurrency } from "@/lib/currency";
import { isYearClosed } from "@/lib/closedYears";
import { useUndoableDelete } from "@/lib/useUndoableDelete";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import type { Income } from "../../types";
import { useClosedYears } from "../closedYears/hooks";
import { IncomeEditForm } from "./IncomeEditForm";
import { IncomeForm } from "./IncomeForm";
import {
  useCreateIncome,
  useDeleteIncome,
  useIncome,
  useUpdateIncome,
} from "./hooks";

interface IncomeSectionProps {
  propertyId: string;
}

export function IncomeSection({ propertyId }: IncomeSectionProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const { data: income, isPending, isError, error } = useIncome(propertyId);
  const { data: closedYears } = useClosedYears();
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncomeMutation = useDeleteIncome();
  const undoableDelete = useUndoableDelete<Income>({
    queryKey: queryKeys.income.all,
    getId: (entry) => entry.incomeId,
    onCommit: (entry) => deleteIncomeMutation.mutateAsync(entry.incomeId),
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const runningTotal = useMemo(
    () => (income ?? []).reduce((sum, entry) => sum + entry.amount, 0),
    [income],
  );

  const filtered = useMemo(() => {
    return (income ?? [])
      .filter(
        (entry) =>
          (!fromDate || entry.date >= fromDate) &&
          (!toDate || entry.date <= toDate),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [income, fromDate, toDate]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-lg">{t("income.title")}</CardTitle>
        <p className="tabular-nums">
          <span className="text-muted-foreground">{t("income.total")}</span>{" "}
          <span className="font-medium">
            {formatCurrency(runningTotal, currency)}
          </span>
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showAddForm ? (
          <IncomeForm
            isSubmitting={createIncome.isPending}
            onSubmit={(input) => {
              createIncome.mutate(
                { propertyId, ...input },
                { onSuccess: () => setShowAddForm(false) },
              );
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <Button className="self-start" onClick={() => setShowAddForm(true)}>
            {t("income.logButton")}
          </Button>
        )}

        {isPending && (
          <p className="text-muted-foreground">{t("income.loading")}</p>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {error instanceof Error ? error.message : t("income.loadError")}
            </AlertDescription>
          </Alert>
        )}

        {!isPending && !isError && (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="income-from">{t("income.fromLabel")}</Label>
                <Input
                  id="income-from"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="income-to">{t("income.toLabel")}</Label>
                <Input
                  id="income-to"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-muted-foreground">
                {(income ?? []).length === 0
                  ? t("income.emptyNoneYet")
                  : t("income.emptyNoneInRange")}
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border">
                {filtered.map((entry) =>
                  editingId === entry.incomeId ? (
                    <div key={entry.incomeId} className="px-4 py-3">
                      <IncomeEditForm
                        income={entry}
                        isSubmitting={updateIncome.isPending}
                        onSubmit={(input) => {
                          updateIncome.mutate(
                            { ...entry, ...input },
                            { onSuccess: () => setEditingId(null) },
                          );
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    <div
                      key={entry.incomeId}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">
                          {entry.date}
                        </span>
                        {entry.notes && (
                          <span className="text-sm text-muted-foreground">
                            {entry.notes}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-medium">
                          {formatCurrency(entry.amount, currency)}
                        </span>
                        {isYearClosed(closedYears ?? [], entry.date) ? (
                          <Badge variant="secondary">{t("common.closed")}</Badge>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("income.rowActions")}
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onSelect={() => setEditingId(entry.incomeId)}
                              >
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => undoableDelete.remove(entry)}
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
          message={t("income.deletedMessage")}
          onUndo={undoableDelete.undo}
        />
      )}
    </Card>
  );
}
