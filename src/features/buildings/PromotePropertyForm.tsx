import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "../../i18n/useTranslation";
import { createPromotePropertyInputSchema } from "./schema";

interface PromotePropertyFormProps {
  initialBuildingName: string;
  isSubmitting: boolean;
  onSubmit: (input: { buildingName: string; newUnitName: string }) => void;
  onCancel: () => void;
}

// Shown once, the first time a standalone property grows a second unit —
// turns it into the first two units of a new Building (issue #7).
export function PromotePropertyForm({
  initialBuildingName,
  isSubmitting,
  onSubmit,
  onCancel,
}: PromotePropertyFormProps) {
  const { t } = useTranslation();
  const [buildingName, setBuildingName] = useState(initialBuildingName);
  const [newUnitName, setNewUnitName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createPromotePropertyInputSchema(t).safeParse({
      buildingName,
      newUnitName,
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
      <p className="text-sm text-muted-foreground">
        {t("buildings.promoteExplanation")}
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="building-name">{t("buildings.buildingNameLabel")}</Label>
        <Input
          id="building-name"
          value={buildingName}
          onChange={(event) => setBuildingName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-unit-name">{t("buildings.unitNameLabel")}</Label>
        <Input
          id="new-unit-name"
          value={newUnitName}
          onChange={(event) => setNewUnitName(event.target.value)}
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
