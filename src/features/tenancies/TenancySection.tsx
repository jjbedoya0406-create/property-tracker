import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollapsibleSectionCard } from "@/components/CollapsibleSectionCard";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "../../i18n/useTranslation";
import { useSettings } from "../../portfolio/context";
import type { Tenancy } from "../../types";
import { TenancyForm } from "./TenancyForm";
import { useCreateTenancy, useTenancies, useUpdateTenancy } from "./hooks";

interface TenancySectionProps {
  propertyId: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function TenancySection({
  propertyId,
  isExpanded,
  onToggleExpanded,
}: TenancySectionProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const {
    data: tenancies,
    isPending,
    isError,
    error,
  } = useTenancies(propertyId);
  const createTenancy = useCreateTenancy();
  const [showAddForm, setShowAddForm] = useState(false);
  const [recordingMoveOutFor, setRecordingMoveOutFor] = useState<
    string | null
  >(null);

  const sorted = [...(tenancies ?? [])].sort((a, b) =>
    a.contractStart < b.contractStart ? 1 : -1,
  );
  const ongoing = sorted.find((tenancy) => !tenancy.actualMoveOutDate);
  const hint = ongoing
    ? `${formatCurrency(ongoing.rentRate, currency)} ${t("tenancy.perMonth")}`
    : t("tenancy.noActiveTenancy");

  return (
    <CollapsibleSectionCard
      title={t("tenancy.title")}
      hint={hint}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
    >
      <div className="flex flex-col gap-4">
        {showAddForm ? (
          <TenancyForm
            isSubmitting={createTenancy.isPending}
            onSubmit={(input) => {
              createTenancy.mutate(
                { propertyId, ...input },
                { onSuccess: () => setShowAddForm(false) },
              );
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <Button className="self-start" onClick={() => setShowAddForm(true)}>
            {t("tenancy.addButton")}
          </Button>
        )}

        {isPending && (
          <p className="text-muted-foreground">{t("tenancy.loading")}</p>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {error instanceof Error ? error.message : t("tenancy.loadError")}
            </AlertDescription>
          </Alert>
        )}

        {!isPending && !isError && sorted.length === 0 && (
          <p className="text-muted-foreground">{t("tenancy.emptyNoneYet")}</p>
        )}

        {!isPending && !isError && sorted.length > 0 && (
          <div className="divide-y divide-border rounded-lg border">
            {sorted.map((tenancy) => (
              <TenancyRow
                key={tenancy.tenancyId}
                tenancy={tenancy}
                currency={currency}
                isRecordingMoveOut={
                  recordingMoveOutFor === tenancy.tenancyId
                }
                onStartRecordMoveOut={() =>
                  setRecordingMoveOutFor(tenancy.tenancyId)
                }
                onCancelRecordMoveOut={() => setRecordingMoveOutFor(null)}
                onRecorded={() => setRecordingMoveOutFor(null)}
              />
            ))}
          </div>
        )}
      </div>
    </CollapsibleSectionCard>
  );
}

interface TenancyRowProps {
  tenancy: Tenancy;
  currency: "USD" | "COP";
  isRecordingMoveOut: boolean;
  onStartRecordMoveOut: () => void;
  onCancelRecordMoveOut: () => void;
  onRecorded: () => void;
}

function TenancyRow({
  tenancy,
  currency,
  isRecordingMoveOut,
  onStartRecordMoveOut,
  onCancelRecordMoveOut,
  onRecorded,
}: TenancyRowProps) {
  const { t } = useTranslation();
  const updateTenancy = useUpdateTenancy();
  const [moveOutDate, setMoveOutDate] = useState("");

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {tenancy.contractStart}
          {" – "}
          {tenancy.expectedEndDate ?? t("tenancy.ongoing")}
        </span>
        <span className="tabular-nums font-medium">
          {formatCurrency(tenancy.rentRate, currency)}
          <span className="text-sm text-muted-foreground">
            {" "}
            {t("tenancy.perMonth")}
          </span>
        </span>
      </div>

      {tenancy.actualMoveOutDate ? (
        <span className="text-sm text-muted-foreground">
          {t("tenancy.movedOutLabel", { date: tenancy.actualMoveOutDate })}
        </span>
      ) : isRecordingMoveOut ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={moveOutDate}
            onChange={(event) => setMoveOutDate(event.target.value)}
            className="w-auto"
          />
          <Button
            size="sm"
            disabled={!moveOutDate || updateTenancy.isPending}
            onClick={() =>
              updateTenancy.mutate(
                { ...tenancy, actualMoveOutDate: moveOutDate },
                { onSuccess: onRecorded },
              )
            }
          >
            {t("common.saveChanges")}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancelRecordMoveOut}>
            {t("common.cancel")}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          onClick={onStartRecordMoveOut}
        >
          {t("tenancy.recordMoveOutButton")}
        </Button>
      )}
    </div>
  );
}
