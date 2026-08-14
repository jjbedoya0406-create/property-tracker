import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "../i18n/useTranslation";
import { BuildingSection } from "../features/buildings/BuildingSection";
import { PromotePropertyForm } from "../features/buildings/PromotePropertyForm";
import {
  useBuildings,
  usePromotePropertyToBuilding,
} from "../features/buildings/hooks";
import { ExpensesSection } from "../features/expenses/ExpensesSection";
import { IncomeSection } from "../features/income/IncomeSection";
import { PropertyForm } from "../features/properties/PropertyForm";
import { SummarySection } from "../features/summary/SummarySection";
import { TenancySection } from "../features/tenancies/TenancySection";
import {
  useProperties,
  useSetPropertyStatus,
  useUpdateProperty,
} from "../features/properties/hooks";

const BUILDING_TAB = "building";

export function PropertyDetailPage() {
  const { t } = useTranslation();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data: properties, isPending, isError, error } = useProperties();
  const { data: buildings } = useBuildings();
  const updateProperty = useUpdateProperty();
  const setPropertyStatus = useSetPropertyStatus();
  const promotePropertyToBuilding = usePromotePropertyToBuilding();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState(propertyId);

  // Local tab selection would otherwise persist across a URL param change
  // (this route component doesn't remount when :propertyId changes) —
  // reset it so arriving at a different unit's URL lands on that unit's
  // own tab, not whichever tab was last selected.
  useEffect(() => {
    setSelectedTab(propertyId);
  }, [propertyId]);

  if (!propertyId) {
    return <Navigate to="/properties" replace />;
  }

  const property = properties?.find((p) => p.propertyId === propertyId);

  // Every sibling sharing this property's buildingId, including itself.
  // The tab bar only renders once this is 2+ — a promoted property always
  // has a sibling by construction, so this only ever collapses back to
  // flat for a genuinely standalone property (Requirement 8).
  const siblings = property?.buildingId
    ? (properties ?? []).filter((p) => p.buildingId === property.buildingId)
    : [];
  const isMultiUnit = siblings.length >= 2;
  const building = isMultiUnit
    ? buildings?.find((b) => b.buildingId === property?.buildingId)
    : undefined;

  const activeProperty = isMultiUnit
    ? siblings.find((p) => p.propertyId === selectedTab)
    : property;

  return (
    <div className="flex flex-col gap-6">
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

      {!isPending && !isError && !property && (
        <Navigate to="/properties" replace />
      )}

      {isMultiUnit && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value={BUILDING_TAB}>
              {t("buildings.tabLabel")}
            </TabsTrigger>
            {siblings.map((unit) => (
              <TabsTrigger key={unit.propertyId} value={unit.propertyId}>
                {unit.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {isMultiUnit && selectedTab === BUILDING_TAB ? (
        building && (
          <BuildingSection
            building={building}
            unitPropertyIds={siblings.map((unit) => unit.propertyId)}
          />
        )
      ) : (
        <>
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
                        <Badge variant="secondary">
                          {t("common.archived")}
                        </Badge>
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

          {activeProperty && (
            <>
              <SummarySection propertyId={activeProperty.propertyId} />
              <TenancySection propertyId={activeProperty.propertyId} />
              <IncomeSection propertyId={activeProperty.propertyId} />
              <ExpensesSection propertyId={activeProperty.propertyId} />
            </>
          )}
        </>
      )}
    </div>
  );
}
