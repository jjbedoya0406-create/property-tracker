import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "../../i18n/useTranslation";

interface RenameBuildingFormProps {
  initialName: string;
  isSubmitting?: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function RenameBuildingForm({
  initialName,
  isSubmitting,
  onSubmit,
  onCancel,
}: RenameBuildingFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("validation.buildingNameRequired"));
      return;
    }
    setError(null);
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="building-name">
          {t("buildings.buildingNameLabel")}
        </Label>
        <Input
          id="building-name"
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
