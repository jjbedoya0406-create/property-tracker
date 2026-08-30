import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Building2, ChevronRight, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoggedStamp } from "@/components/LoggedStamp";
import { formatCurrency } from "@/lib/currency";
import { formatMonthLabel } from "@/lib/monthLabel";
import { cn } from "@/lib/utils";
import { useTranslation } from "../i18n/useTranslation";
import { useSettings } from "../portfolio/context";
import type { Building, Currency, Expense, Income, Property, PropertyStatus } from "../types";
import { useBuildings } from "../features/buildings/hooks";
import { useAllExpenses } from "../features/expenses/hooks";
import { useAllIncome } from "../features/income/hooks";
import { groupPropertiesByBuilding } from "../features/properties/groupByBuilding";
import {
  computePortfolioTotals,
  computePropertyPreview,
  type PropertyPreview,
} from "../features/properties/portfolioSummary";
import { PropertyForm } from "../features/properties/PropertyForm";
import { useCreateProperty, useProperties } from "../features/properties/hooks";

export function PropertiesListPage() {
  const { t } = useTranslation();
  const { language, currency } = useSettings();
  const { data: properties, isPending, isError, error } = useProperties();
  const { data: buildings } = useBuildings();
  const { data: allIncome } = useAllIncome();
  const { data: allExpenses } = useAllExpenses();
  const createProperty = useCreateProperty();
  const [statusFilter, setStatusFilter] = useState<PropertyStatus>("active");
  const [showAddForm, setShowAddForm] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const portfolioTotals = useMemo(() => {
    if (!properties || !allIncome || !allExpenses) {
      return { income: 0, expenses: 0 };
    }
    const activeIds = new Set(
      properties.filter((p) => p.status === "active").map((p) => p.propertyId),
    );
    const income = allIncome.filter((entry) => activeIds.has(entry.propertyId));
    // Building-shared expenses (buildingId, no propertyId) always count —
    // buildings have no active/archived concept of their own.
    const expenses = allExpenses.filter((entry) =>
      entry.propertyId ? activeIds.has(entry.propertyId) : true,
    );
    return computePortfolioTotals(income, expenses, currentMonth);
  }, [properties, allIncome, allExpenses, currentMonth]);
  const portfolioNet = portfolioTotals.income - portfolioTotals.expenses;

  if (isPending) {
    return <p className="text-muted-foreground">{t("properties.loading")}</p>;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>
          {error instanceof Error ? error.message : t("properties.loadError")}
        </AlertDescription>
      </Alert>
    );
  }

  const filtered = properties.filter(
    (property) => property.status === statusFilter,
  );
  const hasNoPropertiesAtAll = properties.length === 0;
  const items = groupPropertiesByBuilding(filtered, buildings ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium">{t("properties.title")}</h1>
        {!hasNoPropertiesAtAll && (
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as PropertyStatus)}
          >
            <TabsList>
              <TabsTrigger value="active">{t("common.active")}</TabsTrigger>
              <TabsTrigger value="archived">{t("common.archived")}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {!hasNoPropertiesAtAll && (
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-6 text-center">
            <span className="text-sm text-muted-foreground">
              {t("properties.portfolioNetLabel", {
                month: formatMonthLabel(currentMonth, language),
              })}
            </span>
            <span
              className={cn(
                "text-3xl font-medium tabular-nums",
                portfolioNet < 0 && "text-destructive",
              )}
            >
              {portfolioNet < 0 ? "-" : "+"}
              {formatCurrency(Math.abs(portfolioNet), currency)}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("properties.portfolioIncomeExpenses", {
                income: formatCurrency(portfolioTotals.income, currency),
                expenses: formatCurrency(portfolioTotals.expenses, currency),
              })}
            </span>
          </CardContent>
        </Card>
      )}

      {hasNoPropertiesAtAll && !showAddForm && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground">
              {t("properties.emptyState")}
            </p>
            <Button variant="outline" onClick={() => setShowAddForm(true)}>
              {t("properties.addButton")}
            </Button>
          </CardContent>
        </Card>
      )}

      {!hasNoPropertiesAtAll && (
        <>
          {items.length === 0 ? (
            <p className="text-muted-foreground">
              {t("properties.noneForStatus", {
                status: t(`common.${statusFilter}`).toLowerCase(),
              })}
            </p>
          ) : (
            <Card className="gap-0 py-0">
              <CardContent className="divide-y divide-border px-0">
                {items.map((item) =>
                  item.kind === "standalone" ? (
                    <StandalonePropertyRow
                      key={item.property.propertyId}
                      property={item.property}
                      isJustCreated={item.property.propertyId === justCreatedId}
                      currency={currency}
                      preview={previewForStandalone(
                        item.property,
                        allIncome ?? [],
                        allExpenses ?? [],
                        currentMonth,
                      )}
                    />
                  ) : (
                    <BuildingListRow
                      key={item.building.buildingId}
                      building={item.building}
                      units={item.units}
                      currency={currency}
                      preview={previewForBuilding(
                        item.building,
                        item.units,
                        allIncome ?? [],
                        allExpenses ?? [],
                        currentMonth,
                      )}
                    />
                  ),
                )}
              </CardContent>
            </Card>
          )}

          {!showAddForm && (
            <Button
              variant="outline"
              className="self-start"
              onClick={() => setShowAddForm(true)}
            >
              {t("properties.addButton")}
            </Button>
          )}
        </>
      )}

      {showAddForm && (
        <Card>
          <CardContent>
            <PropertyForm
              submitLabel={t("properties.addButton")}
              isSubmitting={createProperty.isPending}
              onSubmit={(input) => {
                createProperty.mutate(input, {
                  onSuccess: (property) => {
                    setShowAddForm(false);
                    setJustCreatedId(property.propertyId);
                  },
                });
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function previewForStandalone(
  property: Property,
  allIncome: Income[],
  allExpenses: Expense[],
  month: string,
): PropertyPreview {
  const income = allIncome.filter((e) => e.propertyId === property.propertyId);
  const expenses = allExpenses.filter(
    (e) => e.propertyId === property.propertyId,
  );
  return computePropertyPreview(income, expenses, income.length > 0, month);
}

function previewForBuilding(
  building: Building,
  units: Property[],
  allIncome: Income[],
  allExpenses: Expense[],
  month: string,
): PropertyPreview {
  const unitIds = units.map((u) => u.propertyId);
  const income = allIncome.filter((e) => unitIds.includes(e.propertyId));
  const expenses = allExpenses.filter(
    (e) =>
      (e.propertyId && unitIds.includes(e.propertyId)) ||
      e.buildingId === building.buildingId,
  );
  return computePropertyPreview(income, expenses, income.length > 0, month);
}

function RowPreview({
  preview,
  currency,
}: {
  preview: PropertyPreview;
  currency: Currency;
}) {
  const { t } = useTranslation();
  if (preview.kind === "noActivity") {
    return (
      <span className="text-sm text-muted-foreground">
        {t("properties.noActivityYet")}
      </span>
    );
  }
  if (preview.kind === "expensesOnly") {
    return (
      <span className="text-sm tabular-nums text-muted-foreground">
        {formatCurrency(preview.amount, currency)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "text-sm tabular-nums",
        preview.amount < 0 ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {preview.amount < 0 ? "-" : "+"}
      {formatCurrency(Math.abs(preview.amount), currency)}
    </span>
  );
}

function StandalonePropertyRow({
  property,
  isJustCreated,
  currency,
  preview,
}: {
  property: Property;
  isJustCreated: boolean;
  currency: Currency;
  preview: PropertyPreview;
}) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/properties/${property.propertyId}`}
      className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
    >
      <span className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Home className="size-4 text-primary" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">{property.name}</span>
          <RowPreview preview={preview} currency={currency} />
        </span>
      </span>
      <div className="flex items-center gap-2">
        {isJustCreated && <LoggedStamp />}
        {property.status === "archived" && (
          <Badge variant="secondary">{t("common.archived")}</Badge>
        )}
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

// Navigates straight to the Building Info screen (issue #14) — every
// row on this list navigates on tap now, no inline expand/collapse
// anywhere (that behavior, from issue #13, is superseded).
function BuildingListRow({
  building,
  units,
  currency,
  preview,
}: {
  building: Building;
  units: Property[];
  currency: Currency;
  preview: PropertyPreview;
}) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/buildings/${building.buildingId}`}
      className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
    >
      <span className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2B3A55]/10">
          <Building2 className="size-4 text-[#2B3A55]" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">{building.name}</span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{t("properties.unitCount", { count: String(units.length) })}</span>
            <span aria-hidden="true">·</span>
            <RowPreview preview={preview} currency={currency} />
          </span>
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
