import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDisplayCase } from "@/lib/text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProperties } from "../properties/hooks";
import { useCreateExpenseWithReceipt } from "./hooks";
import { extractGuessesFromText, recognizeReceiptText } from "./ocr";
import { ReceiptCaptureInput } from "./ReceiptCaptureInput";
import { expenseInputSchema } from "./schema";
import { STARTER_CATEGORIES, type Category } from "../../types";

interface ExpenseFormProps {
  initialPropertyId?: string;
  onSaved: (propertyId: string, expenseId: string) => void;
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
      if (guess.vendor) setVendor(toDisplayCase(guess.vendor));
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
        onSuccess: (expense) => onSaved(expense.propertyId, expense.expenseId),
        onError: (err) =>
          setFormError(
            err instanceof Error ? err.message : "Failed to save expense",
          ),
      },
    );
  }

  const isBusy = isRunningOcr || createExpense.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-property">Property</Label>
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger id="expense-property" className="w-full">
            <SelectValue placeholder="Select a property…" />
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
            alt="Receipt preview"
            className="max-h-48 rounded-lg border border-border object-contain"
          />
        )}
        {isRunningOcr && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Reading receipt…
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-vendor">Vendor</Label>
        <Input
          id="expense-vendor"
          value={vendor}
          onChange={(event) => setVendor(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-amount">Amount</Label>
        <Input
          id="expense-amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-date">Date</Label>
        <Input
          id="expense-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-category">Category</Label>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as Category)}
        >
          <SelectTrigger id="expense-category" className="w-full">
            <SelectValue placeholder="Select a category…" />
          </SelectTrigger>
          <SelectContent>
            {STARTER_CATEGORIES.map((starterCategory) => (
              <SelectItem key={starterCategory} value={starterCategory}>
                {starterCategory}
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
        {createExpense.isPending ? "Logging…" : "Log expense"}
      </Button>
    </form>
  );
}
