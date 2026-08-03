import { useEffect, useState, type FormEvent } from "react";
import { useProperties } from "../properties/hooks";
import { useCreateExpenseWithReceipt } from "./hooks";
import { extractGuessesFromText, recognizeReceiptText } from "./ocr";
import { ReceiptCaptureInput } from "./ReceiptCaptureInput";
import { expenseInputSchema } from "./schema";
import { STARTER_CATEGORIES, type Category } from "../../types";

interface ExpenseFormProps {
  initialPropertyId?: string;
  onSaved: (propertyId: string) => void;
}

export function ExpenseForm({ initialPropertyId, onSaved }: ExpenseFormProps) {
  const { data: properties } = useProperties();
  const createExpense = useCreateExpenseWithReceipt();

  const [propertyId, setPropertyId] = useState(initialPropertyId ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<Category | "">("");
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

  async function handleCapture(file: File) {
    setPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setIsRunningOcr(true);
    try {
      const text = await recognizeReceiptText(file);
      const guess = extractGuessesFromText(text);
      if (guess.vendor) setVendor(guess.vendor);
      if (guess.amount !== undefined) setAmount(String(guess.amount));
      if (guess.date) setDate(guess.date);
    } catch {
      // Best-effort only — a failed OCR read never blocks manual entry.
    } finally {
      setIsRunningOcr(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = expenseInputSchema.safeParse({
      propertyId,
      vendor,
      amount,
      date,
      category,
    });
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setFormError(null);
    createExpense.mutate(
      { ...result.data, photo },
      {
        onSuccess: () => onSaved(result.data.propertyId),
        onError: (err) =>
          setFormError(
            err instanceof Error ? err.message : "Failed to save expense",
          ),
      },
    );
  }

  const isBusy = isRunningOcr || createExpense.isPending;

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="expense-property">Property</label>
        <select
          id="expense-property"
          value={propertyId}
          onChange={(event) => setPropertyId(event.target.value)}
        >
          <option value="">Select a property…</option>
          {activeProperties.map((property) => (
            <option key={property.propertyId} value={property.propertyId}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <ReceiptCaptureInput onCapture={handleCapture} disabled={isBusy} />
        {photoPreviewUrl && (
          <p>
            <img src={photoPreviewUrl} alt="Receipt preview" width={200} />
          </p>
        )}
        {isRunningOcr && <p>Reading receipt…</p>}
      </div>

      <div>
        <label htmlFor="expense-vendor">Vendor</label>
        <input
          id="expense-vendor"
          value={vendor}
          onChange={(event) => setVendor(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="expense-amount">Amount</label>
        <input
          id="expense-amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="expense-date">Date</label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="expense-category">Category</label>
        <select
          id="expense-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as Category)}
        >
          <option value="">Select a category…</option>
          {STARTER_CATEGORIES.map((starterCategory) => (
            <option key={starterCategory} value={starterCategory}>
              {starterCategory}
            </option>
          ))}
        </select>
      </div>

      {formError && <p role="alert">{formError}</p>}

      <button type="submit" disabled={isBusy}>
        {createExpense.isPending ? "Saving…" : "Save expense"}
      </button>
    </form>
  );
}
