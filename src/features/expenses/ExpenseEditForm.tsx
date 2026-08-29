import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseCurrencyAmount } from "@/lib/currency";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import type { Category, Expense } from "../../types";
import { createExpenseEditInputSchema, type ExpenseEditInput } from "./schema";

interface ExpenseEditFormProps {
  expense: Expense;
  // Unfiltered (may include an archived category) — the expense's current
  // category must stay selectable even if it's since been archived,
  // matching how ExpensesSection already resolves category names.
  categories: Category[];
  isSubmitting?: boolean;
  onSubmit: (input: ExpenseEditInput) => void;
  onCancel: () => void;
}

export function ExpenseEditForm({
  expense,
  categories,
  isSubmitting,
  onSubmit,
  onCancel,
}: ExpenseEditFormProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const [amount, setAmount] = useState(String(expense.amount));
  const [date, setDate] = useState(expense.date);
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [notes, setNotes] = useState(expense.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createExpenseEditInputSchema(t).safeParse({
      amount: parseCurrencyAmount(amount, currency),
      date,
      categoryId,
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
        <Label htmlFor={`expense-edit-amount-${expense.expenseId}`}>
          {t("expenseForm.amountLabel")}
        </Label>
        {currency === "COP" ? (
          <Input
            id={`expense-edit-amount-${expense.expenseId}`}
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        ) : (
          <Input
            id={`expense-edit-amount-${expense.expenseId}`}
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`expense-edit-date-${expense.expenseId}`}>
          {t("expenseForm.dateLabel")}
        </Label>
        <Input
          id={`expense-edit-date-${expense.expenseId}`}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`expense-edit-category-${expense.expenseId}`}>
          {t("expenseForm.categoryLabel")}
        </Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger
            id={`expense-edit-category-${expense.expenseId}`}
            className="w-full"
          >
            <SelectValue placeholder={t("expenseForm.categoryPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`expense-edit-notes-${expense.expenseId}`}>
          {t("expenseForm.notesLabel")}
        </Label>
        <Textarea
          id={`expense-edit-notes-${expense.expenseId}`}
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
