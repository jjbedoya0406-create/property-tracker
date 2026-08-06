import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "../../i18n/useTranslation";
import { createCategoryInputSchema, type CategoryInput } from "./schema";

interface CategoryFormProps {
  initialValues?: CategoryInput;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (input: CategoryInput) => void;
  onCancel?: () => void;
}

export function CategoryForm({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createCategoryInputSchema(t).safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t("validation.invalidInput"));
      return;
    }
    setError(null);
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">{t("categoryForm.nameLabel")}</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
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
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
