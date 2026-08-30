import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AlertCircle, ChevronLeft, Pencil } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTranslation } from "../i18n/useTranslation";
import { BuildingSection } from "../features/buildings/BuildingSection";
import { PromotePropertyForm } from "../features/buildings/PromotePropertyForm";
import { RenameBuildingForm } from "../features/buildings/RenameBuildingForm";
import {
  useBuildings,
  usePromotePropertyToBuilding,
  useUpdateBuilding,
} from "../features/buildings/hooks";
import { DashboardSection } from "../features/dashboard/DashboardSection";
import { ExpensesSection } from "../features/expenses/ExpensesSection";
import { IncomeForm } from "../features/income/IncomeForm";
import { IncomeSection } from "../features/income/IncomeSection";
import { useCreateIncome } from "../features/income/hooks";
import type { FinancialScope } from "../features/properties/financialScope";
import { PropertyForm } from "../features/properties/PropertyForm";
import { SummarySection } from "../features/summary/SummarySection";
import { TenancySection } from "../features/tenancies/TenancySection";
import {
  useProperties,
  useSetPropertyStatus,
  useUpdateProperty,
} from "../features/properties/hooks";

type SectionKey = "summary" | "dashboard" | "tenancy" | "income" | "expenses";

// Summary open, everything else collapsed — the page's job is logging a
// payment, not analytics (issue #4).
const DEFAULT_EXPANDED: Record<SectionKey, boolean> = {
  summary: true,
  dashboard: false,
  tenancy: false,
  income: false,
  expenses: false,
};

