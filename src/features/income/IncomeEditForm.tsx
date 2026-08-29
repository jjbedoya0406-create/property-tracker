import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseCurrencyAmount } from "@/lib/currency";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import type { Income } from "../../types";
import { createIncomeInputSchema, type IncomeInput } from "./schema";

interface IncomeEditFormProps {
  income: Income;
  isSubmitting?: boolean;
  onSubmit: (input: IncomeInput) => void;
  onCancel: () => void;
}

export function IncomeEditForm({
  income,
  isSubmitting,
  onSubmit,
  onCancel,
}: IncomeEditFormProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const [amount, setAmount] = useState(String(income.amount));
  const [date, setDate] = useState(income.date);
  const [notes, setNotes] = useState(income.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createIncomeInputSchema(t).safeParse({
      amount: parseCurrencyAmount(amount, currency),
      date,
      notes,
    });
    if (!result.success) {
      setError(
        result.error.issues[0]?.message ?? t("validation.invalidInput"),
      );
      return;
    }
    setError(null);
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`income-edit-amount-${income.incomeId}`}>
          {t("incomeForm.amountLabel")}
        </Label>
        {currency === "COP" ? (
          <Input
            id={`income-edit-amount-${income.incomeId}`}
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        ) : (
          <Input
            id={`income-edit-amount-${income.incomeId}`}
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`income-edit-date-${income.incomeId}`}>
          {t("incomeForm.dateLabel")}
        </Label>
        <Input
          id={`income-edit-date-${income.incomeId}`}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`income-edit-notes-${income.incomeId}`}>
          {t("incomeForm.notesLabel")}
        </Label>
        <Textarea
          id={`income-edit-notes-${income.incomeId}`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {t("common.saveChanges")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
