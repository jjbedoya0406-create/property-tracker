import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "../../i18n/useTranslation";
import { createPropertyInputSchema, type PropertyInput } from "./schema";

interface PropertyFormProps {
  initialValues?: PropertyInput;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (input: PropertyInput) => void;
  onCancel?: () => void;
}

export function PropertyForm({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: PropertyFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createPropertyInputSchema(t).safeParse({ name, address });
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
        <Label htmlFor="property-name">{t("propertyForm.nameLabel")}</Label>
        <Input
          id="property-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="property-address">
          {t("propertyForm.addressLabel")}
        </Label>
        <Input
          id="property-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
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
