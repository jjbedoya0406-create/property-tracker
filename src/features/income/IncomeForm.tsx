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
import { createIncomeInputSchema } from "./schema";

interface IncomeFormProps {
  isSubmitting: boolean;
  onSubmit: (input: { amount: number; date: string; notes?: string }) => void;
  onCancel: () => void;
}

export function IncomeForm({
  isSubmitting,
  onSubmit,
  onCancel,
}: IncomeFormProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createIncomeInputSchema(t).safeParse({
      amount: parseCurrencyAmount(amount, currency),
      date,
      notes,
    });
    if (!result.success) {
      setFormError(
        result.error.issues[0]?.message ?? t("validation.invalidInput"),
      );
      return;
    }
    setFormError(null);
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="income-amount">{t("incomeForm.amountLabel")}</Label>
        {currency === "COP" ? (
          <Input
            id="income-amount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        ) : (
          <Input
            id="income-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="income-date">{t("incomeForm.dateLabel")}</Label>
        <Input
          id="income-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="income-notes">{t("incomeForm.notesLabel")}</Label>
        <Textarea
          id="income-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("incomeForm.loggingButton")
            : t("incomeForm.logButton")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
