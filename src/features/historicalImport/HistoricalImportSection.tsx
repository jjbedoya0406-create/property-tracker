import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IdentifierOverrides } from "../../data/historicalImport";
import { useTranslation } from "../../i18n/useTranslation";
import { formatCurrency } from "../../lib/currency";
import { useSettings } from "../../portfolio/context";
import { useBuildings } from "../buildings/hooks";
import { useCategories } from "../categories/hooks";
import { useProperties } from "../properties/hooks";
import { usePlanHistoricalImport, useRunHistoricalImport } from "./hooks";

export function HistoricalImportSection() {
  const { t } = useTranslation();
  const settings = useSettings();
  const properties = useProperties();
  const categories = useCategories();
  const buildings = useBuildings();
  const planImport = usePlanHistoricalImport();
  const runImport = useRunHistoricalImport();

  const [file, setFile] = useState<File | null>(null);
  const [overrides, setOverrides] = useState<IdentifierOverrides>({});
  const [hasRun, setHasRun] = useState(false);
  const [dismissedMismatches, setDismissedMismatches] = useState<Set<string>>(
    new Set(),
  );

  const plan = planImport.data;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setOverrides({});
    setHasRun(false);
    setDismissedMismatches(new Set());
  }

  function handlePreview(nextOverrides: IdentifierOverrides = overrides) {
    if (!file) return;
    setHasRun(false);
    setDismissedMismatches(new Set());
    planImport.mutate({ file, overrides: nextOverrides });
  }

  function handleResolve(
    kind: "unit" | "building" | "category",
    sourceValue: string,
    targetId: string,
  ) {
    const nextOverrides: IdentifierOverrides = {
      ...overrides,
      units: kind === "unit" ? { ...overrides.units, [sourceValue]: targetId } : overrides.units,
      categories:
        kind === "category"
          ? { ...overrides.categories, [sourceValue]: targetId }
          : overrides.categories,
      building: kind === "building" ? targetId : overrides.building,
    };
    setOverrides(nextOverrides);
    handlePreview(nextOverrides);
  }

  function handleRun() {
    if (!plan) return;
    runImport.mutate(plan, { onSuccess: () => setHasRun(true) });
  }

  const hasUnacknowledgedMismatch = plan?.reconciliation.some(
    (row) =>
      (row.incomeDelta !== 0 || row.expensesDelta !== 0) &&
      !dismissedMismatches.has(row.month),
  );
  const canRun =
    Boolean(plan) &&
    plan!.unresolved.length === 0 &&
    plan!.resolved.length > 0 &&
    !hasUnacknowledgedMismatch;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("historicalImport.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t("historicalImport.description")}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="text-sm"
          />
          <Button
            variant="outline"
            className="self-start"
            disabled={!file || planImport.isPending}
            onClick={() => handlePreview()}
          >
            {planImport.isPending
              ? t("historicalImport.previewingButton")
              : t("historicalImport.previewButton")}
          </Button>
        </div>

        {planImport.isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {planImport.error instanceof Error
                ? planImport.error.message
                : t("historicalImport.previewError")}
            </AlertDescription>
          </Alert>
        )}

        {plan && !hasRun && (
          <>
            {plan.unresolved.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">
                  {t("historicalImport.unresolvedHeading")}
                </h3>
                <div className="divide-y divide-border rounded-lg border">
                  {plan.unresolved.map((item) => (
                    <div
                      key={`${item.kind}:${item.sourceValue}`}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{item.sourceValue}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("historicalImport.unresolvedRowCount", {
                            count: String(item.rowCount),
                          })}
                        </p>
                      </div>
                      <Select
                        onValueChange={(value) =>
                          handleResolve(item.kind, item.sourceValue, value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue
                            placeholder={t("historicalImport.mapToPlaceholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {item.kind === "category" &&
                            categories.data?.map((c) => (
                              <SelectItem key={c.categoryId} value={c.categoryId}>
                                {c.name}
                              </SelectItem>
                            ))}
                          {item.kind === "unit" &&
                            properties.data?.map((p) => (
                              <SelectItem key={p.propertyId} value={p.propertyId}>
                                {p.name}
                              </SelectItem>
                            ))}
                          {item.kind === "building" &&
                            buildings.data?.map((b) => (
                              <SelectItem key={b.buildingId} value={b.buildingId}>
                                {b.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.needsReviewCount > 0 && (
              <Alert>
                <AlertTriangle />
                <AlertDescription>
                  {t("historicalImport.needsReviewNotice", {
                    count: String(plan.needsReviewCount),
                  })}
                </AlertDescription>
              </Alert>
            )}

            {plan.unresolved.length === 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">
                  {t("historicalImport.reconciliationHeading")}
                </h3>
                <div className="divide-y divide-border rounded-lg border">
                  {plan.reconciliation.map((row) => {
                    const isClean = row.incomeDelta === 0 && row.expensesDelta === 0;
                    const isDismissed = dismissedMismatches.has(row.month);
                    return (
                      <div key={row.month} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{row.month}</p>
                          {isClean || isDismissed ? (
                            <CheckCircle2 className="size-4 text-primary" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="size-4 text-destructive" />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                aria-label={t("historicalImport.dismissMismatch")}
                                onClick={() =>
                                  setDismissedMismatches(
                                    (prev) => new Set(prev).add(row.month),
                                  )
                                }
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t("historicalImport.reconciliationLine", {
                            income: formatCurrency(
                              row.computedIncome,
                              settings.currency,
                            ),
                            expenses: formatCurrency(
                              row.computedExpenses,
                              settings.currency,
                            ),
                          })}
                        </p>
                        {!isClean && !isDismissed && (
                          <p className="text-sm text-destructive">
                            {t("historicalImport.reconciliationMismatch")}
                          </p>
                        )}
                        {!isClean && isDismissed && (
                          <p className="text-sm text-muted-foreground">
                            {t("historicalImport.reconciliationDismissed")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {canRun && (
              <Button
                className="self-start"
                disabled={runImport.isPending}
                onClick={handleRun}
              >
                {runImport.isPending
                  ? t("historicalImport.runningButton")
                  : t("historicalImport.runButton")}
              </Button>
            )}
          </>
        )}

        {runImport.isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {runImport.error instanceof Error
                ? runImport.error.message
                : t("historicalImport.runError")}
            </AlertDescription>
          </Alert>
        )}

        {hasRun && (
          <Alert>
            <CheckCircle2 />
            <AlertDescription>{t("historicalImport.runSuccess")}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
