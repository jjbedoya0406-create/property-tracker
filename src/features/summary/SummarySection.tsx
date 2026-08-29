import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import { useIncome } from "../income/hooks";
import { useExpenses } from "../expenses/hooks";

interface SummarySectionProps {
  propertyId: string;
}

export function SummarySection({ propertyId }: SummarySectionProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const { data: income } = useIncome(propertyId);
  const { data: expenses } = useExpenses(propertyId);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

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
    const prefix = String(year);
    return (date: string) => date.startsWith(prefix);
  }, [year]);

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
