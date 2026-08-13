import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "../../i18n/useTranslation";
import { usePlanDriveMigration, useRunDriveMigration } from "./hooks";

export function DriveMigrationSection() {
  const { t } = useTranslation();
  const planMigration = usePlanDriveMigration();
  const runMigration = useRunDriveMigration();
  const [hasRun, setHasRun] = useState(false);

  const plan = planMigration.data;
  const movesByProperty = useMemo(() => {
    const map = new Map<string, { propertyName: string; fileNames: string[] }>();
    for (const move of plan?.moves ?? []) {
      const entry = map.get(move.propertyId) ?? {
        propertyName: move.propertyName,
        fileNames: [],
      };
      entry.fileNames.push(move.fileName);
      map.set(move.propertyId, entry);
    }
    return [...map.values()];
  }, [plan]);

  function handlePreview() {
    setHasRun(false);
    planMigration.mutate();
  }

  function handleRun() {
    if (!plan) return;
    runMigration.mutate(plan, { onSuccess: () => setHasRun(true) });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("driveMigration.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t("driveMigration.description")}
        </p>

        <Button
          variant="outline"
          className="self-start"
          disabled={planMigration.isPending}
          onClick={handlePreview}
        >
          {planMigration.isPending
            ? t("driveMigration.previewingButton")
            : t("driveMigration.previewButton")}
        </Button>

        {planMigration.isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {planMigration.error instanceof Error
                ? planMigration.error.message
                : t("driveMigration.previewError")}
            </AlertDescription>
          </Alert>
        )}

        {plan && !hasRun && (
          <>
            {plan.moves.length === 0 && plan.orphans.length === 0 ? (
              <p className="text-muted-foreground">
                {t("driveMigration.nothingToMove")}
              </p>
            ) : (
              <>
                {movesByProperty.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">
                      {t("driveMigration.filesToMoveHeading")}
                    </h3>
                    <div className="divide-y divide-border rounded-lg border">
                      {movesByProperty.map((group) => (
                        <div key={group.propertyName} className="px-4 py-3">
                          <p className="font-medium">{group.propertyName}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.fileNames.join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.orphans.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">
                      {t("driveMigration.orphansHeading")}
                    </h3>
                    <div className="rounded-lg border px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        {plan.orphans.map((o) => o.fileName).join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {plan.moves.length > 0 && (
                  <Button
                    className="self-start"
                    disabled={runMigration.isPending}
                    onClick={handleRun}
                  >
                    {runMigration.isPending
                      ? t("driveMigration.runningButton")
                      : t("driveMigration.runButton")}
                  </Button>
                )}
              </>
            )}
          </>
        )}

        {runMigration.isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {runMigration.error instanceof Error
                ? runMigration.error.message
                : t("driveMigration.runError")}
            </AlertDescription>
          </Alert>
        )}

        {hasRun && (
          <Alert>
            <CheckCircle2 />
            <AlertDescription>
              {t("driveMigration.runSuccess")}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
