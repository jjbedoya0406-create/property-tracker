import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequiredAccessToken } from "../../auth";
import { useTranslation } from "../../i18n/useTranslation";
import { loadGooglePicker, pickSpreadsheet } from "../../lib/googlePicker";
import type { ConnectedPortfolio } from "../../types";
import { useAddConnectedPortfolio } from "./hooks";

interface ConnectPortfolioFormProps {
  onConnected: (connection: ConnectedPortfolio) => void;
  onCancel: () => void;
}

// Label first, then the Picker (googlePicker.ts) — drive.file only grants
// access to a spreadsheet the signed-in account created itself or
// explicitly selected here, so the Picker is what turns "shared with me"
// into something this app can actually read (issue #3 spike).
export function ConnectPortfolioForm({
  onConnected,
  onCancel,
}: ConnectPortfolioFormProps) {
  const { t } = useTranslation();
  const accessToken = useRequiredAccessToken();
  const addConnectedPortfolio = useAddConnectedPortfolio();
  const [label, setLabel] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_PICKER_API_KEY;

  async function handleConnect(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = label.trim();
    if (!trimmed) {
      setError(t("connectPortfolio.labelRequired"));
      return;
    }
    if (!apiKey) {
      setError(t("connectPortfolio.notConfigured"));
      return;
    }

    setIsPicking(true);
    let picked;
    try {
      await loadGooglePicker();
      picked = await pickSpreadsheet(accessToken, apiKey);
    } catch {
      setIsPicking(false);
      setError(t("connectPortfolio.pickerError"));
      return;
    }
    setIsPicking(false);
    if (!picked) {
      return;
    }

    addConnectedPortfolio.mutate(
      { spreadsheetId: picked.id, label: trimmed },
      {
        onSuccess: onConnected,
        onError: () => setError(t("connectPortfolio.connectError")),
      },
    );
  }

  const isBusy = isPicking || addConnectedPortfolio.isPending;

  return (
    <form
      onSubmit={handleConnect}
      className="flex flex-col gap-3 px-2 pb-2"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="connect-portfolio-label">
          {t("connectPortfolio.labelLabel")}
        </Label>
        <Input
          id="connect-portfolio-label"
          value={label}
          placeholder={t("connectPortfolio.labelPlaceholder")}
          onChange={(event) => setLabel(event.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isBusy}>
          {isBusy
            ? t("connectPortfolio.connectingButton")
            : t("connectPortfolio.chooseButton")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
