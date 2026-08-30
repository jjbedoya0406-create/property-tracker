import { useMemo, useState } from "react";
import { CollapsibleSectionCard } from "@/components/CollapsibleSectionCard";
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
import {
  useScopedExpenses,
  useScopedIncome,
  type FinancialScope,
} from "../properties/financialScope";

interface SummarySectionProps {
  scope: FinancialScope;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function SummarySection({
  scope,
  isExpanded,
  onToggleExpanded,
}: SummarySectionProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const { data: income } = useScopedIncome(scope);
  const { data: expenses } = useScopedExpenses(scope);

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

  const totalIncome = useMemo(
    () =>
      (income ?? [])
        .filter((entry) => inRange(entry.date))
        .reduce((sum, entry) => sum + entry.amount, 0),
    [income, inRange],
  );
  const totalExpenses = useMemo(
    () =>
      (expenses ?? [])
        .filter((entry) => inRange(entry.date))
        .reduce((sum, entry) => sum + entry.amount, 0),
    [expenses, inRange],
  );

  const hint = `${year}: ${t("summary.income")} ${formatCurrency(totalIncome, currency)} · ${t("summary.expenses")} ${formatCurrency(totalExpenses, currency)}`;

  return (
    <CollapsibleSectionCard
      title={t("summary.title")}
      hint={hint}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
    >
      <div className="flex flex-col gap-4">
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
          <SummaryRow
            label={t("summary.income")}
            amount={totalIncome}
            currency={currency}
          />
          <SummaryRow
            label={t("summary.expenses")}
            amount={-totalExpenses}
            currency={currency}
          />
        </div>
      </div>
    </CollapsibleSectionCard>
  );
}

function SummaryRow({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: number;
  currency: "USD" | "COP";
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          amount < 0 ? "text-destructive" : undefined,
        )}
      >
        {amount < 0 ? "-" : ""}
        {formatCurrency(Math.abs(amount), currency)}
      </span>
    </div>
  );
}
