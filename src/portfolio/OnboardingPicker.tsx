import { AlertCircle } from "lucide-react";
import { StampIcon } from "@/components/StampIcon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import type { Settings } from "../types";

interface OnboardingPickerProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (settings: Settings) => void;
}

const OPTIONS: { settings: Settings; label: string }[] = [
  { settings: { language: "en", currency: "USD" }, label: "English (USD)" },
  { settings: { language: "es", currency: "COP" }, label: "Español (COP)" },
];

// Shown once, the first time an account (new or pre-existing) has no
// Settings row yet — PRD §7 "set at account creation or in account
// settings". The choice bundles language+currency together for this
// one-time picker (both real accounts pair them the same way in practice),
// though Settings itself stores them independently and a later Settings
// page can change them separately.
//
// Deliberately bilingual copy — the whole point of this screen is that the
// language isn't known yet.
export function OnboardingPicker({
  isSubmitting,
  error,
  onSubmit,
}: OnboardingPickerProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <StampIcon size={44} />
          <CardDescription>
            Choose your language and currency to get started.
            <br />
            Elige tu idioma y moneda para empezar.
          </CardDescription>
          <div className="flex w-full flex-col gap-2">
            {OPTIONS.map((option) => (
              <Button
                key={option.settings.language}
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => onSubmit(option.settings)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
