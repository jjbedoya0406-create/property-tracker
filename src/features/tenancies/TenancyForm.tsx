import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCurrencyAmount } from "@/lib/currency";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import { createTenancyInputSchema } from "./schema";

interface TenancyFormProps {
  isSubmitting: boolean;
  onSubmit: (input: {
    contractStart: string;
    expectedEndDate?: string;
    rentRate: number;
  }) => void;
  onCancel: () => void;
}

export function TenancyForm({
  isSubmitting,
  onSubmit,
  onCancel,
}: TenancyFormProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const [contractStart, setContractStart] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [rentRate, setRentRate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createTenancyInputSchema(t).safeParse({
      contractStart,
      expectedEndDate,
      rentRate: parseCurrencyAmount(rentRate, currency),
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tenancy-start">
          {t("tenancyForm.contractStartLabel")}
        </Label>
        <Input
          id="tenancy-start"
          type="date"
          value={contractStart}
          onChange={(event) => setContractStart(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tenancy-expected-end">
          {t("tenancyForm.expectedEndLabel")}
        </Label>
        <Input
          id="tenancy-expected-end"
          type="date"
          value={expectedEndDate}
          onChange={(event) => setExpectedEndDate(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tenancy-rent-rate">
          {t("tenancyForm.rentRateLabel")}
        </Label>
        {currency === "COP" ? (
          <Input
            id="tenancy-rent-rate"
            type="text"
            inputMode="numeric"
            value={rentRate}
            onChange={(event) => setRentRate(event.target.value)}
          />
        ) : (
          <Input
            id="tenancy-rent-rate"
            type="number"
            step="0.01"
            value={rentRate}
            onChange={(event) => setRentRate(event.target.value)}
          />
        )}
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
            ? t("tenancyForm.savingButton")
            : t("tenancyForm.saveButton")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
