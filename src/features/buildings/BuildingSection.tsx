import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import type { Building } from "../../types";
import { useBuildingExpenses } from "../expenses/hooks";
import { useIncomeForProperties } from "../income/hooks";
import { AddUnitForm } from "./AddUnitForm";
import { useAddUnitToBuilding } from "./hooks";

interface BuildingSectionProps {
  building: Building;
  unitPropertyIds: string[];
}

// The "Building" tab (issue #7): building-level shared bills, kept
// separate from any unit's own income/expenses — never prorated or
// allocated across units (Requirement 4). "Units income" is a rollup
// shown for context only (Requirement 6), not merged into the building's
// own totals.
export function BuildingSection({
  building,
  unitPropertyIds,
}: BuildingSectionProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const {
    data: expenses,
    isPending,
    isError,
    error,
  } = useBuildingExpenses(building.buildingId);
  const { data: income } = useIncomeForProperties(unitPropertyIds);
  const addUnit = useAddUnitToBuilding();
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);

  const buildingCosts = useMemo(
    () => (expenses ?? []).reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );
  const unitsIncome = useMemo(
    () => (income ?? []).reduce((sum, entry) => sum + entry.amount, 0),
    [income],
  );
  const sortedExpenses = useMemo(
    () => [...(expenses ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("buildings.buildingCosts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular-nums text-xl font-medium">
              {formatCurrency(buildingCosts, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("buildings.unitsIncome")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular-nums text-xl font-medium">
              {formatCurrency(unitsIncome, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg">
            {t("buildings.sharedBillsTitle")}
          </CardTitle>
          <Button asChild size="sm">
            <Link to={`/capture?buildingId=${building.buildingId}`}>
              {t("expenses.logButton")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isPending && (
            <p className="text-muted-foreground">{t("expenses.loading")}</p>
          )}
          {isError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : t("expenses.loadError")}
              </AlertDescription>
            </Alert>
          )}
          {!isPending && !isError && sortedExpenses.length === 0 && (
            <p className="text-muted-foreground">
              {t("buildings.noSharedBillsYet")}
            </p>
          )}
          {!isPending && !isError && sortedExpenses.length > 0 && (
            <div className="divide-y divide-border rounded-lg border">
              {sortedExpenses.map((expense) => (
                <div
                  key={expense.expenseId}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                      {expense.date}
                    </span>
                    {expense.notes && (
                      <span className="text-sm text-muted-foreground">
                        {expense.notes}
                      </span>
                    )}
                  </div>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(expense.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddUnitForm ? (
        <Card>
          <CardContent>
            <AddUnitForm
              isSubmitting={addUnit.isPending}
              onSubmit={(input) => {
                addUnit.mutate(
                  { building, unitName: input.unitName },
                  { onSuccess: () => setShowAddUnitForm(false) },
                );
              }}
              onCancel={() => setShowAddUnitForm(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setShowAddUnitForm(true)}
        >
          {t("buildings.addUnitButton")}
        </Button>
      )}
    </div>
  );
}
