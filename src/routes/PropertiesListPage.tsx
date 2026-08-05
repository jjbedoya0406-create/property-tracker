import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoggedStamp } from "@/components/LoggedStamp";
import { PropertyForm } from "../features/properties/PropertyForm";
import { useCreateProperty, useProperties } from "../features/properties/hooks";
import type { PropertyStatus } from "../types";

export function PropertiesListPage() {
  const { data: properties, isPending, isError, error } = useProperties();
  const createProperty = useCreateProperty();
  const [statusFilter, setStatusFilter] = useState<PropertyStatus>("active");
  const [showAddForm, setShowAddForm] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  if (isPending) {
    return <p className="text-muted-foreground">Loading your properties…</p>;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : "Couldn't load your properties. Try reloading the page."}
        </AlertDescription>
      </Alert>
    );
  }

  const filtered = properties.filter(
    (property) => property.status === statusFilter,
  );
  const hasNoPropertiesAtAll = properties.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium">My Properties</h1>
        {!hasNoPropertiesAtAll && (
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as PropertyStatus)}
          >
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {hasNoPropertiesAtAll && !showAddForm && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground">
              No properties yet — add your first one to get started.
            </p>
            <Button variant="outline" onClick={() => setShowAddForm(true)}>
              Add property
            </Button>
          </CardContent>
        </Card>
      )}

      {!hasNoPropertiesAtAll && (
        <>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">
              No {statusFilter} properties.
            </p>
          ) : (
            <Card className="gap-0 py-0">
              <CardContent className="divide-y divide-border px-0">
                {filtered.map((property) => (
                  <Link
                    key={property.propertyId}
                    to={`/properties/${property.propertyId}`}
                    className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <span className="font-medium">{property.name}</span>
                    <div className="flex items-center gap-2">
                      {property.propertyId === justCreatedId && <LoggedStamp />}
                      {property.status === "archived" && (
                        <Badge variant="secondary">Archived</Badge>
                      )}
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {!showAddForm && (
            <Button
              variant="outline"
              className="self-start"
              onClick={() => setShowAddForm(true)}
            >
              Add property
            </Button>
          )}
        </>
      )}

      {showAddForm && (
        <Card>
          <CardContent>
            <PropertyForm
              submitLabel="Add property"
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
