import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "../../i18n/useTranslation";
import { useAllExpenses } from "../expenses/hooks";
import { useAllIncome } from "../income/hooks";
import { useCloseYear, useClosedYears } from "./hooks";

// Portfolio-wide (every property/unit), unlike SummarySection's own
// per-property year list — but the same year-extraction logic (earliest
// activity year through the current year).
export function ClosedYearsSection() {
  const { t } = useTranslation();
  const { data: income } = useAllIncome();
  const { data: expenses } = useAllExpenses();
  const { data: closedYears, isPending, isError, error } = useClosedYears();
  const closeYear = useCloseYear();
  const [confirmingYear, setConfirmingYear] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const datesYears = [...(income ?? []), ...(expenses ?? [])]
      .map((entry) => Number(entry.date?.slice(0, 4)))
      .filter((y) => Number.isFinite(y));
    const min = Math.min(currentYear, ...datesYears);
    const list: number[] = [];
    for (let y = currentYear; y >= min; y--) {
      list.push(y);
    }
    return list;
  }, [income, expenses, currentYear]);

  const closedYearSet = new Set((closedYears ?? []).map((cy) => cy.year));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("settings.closedYearsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t("settings.closedYearsDescription")}
        </p>

        {isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {error instanceof Error ? error.message : t("common.loading")}
            </AlertDescription>
          </Alert>
        )}

        {isPending ? (
          <p className="text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border">
            {years.map((year) => {
              const isClosed = closedYearSet.has(year);
              return (
                <div
                  key={year}
                  className="flex flex-col gap-2 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{year}</span>
                    {isClosed && (
                      <Badge variant="secondary">{t("common.closed")}</Badge>
                    )}
                  </div>
                  {!isClosed &&
                    (confirmingYear === year ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">
                          {t("settings.closeYearConfirm", {
                            year: String(year),
                          })}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={closeYear.isPending}
                            onClick={() =>
                              closeYear.mutate(year, {
                                onSuccess: () => setConfirmingYear(null),
                              })
                            }
                          >
                            {closeYear.isPending
                              ? t("settings.closingButton")
                              : t("settings.closeYearConfirmButton", {
                                  year: String(year),
                                })}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={closeYear.isPending}
                            onClick={() => setConfirmingYear(null)}
                          >
                            {t("common.cancel")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="self-start"
                        onClick={() => setConfirmingYear(year)}
                      >
                        {t("settings.closeYearButton", { year: String(year) })}
                      </Button>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
