import { useMemo, useState } from "react";
import { AlertCircle, ChevronDown, MoreVertical } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleSectionCard } from "@/components/CollapsibleSectionCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UndoBanner } from "@/components/UndoBanner";
import { queryKeys } from "@/api/queryKeys";
import { formatCurrency } from "@/lib/currency";
import { isYearClosed } from "@/lib/closedYears";
import { formatMonthLabel } from "@/lib/monthLabel";
import { cn } from "@/lib/utils";
import { useUndoableDelete } from "@/lib/useUndoableDelete";
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import type { ClosedYear, Income } from "../../types";
import { useClosedYears } from "../closedYears/hooks";
import { groupIncomeByYear, type MonthGroup } from "./groupByYear";
import { IncomeEditForm } from "./IncomeEditForm";
import { IncomeForm } from "./IncomeForm";
import {
  useCreateIncome,
  useDeleteIncome,
  useIncome,
  useUpdateIncome,
} from "./hooks";

const RECENT_MONTHS_DEFAULT = 3;

function formatPaymentsCount(count: number, t: TranslateFn): string {
  return count === 1
    ? t("income.onePayment")
    : t("income.paymentsCount", { count: String(count) });
}

interface IncomeSectionProps {
  propertyId: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function IncomeSection({
  propertyId,
  isExpanded,
  onToggleExpanded,
}: IncomeSectionProps) {
  const { t } = useTranslation();
  const { currency, language } = useSettings();
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
  // No year auto-expands on load — the headline shows an all-time total
  // until you tap one open.
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const years = useMemo(() => groupIncomeByYear(income ?? []), [income]);
  const expandedYearGroup =
    expandedYear !== null ? years.find((y) => y.year === expandedYear) : undefined;
  const allTimeTotal = useMemo(
    () => (income ?? []).reduce((sum, entry) => sum + entry.amount, 0),
    [income],
  );
  const headlineLabel =
    expandedYear !== null
      ? t("income.totalForYear", { year: String(expandedYear) })
      : t("income.totalAllTime");
  const headlineTotal =
    expandedYear !== null ? (expandedYearGroup?.total ?? 0) : allTimeTotal;

  function toggleYear(year: number) {
    setExpandedYear((current) => (current === year ? null : year));
    setShowAllMonths(false);
    setExpandedMonth(null);
  }

  return (
    <>
    <CollapsibleSectionCard
      title={t("income.title")}
      hint={`${t("income.totalAllTime")} ${formatCurrency(allTimeTotal, currency)}`}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
    >
      <div className="flex flex-col gap-4">
        <p className="tabular-nums">
          <span className="text-muted-foreground">{headlineLabel}</span>{" "}
          <span className="font-medium">
            {formatCurrency(headlineTotal, currency)}
          </span>
        </p>
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
            {years.length === 0 ? (
              <p className="text-muted-foreground">{t("income.emptyNoneYet")}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {years.map((yearGroup) => {
                  const isExpanded = yearGroup.year === expandedYear;
                  const visibleMonths = isExpanded
                    ? showAllMonths
                      ? yearGroup.months
                      : yearGroup.months.slice(0, RECENT_MONTHS_DEFAULT)
                    : [];
                  const hasMoreMonths =
                    yearGroup.months.length > RECENT_MONTHS_DEFAULT;

                  return (
                    <div
                      key={yearGroup.year}
                      className="rounded-lg border border-border"
                    >
                      <button
                        type="button"
                        onClick={() => toggleYear(yearGroup.year)}
                        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                      >
                        <span className="flex items-baseline gap-2">
                          <span className="font-medium">{yearGroup.year}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatPaymentsCount(yearGroup.count, t)}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums font-medium">
                            {formatCurrency(yearGroup.total, currency)}
                          </span>
                          <ChevronDown
                            className={cn(
                              "size-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="flex flex-col divide-y divide-border border-t border-border">
                          {visibleMonths.map((monthGroup) => (
                            <MonthSection
                              key={monthGroup.month}
                              monthGroup={monthGroup}
                              language={language}
                              currency={currency}
                              closedYears={closedYears ?? []}
                              isExpanded={expandedMonth === monthGroup.month}
                              onToggle={() =>
                                setExpandedMonth((current) =>
                                  current === monthGroup.month
                                    ? null
                                    : monthGroup.month,
                                )
                              }
                              editingId={editingId}
                              onEdit={setEditingId}
                              onDelete={(entry) => undoableDelete.remove(entry)}
                              updateIncome={updateIncome}
                              onSaveEdit={() => setEditingId(null)}
                            />
                          ))}
                          {hasMoreMonths && (
                            <button
                              type="button"
                              className="flex w-full items-center justify-center gap-1.5 bg-muted px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted/70"
                              onClick={() => setShowAllMonths((v) => !v)}
                            >
                              {showAllMonths
                                ? t("income.showLastThreeMonths")
                                : t("income.showAllMonths", {
                                    count: String(yearGroup.months.length),
                                  })}
                              <ChevronDown
                                className={cn(
                                  "size-4 transition-transform",
                                  showAllMonths && "rotate-180",
                                )}
                              />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </CollapsibleSectionCard>
    {undoableDelete.pendingItem && (
      <UndoBanner
        message={t("income.deletedMessage")}
        onUndo={undoableDelete.undo}
      />
    )}
    </>
  );
}

interface MonthSectionProps {
  monthGroup: MonthGroup;
  language: "en" | "es";
  currency: "USD" | "COP";
  closedYears: ClosedYear[];
  isExpanded: boolean;
  onToggle: () => void;
  editingId: string | null;
  onEdit: (incomeId: string) => void;
  onDelete: (entry: Income) => void;
  updateIncome: ReturnType<typeof useUpdateIncome>;
  onSaveEdit: () => void;
}

// A month with exactly one payment renders as a plain row (nothing to
// collapse); a month with more than one collapses into a single summary
// line — "(N payments)" — that expands on tap to reveal each entry with
// its own edit/delete, same as a single-payment row (issue #11).
function MonthSection({
  monthGroup,
  language,
  currency,
  closedYears,
  isExpanded,
  onToggle,
  editingId,
  onEdit,
  onDelete,
  updateIncome,
  onSaveEdit,
}: MonthSectionProps) {
  const { t } = useTranslation();

  if (monthGroup.entries.length === 1) {
    return (
      <IncomeEntryRow
        entry={monthGroup.entries[0]}
        currency={currency}
        closedYears={closedYears}
        isEditing={editingId === monthGroup.entries[0].incomeId}
        onEdit={onEdit}
        onDelete={onDelete}
        updateIncome={updateIncome}
        onSaveEdit={onSaveEdit}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="font-medium">
          {formatMonthLabel(monthGroup.month, language)}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatPaymentsCount(monthGroup.entries.length, t)}
          </span>
          <span className="tabular-nums font-medium">
            {formatCurrency(monthGroup.total, currency)}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </span>
      </button>
      {isExpanded && (
        <div className="flex flex-col divide-y divide-border border-t border-border bg-muted/30">
          {monthGroup.entries.map((entry) => (
            <IncomeEntryRow
              key={entry.incomeId}
              entry={entry}
              currency={currency}
              closedYears={closedYears}
              isEditing={editingId === entry.incomeId}
              onEdit={onEdit}
              onDelete={onDelete}
              updateIncome={updateIncome}
              onSaveEdit={onSaveEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface IncomeEntryRowProps {
  entry: Income;
  currency: "USD" | "COP";
  closedYears: ClosedYear[];
  isEditing: boolean;
  onEdit: (incomeId: string) => void;
  onDelete: (entry: Income) => void;
  updateIncome: ReturnType<typeof useUpdateIncome>;
  onSaveEdit: () => void;
}

function IncomeEntryRow({
  entry,
  currency,
  closedYears,
  isEditing,
  onEdit,
  onDelete,
  updateIncome,
  onSaveEdit,
}: IncomeEntryRowProps) {
  const { t } = useTranslation();

  if (isEditing) {
    return (
      <div className="px-4 py-3">
        <IncomeEditForm
          income={entry}
          isSubmitting={updateIncome.isPending}
          onSubmit={(input) => {
            updateIncome.mutate(
              { ...entry, ...input },
              { onSuccess: onSaveEdit },
            );
          }}
          onCancel={onSaveEdit}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{entry.date}</span>
        {entry.notes && (
          <span className="text-sm text-muted-foreground">{entry.notes}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="tabular-nums font-medium">
          {formatCurrency(entry.amount, currency)}
        </span>
        {isYearClosed(closedYears, entry.date) ? (
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
              <DropdownMenuItem onSelect={() => onEdit(entry.incomeId)}>
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(entry)}
              >
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
