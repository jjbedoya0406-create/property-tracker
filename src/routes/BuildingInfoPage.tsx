import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CollapsibleSectionCard } from "@/components/CollapsibleSectionCard";
import { cn } from "@/lib/utils";
import { useTranslation } from "../i18n/useTranslation";
import { AddUnitForm } from "../features/buildings/AddUnitForm";
import { useAddUnitToBuilding, useBuildings } from "../features/buildings/hooks";
import { DashboardSection } from "../features/dashboard/DashboardSection";
import type { FinancialScope } from "../features/properties/financialScope";
import { useProperties } from "../features/properties/hooks";
import { SummarySection } from "../features/summary/SummarySection";

type SectionKey = "summary" | "dashboard" | "units" | "details";

// Summary open, everything else collapsed — same convention as unit
// pages (issue #4).
const DEFAULT_EXPANDED: Record<SectionKey, boolean> = {
  summary: true,
  dashboard: false,
  units: false,
  details: false,
};

// Dedicated building-wide screen (issue #14) — reached only from My
// Properties. Deliberately separate from PropertyDetailPage's own
// inline building overview (reached by tapping a building's name from
// inside one of its unit pages), which is untouched and keeps working
// exactly as before.
export function BuildingInfoPage() {
  const { t } = useTranslation();
  const { buildingId } = useParams<{ buildingId: string }>();
  const { data: properties, isPending, isError, error } = useProperties();
  const { data: buildings } = useBuildings();
  const addUnit = useAddUnitToBuilding();
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);
  const [expandedSections, setExpandedSections] =
    useState<Record<SectionKey, boolean>>(DEFAULT_EXPANDED);

  function toggleSection(key: SectionKey) {
    setExpandedSections((current) => ({ ...current, [key]: !current[key] }));
  }

  if (!buildingId) {
    return <Navigate to="/properties" replace />;
  }

  const building = buildings?.find((b) => b.buildingId === buildingId);
  const units = (properties ?? []).filter((p) => p.buildingId === buildingId);
  const isMultiUnit = units.length >= 2;
  const isReady = Boolean(building) && isMultiUnit;

  const scope: FinancialScope = {
    kind: "building",
    buildingId,
    unitPropertyIds: units.map((unit) => unit.propertyId),
  };

  return (
    // Same 36px derivation as PropertyDetailPage.tsx: the full 132px
    // clearance minus PortfolioLayout's own pb-24 (96px) it's already
    // nested inside.
    <div className={cn("flex flex-col gap-6", isReady && "pb-9")}>
      <Link
        to="/properties"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("property.backLink")}
      </Link>

      {isPending && (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            {error instanceof Error ? error.message : t("property.loadError")}
          </AlertDescription>
        </Alert>
      )}

      {!isPending && !isError && !isReady && (
        <Navigate to="/properties" replace />
      )}

      {building && isReady && (
        <>
          <h1 className="text-xl font-medium">{building.name}</h1>

          <SummarySection
            scope={scope}
            isExpanded={expandedSections.summary}
            onToggleExpanded={() => toggleSection("summary")}
          />
          <DashboardSection
            scope={scope}
            isExpanded={expandedSections.dashboard}
            onToggleExpanded={() => toggleSection("dashboard")}
          />

          <CollapsibleSectionCard
            title={t("buildings.unitsTitle")}
            hint={units.map((unit) => unit.name).join(", ")}
            isExpanded={expandedSections.units}
            onToggle={() => toggleSection("units")}
          >
            <div className="flex flex-col gap-4">
              <div className="divide-y divide-border rounded-lg border">
                {units.map((unit) => (
                  <Link
                    key={unit.propertyId}
                    to={`/properties/${unit.propertyId}`}
                    className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <span>{unit.name}</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
              {showAddUnitForm ? (
                <AddUnitForm
                  isSubmitting={addUnit.isPending}
                  onSubmit={(input) => {
                    addUnit.mutate(
                      { building, unitName: input.unitName },
                      { onSuccess: () => setShowAddUnitForm(false) },
                    );
                  }}
                  onCancel={() => setShowAddUnitForm(false)}
                />
              ) : (
                <Button
                  variant="outline"
                  className="self-start"
                  onClick={() => setShowAddUnitForm(true)}
                >
                  {t("buildings.addUnitButton")}
                </Button>
              )}
            </div>
          </CollapsibleSectionCard>

          <CollapsibleSectionCard
            title={t("buildings.detailsTitle")}
            hint={building.address ?? t("buildings.noAddress")}
            isExpanded={expandedSections.details}
            onToggle={() => toggleSection("details")}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">
                {t("buildings.addressLabel")}
              </span>
              <span>{building.address ?? t("buildings.noAddress")}</span>
            </div>
          </CollapsibleSectionCard>

          {/* Same fixed positioning as unit pages (bottom-[55px] flush
              against BottomTabBar, border-t divider, bg-background) —
              no inline form here, just a link to Capture, since there's
              no "Log building income" (buildings never earn income
              directly, per this issue's Non-Goals). */}
          <div className="fixed inset-x-0 bottom-[55px] z-30 border-t border-border bg-background">
            <div className="mx-auto max-w-2xl px-4 pt-2 pb-3">
              <Button asChild className="w-full shadow-lg">
                <Link to={`/capture?buildingId=${building.buildingId}`}>
                  {t("buildings.logExpenseAction")}
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
