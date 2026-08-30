import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Building2, ChevronDown, ChevronRight, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoggedStamp } from "@/components/LoggedStamp";
import { cn } from "@/lib/utils";
import { useTranslation } from "../i18n/useTranslation";
import type { Building, Property, PropertyStatus } from "../types";
import { useBuildings } from "../features/buildings/hooks";
import { groupPropertiesByBuilding } from "../features/properties/groupByBuilding";
import { PropertyForm } from "../features/properties/PropertyForm";
import { useCreateProperty, useProperties } from "../features/properties/hooks";

const EXPAND_UNITS_THRESHOLD = 3;

export function PropertiesListPage() {
  const { t } = useTranslation();
  const { data: properties, isPending, isError, error } = useProperties();
  const { data: buildings } = useBuildings();
  const createProperty = useCreateProperty();
  const [statusFilter, setStatusFilter] = useState<PropertyStatus>("active");
  const [showAddForm, setShowAddForm] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  if (isPending) {
    return <p className="text-muted-foreground">{t("properties.loading")}</p>;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>
          {error instanceof Error ? error.message : t("properties.loadError")}
        </AlertDescription>
      </Alert>
    );
  }

  const filtered = properties.filter(
    (property) => property.status === statusFilter,
  );
  const hasNoPropertiesAtAll = properties.length === 0;
  const items = groupPropertiesByBuilding(filtered, buildings ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium">{t("properties.title")}</h1>
        {!hasNoPropertiesAtAll && (
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as PropertyStatus)}
          >
            <TabsList>
              <TabsTrigger value="active">{t("common.active")}</TabsTrigger>
              <TabsTrigger value="archived">{t("common.archived")}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {hasNoPropertiesAtAll && !showAddForm && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground">
              {t("properties.emptyState")}
            </p>
            <Button variant="outline" onClick={() => setShowAddForm(true)}>
              {t("properties.addButton")}
            </Button>
          </CardContent>
        </Card>
      )}

      {!hasNoPropertiesAtAll && (
        <>
          {items.length === 0 ? (
            <p className="text-muted-foreground">
              {t("properties.noneForStatus", {
                status: t(`common.${statusFilter}`).toLowerCase(),
              })}
            </p>
          ) : (
            <Card className="gap-0 py-0">
              <CardContent className="divide-y divide-border px-0">
                {items.map((item) =>
                  item.kind === "standalone" ? (
                    <StandalonePropertyRow
                      key={item.property.propertyId}
                      property={item.property}
                      isJustCreated={item.property.propertyId === justCreatedId}
                    />
                  ) : (
                    <BuildingListRow
                      key={item.building.buildingId}
                      building={item.building}
                      units={item.units}
                    />
                  ),
                )}
              </CardContent>
            </Card>
          )}

          {!showAddForm && (
            <Button
              variant="outline"
              className="self-start"
              onClick={() => setShowAddForm(true)}
            >
              {t("properties.addButton")}
            </Button>
          )}
        </>
      )}

      {showAddForm && (
        <Card>
          <CardContent>
            <PropertyForm
              submitLabel={t("properties.addButton")}
              isSubmitting={createProperty.isPending}
              onSubmit={(input) => {
                createProperty.mutate(input, {
                  onSuccess: (property) => {
                    setShowAddForm(false);
                    setJustCreatedId(property.propertyId);
                  },
                });
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StandalonePropertyRow({
  property,
  isJustCreated,
}: {
  property: Property;
  isJustCreated: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/properties/${property.propertyId}`}
      className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
    >
      <span className="flex items-center gap-2.5">
        <Home className="size-4 text-muted-foreground" />
        <span className="font-medium">{property.name}</span>
      </span>
      <div className="flex items-center gap-2">
        {isJustCreated && <LoggedStamp />}
        {property.status === "archived" && (
          <Badge variant="secondary">{t("common.archived")}</Badge>
        )}
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

// Tapping the row body navigates straight into the building detail view
// (overview); the disclosure chevron is a separate control that only
// toggles whether unit names show beneath it in place — the two never
// share a tap target (issue #12).
function BuildingListRow({
  building,
  units,
}: {
  building: Building;
  units: Property[];
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(
    units.length <= EXPAND_UNITS_THRESHOLD,
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-label={
          isExpanded
            ? t("properties.collapseUnits")
            : t("properties.expandUnits")
        }
        className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50"
      >
        <span className="flex items-center gap-2.5">
          <Building2 className="size-4 text-muted-foreground" />
          <span className="flex flex-col">
            <span className="font-medium">{building.name}</span>
            <span className="text-sm text-muted-foreground">
              {t("properties.unitCount", { count: String(units.length) })}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>
      {isExpanded && (
        <div className="flex flex-col divide-y divide-border border-t border-border bg-muted/30">
          {units.map((unit) => (
            <Link
              key={unit.propertyId}
              to={`/properties/${unit.propertyId}`}
              className="flex min-h-11 items-center justify-between gap-3 py-3 pr-4 pl-10 hover:bg-muted/50"
            >
              <span>{unit.name}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
