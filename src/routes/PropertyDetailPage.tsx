import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "../i18n/useTranslation";
import { ExpensesSection } from "../features/expenses/ExpensesSection";
import { PropertyForm } from "../features/properties/PropertyForm";
import {
  useProperties,
  useSetPropertyStatus,
  useUpdateProperty,
} from "../features/properties/hooks";

export function PropertyDetailPage() {
  const { t } = useTranslation();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data: properties, isPending, isError, error } = useProperties();
  const updateProperty = useUpdateProperty();
  const setPropertyStatus = useSetPropertyStatus();
  const [isEditing, setIsEditing] = useState(false);

  if (!propertyId) {
    return <Navigate to="/properties" replace />;
  }

  const property = properties?.find((p) => p.propertyId === propertyId);

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

      {property && (
        <Card>
          <CardContent>
            {isEditing ? (
              <PropertyForm
                initialValues={{
                  name: property.name,
                  address: property.address,
                }}
                submitLabel={t("common.saveChanges")}
                isSubmitting={updateProperty.isPending}
                onSubmit={(input) => {
                  updateProperty.mutate(
                    { ...property, name: input.name, address: input.address },
                    { onSuccess: () => setIsEditing(false) },
                  );
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-medium">{property.name}</h1>
                    {property.address && (
                      <p className="text-muted-foreground">
                        {property.address}
                      </p>
                    )}
                  </div>
                  {property.status === "archived" && (
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
                  {property.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={setPropertyStatus.isPending}
                      onClick={() =>
                        setPropertyStatus.mutate({
                          property,
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
                          property,
                          status: "active",
                        })
                      }
                    >
                      {t("common.unarchive")}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mounted immediately off the URL param rather than waiting on the
          properties fetch above — expenses/categories don't depend on
          property data, so gating them behind it was a needless serial
          network waterfall (properties -> expenses -> categories) instead
          of all three loading in parallel. */}
      <ExpensesSection propertyId={propertyId} />
    </div>
  );
}
