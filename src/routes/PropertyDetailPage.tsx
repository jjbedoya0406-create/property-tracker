import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
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
    return <p>Loading…</p>;
  }

  if (isError) {
    return (
      <p role="alert">
        {error instanceof Error ? error.message : "Failed to load property."}
      </p>
    );
  }

  const property = properties.find((p) => p.propertyId === propertyId);

  if (!property) {
    return <Navigate to="/properties" replace />;
  }

  return (
    <div>
      {isEditing ? (
        <PropertyForm
          initialValues={{ name: property.name, address: property.address }}
          submitLabel="Save"
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
        <>
          <h1>{property.name}</h1>
          {property.address && <p>{property.address}</p>}
          {property.status === "archived" && (
            <p>
              <em>Archived</em>
            </p>
          )}
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          {property.status === "active" ? (
            <button
              type="button"
              disabled={setPropertyStatus.isPending}
              onClick={() =>
                setPropertyStatus.mutate({ property, status: "archived" })
              }
            >
              Archive
            </button>
          ) : (
            <button
              type="button"
              disabled={setPropertyStatus.isPending}
              onClick={() =>
                setPropertyStatus.mutate({ property, status: "active" })
              }
            >
              Unarchive
            </button>
          )}
        </>
      )}

      <ExpensesSection propertyId={property.propertyId} />
    </div>
  );
}
