import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "../i18n/useTranslation";
import { useSettings } from "../portfolio/context";
import { DriveMigrationSection } from "../features/driveMigration/DriveMigrationSection";
import { useUpdateSettings } from "../features/settings/hooks";
import type { Settings } from "../types";

// Same bundled language+currency choice as the onboarding picker
// (src/portfolio/OnboardingPicker.tsx) — both real accounts pair them the
// same way in practice, so one picker covers both onboarding and later
// changes rather than exposing two independent controls for a case that
// doesn't come up.
const OPTIONS: { settings: Settings; label: string }[] = [
  { settings: { language: "en", currency: "USD" }, label: "English (USD)" },
  { settings: { language: "es", currency: "COP" }, label: "Español (COP)" },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const settings = useSettings();
  const updateSettings = useUpdateSettings();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-medium">{t("settings.title")}</h1>
      <Card>
        <CardContent className="flex flex-col gap-2">
          {OPTIONS.map((option) => {
            const isCurrent =
              option.settings.language === settings.language &&
              option.settings.currency === settings.currency;
            return (
              <Button
                key={option.settings.language}
                variant={isCurrent ? "default" : "outline"}
                disabled={isCurrent || updateSettings.isPending}
                onClick={() => updateSettings.mutate(option.settings)}
              >
                {option.label}
                {isCurrent ? ` — ${t("settings.current")}` : ""}
              </Button>
            );
          })}
        </CardContent>
      </Card>
      {updateSettings.isError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            {updateSettings.error instanceof Error
              ? updateSettings.error.message
              : t("validation.invalidInput")}
          </AlertDescription>
        </Alert>
      )}
      <DriveMigrationSection />
    </div>
  );
}