export function PropertyDetailPage() {
  const { t } = useTranslation();
  const { propertyId, buildingId } = useParams<{
    propertyId?: string;
    buildingId?: string;
  }>();
  const { data: properties, isPending, isError, error } = useProperties();
  const { data: buildings } = useBuildings();
  const updateProperty = useUpdateProperty();
  const setPropertyStatus = useSetPropertyStatus();
  const promotePropertyToBuilding = usePromotePropertyToBuilding();
  const updateBuilding = useUpdateBuilding();
  const createIncome = useCreateIncome();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);
  const [showRenameBuildingForm, setShowRenameBuildingForm] = useState(false);
  const [showQuickLogIncome, setShowQuickLogIncome] = useState(false);
  const [expandedSections, setExpandedSections] =
    useState<Record<SectionKey, boolean>>(DEFAULT_EXPANDED);
  // null = the building overview (only reachable via the /buildings/:id
  // route — the old /properties/:id route always lands directly on that
  // unit's own tab, unchanged from before this issue).
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    buildingId ? null : (propertyId ?? null),
  );

  function toggleSection(key: SectionKey) {
    setExpandedSections((current) => ({ ...current, [key]: !current[key] }));
  }

  // Local selection would otherwise persist across a URL param change
  // (this route component doesn't remount when the param changes) —
  // reset it so arriving at a different URL lands on the right state.
  useEffect(() => {
    setSelectedUnitId(buildingId ? null : (propertyId ?? null));
  }, [propertyId, buildingId]);

  // Landing on a different unit or the overview is a fresh "landing" —
  // collapsed sections reset the same way every time (issue #4), not
  // just on the very first mount.
  useEffect(() => {
    setExpandedSections(DEFAULT_EXPANDED);
    setShowQuickLogIncome(false);
  }, [selectedUnitId]);

  if (!propertyId && !buildingId) {
    return <Navigate to="/properties" replace />;
  }

  const property = propertyId
    ? properties?.find((p) => p.propertyId === propertyId)
    : undefined;
  const resolvedBuildingId = buildingId ?? property?.buildingId;

  // Every unit sharing this buildingId. The tab bar only renders once this
  // is 2+ — a promoted property always has a sibling by construction, so
  // this only ever collapses back to flat for a genuinely standalone
  // property (Requirement 8, issue #7).
  const siblings = resolvedBuildingId
    ? (properties ?? []).filter((p) => p.buildingId === resolvedBuildingId)
    : [];
  const isMultiUnit = siblings.length >= 2;
  const building = isMultiUnit
    ? buildings?.find((b) => b.buildingId === resolvedBuildingId)
    : undefined;

  const activeProperty = isMultiUnit
    ? selectedUnitId
      ? siblings.find((p) => p.propertyId === selectedUnitId)
      : undefined
    : property;

  // Summary/Dashboard scope to the whole building on the overview
  // (combining every unit plus the building's own shared bills), or to
  // just the active unit/standalone property otherwise (issue #4).
  const scope: FinancialScope | undefined =
    isMultiUnit && selectedUnitId === null && building
      ? {
          kind: "building",
          buildingId: building.buildingId,
          unitPropertyIds: siblings.map((unit) => unit.propertyId),
        }
      : activeProperty
        ? { kind: "unit", propertyId: activeProperty.propertyId }
        : undefined;

  return (
    // 228px = the pinned Log income/expense bar's own height (60px) plus
    // its position above the viewport bottom (bottom-40 = 160px) plus an
    // 8px gap — measured directly, not guessed, since a mismatch here
    // means the last card gets covered by the bar instead of stopping
    // short of it. If the bar's position/height class below ever
    // changes, this needs to move with it.
    <div className={cn("flex flex-col gap-6", activeProperty && "pb-[228px]")}>
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

      {!isPending && !isError && propertyId && !property && (
        <Navigate to="/properties" replace />
      )}
      {!isPending && !isError && buildingId && !isMultiUnit && (
        <Navigate to="/properties" replace />
      )}

      {isMultiUnit && building && (
        <div className="flex flex-col gap-3">
          <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-2 bg-background px-4 py-2">
            <button
              type="button"
              onClick={() => setSelectedUnitId(null)}
              className="text-left"
            >
              <h1 className="text-xl font-medium">{building.name}</h1>
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("common.edit")}
              onClick={() => setShowRenameBuildingForm(true)}
            >
              <Pencil className="size-4" />
            </Button>
          </div>

          {showRenameBuildingForm && (
            <Card>
              <CardContent>
                <RenameBuildingForm
                  initialName={building.name}
                  isSubmitting={updateBuilding.isPending}
                  onSubmit={(name) => {
                    updateBuilding.mutate(
                      { ...building, name },
                      { onSuccess: () => setShowRenameBuildingForm(false) },
                    );
                  }}
                  onCancel={() => setShowRenameBuildingForm(false)}
                />
              </CardContent>
            </Card>
          )}

          <Tabs value={selectedUnitId ?? ""} onValueChange={setSelectedUnitId}>
            <TabsList>
              {siblings.map((unit) => (
                <TabsTrigger key={unit.propertyId} value={unit.propertyId}>
                  {unit.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Identity info, not a data section — always first, before any
          collapsible card (moved here per feedback on issue #4). */}
      {activeProperty && (
        <Card>
          <CardContent>
            {isEditing ? (
              <PropertyForm
                initialValues={{
                  name: activeProperty.name,
                  address: activeProperty.address,
                }}
                submitLabel={t("common.saveChanges")}
                isSubmitting={updateProperty.isPending}
                onSubmit={(input) => {
                  updateProperty.mutate(
                    {
                      ...activeProperty,
                      name: input.name,
                      address: input.address,
                    },
                    { onSuccess: () => setIsEditing(false) },
                  );
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-medium">
                      {activeProperty.name}
                    </h1>
                    {activeProperty.address && (
                      <p className="text-muted-foreground">
                        {activeProperty.address}
                      </p>
                    )}
                  </div>
                  {activeProperty.status === "archived" && (
                    <Badge variant="secondary">{t("common.archived")}</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    {t("common.edit")}
                  </Button>
                  {activeProperty.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={setPropertyStatus.isPending}
                      onClick={() =>
                        setPropertyStatus.mutate({
                          property: activeProperty,
                          status: "archived",
                        })
                      }
                    >
                      {t("common.archive")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={setPropertyStatus.isPending}
                      onClick={() =>
                        setPropertyStatus.mutate({
                          property: activeProperty,
                          status: "active",
                        })
                      }
                    >
                      {t("common.unarchive")}
                    </Button>
                  )}
                  {/* Only offered for a standalone property — once
                      promoted, adding further units happens from the
                      Building tab instead. */}
                  {!activeProperty.buildingId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddUnitForm(true)}
                    >
                      {t("buildings.addUnitButton")}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeProperty && showAddUnitForm && (
        <Card>
          <CardContent>
            <PromotePropertyForm
              initialBuildingName={activeProperty.name}
              isSubmitting={promotePropertyToBuilding.isPending}
              onSubmit={(input) => {
                promotePropertyToBuilding.mutate(
                  {
                    property: activeProperty,
                    buildingName: input.buildingName,
                    newUnitName: input.newUnitName,
                  },
                  { onSuccess: () => setShowAddUnitForm(false) },
                );
              }}
              onCancel={() => setShowAddUnitForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {scope && (
        <>
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
        </>
      )}

      {isMultiUnit && selectedUnitId === null && building && (
        <BuildingSection
          building={building}
          unitPropertyIds={siblings.map((unit) => unit.propertyId)}
        />
      )}

      {activeProperty && (
        <>
          <TenancySection
            propertyId={activeProperty.propertyId}
            isExpanded={expandedSections.tenancy}
            onToggleExpanded={() => toggleSection("tenancy")}
          />
          <IncomeSection
            propertyId={activeProperty.propertyId}
            isExpanded={expandedSections.income}
            onToggleExpanded={() => toggleSection("income")}
          />
          <ExpensesSection
            propertyId={activeProperty.propertyId}
            isExpanded={expandedSections.expenses}
            onToggleExpanded={() => toggleSection("expenses")}
          />
        </>
      )}

      {/* Only when a specific unit (or standalone property) is active —
          both income and expenses are unit-scoped (issue #7, Requirement
          3), so there's no single target to log against from the
          building overview. Positioned above where UndoBanner sits
          (bottom-24) so the two never overlap if both happen to show at
          once. Log expense still hands off to the Capture flow (OCR) —
          only Log income gets an inline form here. The top border +
          background turn this into a visibly persistent toolbar rather
          than buttons floating loose over whatever content is scrolled
          beneath them. Truly `fixed` to the viewport (not just trailing
          the last card) — nothing between this and Layout's <main> sets
          a transform/filter that would re-scope it. */}
      {activeProperty && (
        <div className="fixed inset-x-0 bottom-40 z-30 border-t border-border bg-background">
          <div className="mx-auto max-w-2xl px-4 pt-2 pb-3">
            {showQuickLogIncome ? (
              <Card>
                <CardContent>
                  <IncomeForm
                    isSubmitting={createIncome.isPending}
                    onSubmit={(input) => {
                      createIncome.mutate(
                        { propertyId: activeProperty.propertyId, ...input },
                        { onSuccess: () => setShowQuickLogIncome(false) },
                      );
                    }}
                    onCancel={() => setShowQuickLogIncome(false)}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 shadow-lg"
                  onClick={() => setShowQuickLogIncome(true)}
                >
                  {t("property.logIncomeQuickAction")}
                </Button>
                <Button
                  asChild
                  className="flex-1 shadow-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Link
                    to={`/capture?propertyId=${activeProperty.propertyId}`}
                  >
                    {t("expenses.logButton")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
