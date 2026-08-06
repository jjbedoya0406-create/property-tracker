import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCurrencyAmount } from "@/lib/currency";
import { toDisplayCase } from "@/lib/text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import { useCategories } from "../categories/hooks";
import { useProperties } from "../properties/hooks";
import { useCreateExpenseWithReceipt } from "./hooks";
import { normalizeImageForOcr } from "./imagePreprocessing";
import { extractGuessesFromText, recognizeReceiptText } from "./ocr";
import { ReceiptCaptureInput } from "./ReceiptCaptureInput";
import { createExpenseInputSchema } from "./schema";

interface ExpenseFormProps {
  initialPropertyId?: string;
  onSaved: (propertyId: string, expenseId: string) => void;
}

export function ExpenseForm({ initialPropertyId, onSaved }: ExpenseFormProps) {
  const { t } = useTranslation();
  const { language, currency } = useSettings();
  const { data: properties } = useProperties();
  const { data: categories } = useCategories();
  const createExpense = useCreateExpenseWithReceipt();

  const [propertyId, setPropertyId] = useState(initialPropertyId ?? "");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Revoke the object URL when replaced/unmounted to avoid leaking memory.
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const activeProperties = (properties ?? []).filter(
    (property) => property.status === "active",
  );
  // Archived categories stop appearing as options for new expenses (Story
  // 1.6), though past expenses keep referencing them by ID unaffected.
  const activeCategories = (categories ?? []).filter(
    (category) => category.status === "active",
  );

  async function handleCapture(file: File) {
    setIsRunningOcr(true);

    // Phone photos carry EXIF rotation + very high resolution, which can
    // make Tesseract read a sideways image and produce garbage text even
    // though the preview (which respects EXIF) looks correctly oriented.
    // Normalize once and reuse the same image for preview, OCR, and the
    // eventual Drive upload. Fall back to the raw file if this fails for
    // any reason — capture should never dead-end on a preprocessing bug.
    let normalized: Blob = file;
    try {
      normalized = await normalizeImageForOcr(file);
    } catch {
      // Fall through with the raw file.
    }
    setPhoto(normalized);
    setPhotoPreviewUrl(URL.createObjectURL(normalized));

    try {
      const text = await recognizeReceiptText(normalized, language);
      const guess = extractGuessesFromText(text, currency);
      if (guess.vendor) setVendor(toDisplayCase(guess.vendor));
      if (guess.amount !== undefined) {
        // Prefill in the same format the user would type themselves —
        // period-grouped whole pesos for COP, plain decimal for USD.
        setAmount(
          currency === "COP"
            ? Math.round(guess.amount).toLocaleString("es-CO")
            : String(guess.amount),
        );
      }
      if (guess.date) setDate(guess.date);
    } catch {
      // Best-effort only — a failed OCR read never blocks manual entry.
    } finally {
      setIsRunningOcr(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createExpenseInputSchema(t).safeParse({
      propertyId,
      vendor,
      amount: parseCurrencyAmount(amount, currency),
      date,
      categoryId,
    });
    if (!result.success) {
      setFormError(
        result.error.issues[0]?.message ?? t("validation.invalidInput"),
      );
      return;
    }
    setFormError(null);
    createExpense.mutate(
      { ...result.data, photo },
      {
        onSuccess: (expense) => onSaved(expense.propertyId, expense.expenseId),
        onError: (err) =>
          setFormError(
            err instanceof Error ? err.message : t("errors.saveExpenseFailed"),
          ),
      },
    );
  }

  const isBusy = isRunningOcr || createExpense.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-property">
          {t("expenseForm.propertyLabel")}
        </Label>
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger id="expense-property" className="w-full">
            <SelectValue placeholder={t("expenseForm.propertyPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {activeProperties.map((property) => (
              <SelectItem key={property.propertyId} value={property.propertyId}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <ReceiptCaptureInput onCapture={handleCapture} disabled={isBusy} />
        {photoPreviewUrl && (
          <img
            src={photoPreviewUrl}
            alt={t("expenseForm.receiptPreviewAlt")}
            className="max-h-48 rounded-lg border border-border object-contain"
          />
        )}
        {isRunningOcr && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("expenseForm.readingReceipt")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-vendor">{t("expenseForm.vendorLabel")}</Label>
        <Input
          id="expense-vendor"
          value={vendor}
          onChange={(event) => setVendor(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-amount">{t("expenseForm.amountLabel")}</Label>
        {currency === "COP" ? (
          // Plain text input for COP — a native number input always
          // canonicalizes its value with "." as the decimal separator
          // regardless of locale, which would fight against typing
          // period-grouped whole pesos (e.g. "430.000").
          <Input
            id="expense-amount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        ) : (
          <Input
            id="expense-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-date">{t("expenseForm.dateLabel")}</Label>
        <Input
          id="expense-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-category">
          {t("expenseForm.categoryLabel")}
        </Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="expense-category" className="w-full">
            <SelectValue placeholder={t("expenseForm.categoryPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {activeCategories.map((cat) => (
              <SelectItem key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isBusy}>
        {createExpense.isPending
          ? t("expenseForm.loggingButton")
          : t("expenseForm.logButton")}
      </Button>
    </form>
  );
}
