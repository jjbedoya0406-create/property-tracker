import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "../../i18n/useTranslation";
import { createAddUnitInputSchema } from "./schema";

interface AddUnitFormProps {
  isSubmitting: boolean;
  onSubmit: (input: { unitName: string }) => void;
  onCancel: () => void;
}

// Adds a 3rd+ unit to a building that already exists (the Building tab's
// own "Add unit" action) — no building name to ask for, unlike
// PromotePropertyForm.
export function AddUnitForm({
  isSubmitting,
  onSubmit,
  onCancel,
}: AddUnitFormProps) {
  const { t } = useTranslation();
  const [unitName, setUnitName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createAddUnitInputSchema(t).safeParse({ unitName });
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
        <Label htmlFor="add-unit-name">{t("buildings.unitNameLabel")}</Label>
        <Input
          id="add-unit-name"
          value={unitName}
          onChange={(event) => setUnitName(event.target.value)}
          placeholder={t("buildings.unitNamePlaceholder")}
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
            ? t("buildings.promoteSavingButton")
            : t("buildings.promoteSaveButton")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
