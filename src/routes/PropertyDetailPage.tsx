import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExpensesSection } from "../features/expenses/ExpensesSection";
import { PropertyForm } from "../features/properties/PropertyForm";
import {
  useProperties,
  useSetPropertyStatus,
  useUpdateProperty,
} from "../features/properties/hooks";

export function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data: properties, isPending, isError, error } = useProperties();
  const updateProperty = useUpdateProperty();
  const setPropertyStatus = useSetPropertyStatus();
  const [isEditing, setIsEditing] = useState(false);

  if (isPending) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load property."}
        </AlertDescription>
      </Alert>
    );
  }

  const property = properties.find((p) => p.propertyId === propertyId);

  if (!property) {
    return <Navigate to="/properties" replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          {isEditing ? (
            <PropertyForm
              initialValues={{
                name: property.name,
                address: property.address,
              }}
              submitLabel="Save changes"
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
                    <p className="text-muted-foreground">{property.address}</p>
                  )}
                </div>
                {property.status === "archived" && (
                  <Badge variant="secondary">Archived</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
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
                    Archive
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
                    Unarchive
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ExpensesSection propertyId={property.propertyId} />
    </div>
  );
}
