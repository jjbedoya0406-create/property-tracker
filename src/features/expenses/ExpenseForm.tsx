import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseCurrencyAmount } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isYearClosed } from "@/lib/closedYears";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import { useBuildings } from "../buildings/hooks";
import { useCategories } from "../categories/hooks";
import { useClosedYears } from "../closedYears/hooks";
import { useProperties } from "../properties/hooks";
import { useCreateExpenseWithReceipt } from "./hooks";
import { normalizeImageForOcr } from "./imagePreprocessing";
import { extractGuessesFromText, recognizeReceiptText } from "./ocr";
import { ReceiptCaptureInput } from "./ReceiptCaptureInput";
import {
  createExpenseEditInputSchema,
  createExpenseInputSchema,
} from "./schema";

export type ExpenseSaveTarget =
  | { propertyId: string }
  | { buildingId: string };

interface ExpenseFormProps {
  initialPropertyId?: string;
  // Arriving from a building's "Log expense" link (either the old
  // inline overview or the pinned action on Building Info, issue #14) —
  // this is unambiguously a building-level expense from the start, so
  // there's no property to pick and no unit/building choice to make
  // (see the isBuildingOnly branch below).
  initialBuildingId?: string;
  onSaved: (target: ExpenseSaveTarget, expenseId: string) => void;
}

export function ExpenseForm({
  initialPropertyId,
  initialBuildingId,
  onSaved,
}: ExpenseFormProps) {
  const { t } = useTranslation();
  const { language, currency } = useSettings();
  const { data: properties } = useProperties();
  const { data: buildings } = useBuildings();
  const { data: categories } = useCategories();
  const { data: closedYears } = useClosedYears();
  const createExpense = useCreateExpenseWithReceipt();

  const isBuildingOnly = Boolean(initialBuildingId);
  const targetBuilding = initialBuildingId
    ? buildings?.find((b) => b.buildingId === initialBuildingId)
    : undefined;

  const [propertyId, setPropertyId] = useState(initialPropertyId ?? "");
  const [scope, setScope] = useState<"unit" | "building">("unit");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
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

  // The scope step only appears once the selected unit belongs to an
  // actual multi-unit building (2+ siblings) — a standalone property sees
  // no scope step at all, same "single-unit collapse" rule as the detail
  // page's tab bar (issue #7, Requirement 8).
  const selectedProperty = (properties ?? []).find(
    (p) => p.propertyId === propertyId,
  );
  const siblings = selectedProperty?.buildingId
    ? (properties ?? []).filter(
        (p) => p.buildingId === selectedProperty.buildingId,
      )
    : [];
  const isMultiUnit = siblings.length >= 2;
  const building = isMultiUnit
    ? buildings?.find((b) => b.buildingId === selectedProperty?.buildingId)
    : undefined;

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

    if (isBuildingOnly) {
      const result = createExpenseEditInputSchema(t).safeParse({
        amount: parseCurrencyAmount(amount, currency),
        date,
        categoryId,
        notes,
      });
      if (!result.success) {
        setFormError(
          result.error.issues[0]?.message ?? t("validation.invalidInput"),
        );
        return;
      }
      if (isYearClosed(closedYears ?? [], result.data.date)) {
        setFormError(
          t("errors.yearClosed", { year: result.data.date.slice(0, 4) }),
        );
        return;
      }
      if (!targetBuilding) {
        setFormError(t("errors.saveExpenseFailed"));
        return;
      }
      setFormError(null);
      createExpense.mutate(
        { ...result.data, target: { scope: "building", building: targetBuilding }, photo },
        {
          onSuccess: (expense) =>
            onSaved({ buildingId: targetBuilding.buildingId }, expense.expenseId),
          onError: (err) =>
            setFormError(
              err instanceof Error ? err.message : t("errors.saveExpenseFailed"),
            ),
        },
      );
      return;
    }

    const result = createExpenseInputSchema(t).safeParse({
      propertyId,
      amount: parseCurrencyAmount(amount, currency),
      date,
      categoryId,
      notes,
    });
    if (!result.success) {
      setFormError(
        result.error.issues[0]?.message ?? t("validation.invalidInput"),
      );
      return;
    }
    if (isYearClosed(closedYears ?? [], result.data.date)) {
      setFormError(
        t("errors.yearClosed", { year: result.data.date.slice(0, 4) }),
      );
      return;
    }
    const property = (properties ?? []).find(
      (p) => p.propertyId === result.data.propertyId,
    );
    if (!property) {
      setFormError(t("validation.selectProperty"));
      return;
    }
    if (isMultiUnit && scope === "building" && !building) {
      setFormError(t("errors.saveExpenseFailed"));
      return;
    }
    setFormError(null);
    const { propertyId: _propertyId, ...rest } = result.data;
    const target =
      isMultiUnit && scope === "building" && building
        ? ({ scope: "building", building } as const)
        : ({ scope: "unit", property } as const);
    createExpense.mutate(
      { ...rest, target, photo },
      {
        onSuccess: (expense) =>
          onSaved({ propertyId: property.propertyId }, expense.expenseId),
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
      {isBuildingOnly ? (
        // Arrived via a building's own "Log expense" link — this is
        // already unambiguous, so there's nothing to pick: no property
        // dropdown showing an arbitrary unit, no unit/building toggle.
        // Just a clear, non-interactive confirmation of what it's for.
        <div className="flex flex-col gap-1.5">
          <Label>{t("expenseForm.buildingLabel")}</Label>
          <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm font-medium">
            {targetBuilding?.name ?? t("common.loading")}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-property">
              {t("expenseForm.propertyLabel")}
            </Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger id="expense-property" className="w-full">
                <SelectValue
                  placeholder={t("expenseForm.propertyPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {activeProperties.map((property) => (
                  <SelectItem
                    key={property.propertyId}
                    value={property.propertyId}
                  >
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Only for a unit that actually belongs to a multi-unit
              building — a standalone property never shows this (issue
              #7, Requirement 8's "single-unit collapse" applied to
              capture too). */}
          {isMultiUnit && (
            <div className="flex flex-col gap-1.5">
              <Label>{t("expenseForm.scopeLabel")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope("unit")}
                  className={cn(
                    "rounded-lg border p-3 text-left text-sm font-medium",
                    scope === "unit"
                      ? "border-primary bg-primary/5"
                      : "border-border",
                  )}
                >
                  {t("expenseForm.scopeUnit")}
                </button>
                <button
                  type="button"
                  onClick={() => setScope("building")}
                  className={cn(
                    "rounded-lg border p-3 text-left text-sm font-medium",
                    scope === "building"
                      ? "border-primary bg-primary/5"
                      : "border-border",
                  )}
                >
                  {t("expenseForm.scopeBuilding")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-notes">{t("expenseForm.notesLabel")}</Label>
        <Textarea
          id="expense-notes"
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

      <Button type="submit" className="w-full" disabled={isBusy}>
        {createExpense.isPending
          ? t("expenseForm.loggingButton")
          : t("expenseForm.logButton")}
      </Button>
    </form>
  );
}
