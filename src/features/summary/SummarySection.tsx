import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import { useIncome } from "../income/hooks";
import { useExpenses } from "../expenses/hooks";

interface SummarySectionProps {
  propertyId: string;
}

type SummaryMode = "taxYear" | "custom";

// PRD §11 open decision (Outcome 6): the income/expense summary period
// scope should support both a tax-year selector and a custom range —
// Outcome 4's own year selector was never built (see PropertyDetailPage/
// ExpensesSection — no year scoping exists there yet), so this is a
// self-contained implementation rather than a reuse of existing code.
export function SummarySection({ propertyId }: SummarySectionProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const { data: income } = useIncome(propertyId);
  const { data: expenses } = useExpenses(propertyId);

  const currentYear = new Date().getFullYear();
  const [mode, setMode] = useState<SummaryMode>("taxYear");
  const [year, setYear] = useState(currentYear);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  const inRange = useMemo(() => {
    if (mode === "taxYear") {
      const prefix = String(year);
      return (date: string) => date.startsWith(prefix);
    }
    return (date: string) =>
      (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
  }, [mode, year, fromDate, toDate]);

  const moneyIn = useMemo(
    () =>
      (income ?? [])
        .filter((entry) => inRange(entry.date))
        .reduce((sum, entry) => sum + entry.amount, 0),
    [income, inRange],
  );
  const moneyOut = useMemo(
    () =>
      (expenses ?? [])
        .filter((entry) => inRange(entry.date))
        .reduce((sum, entry) => sum + entry.amount, 0),
    [expenses, inRange],
  );
  const netTotal = moneyIn - moneyOut;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("summary.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as SummaryMode)}
        >
          <TabsList>
            <TabsTrigger value="taxYear">
              {t("summary.modeTaxYear")}
            </TabsTrigger>
            <TabsTrigger value="custom">
              {t("summary.modeCustomRange")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "taxYear" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="summary-year">{t("summary.yearLabel")}</Label>
            <Select
              value={String(year)}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger id="summary-year" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="summary-from">{t("summary.fromLabel")}</Label>
              <Input
                id="summary-from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="summary-to">{t("summary.toLabel")}</Label>
              <Input
                id="summary-to"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
          </div>
        )}

        <div className="divide-y divide-border rounded-lg border">
          <SummaryRow label={t("summary.moneyIn")} amount={moneyIn} currency={currency} />
          <SummaryRow
            label={t("summary.moneyOut")}
            amount={-moneyOut}
            currency={currency}
          />
          <SummaryRow
            label={t("summary.moneyLeftOver")}
            amount={netTotal}
            currency={currency}
            emphasize
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  amount,
  currency,
  emphasize,
}: {
  label: string;
  amount: number;
  currency: "USD" | "COP";
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <span className={cn(emphasize && "font-medium")}>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          emphasize ? "font-medium" : undefined,
          amount < 0 ? "text-destructive" : undefined,
        )}
      >
        {amount < 0 ? "-" : ""}
        {formatCurrency(Math.abs(amount), currency)}
      </span>
    </div>
  );
}
