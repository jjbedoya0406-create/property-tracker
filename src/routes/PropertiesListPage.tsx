import { useState } from "react";
import { Link } from "react-router-dom";
import { PropertyForm } from "../features/properties/PropertyForm";
import { useCreateProperty, useProperties } from "../features/properties/hooks";
import type { PropertyStatus } from "../types";

export function PropertiesListPage() {
  const { data: properties, isPending, isError, error } = useProperties();
  const createProperty = useCreateProperty();
  const [statusFilter, setStatusFilter] = useState<PropertyStatus>("active");
  const [showAddForm, setShowAddForm] = useState(false);

  if (isPending) {
    return <p>Loading your properties…</p>;
  }

  if (isError) {
    return (
      <p role="alert">
        {error instanceof Error ? error.message : "Failed to load properties."}
      </p>
    );
  }

  const filtered = properties.filter(
    (property) => property.status === statusFilter,
  );

  return (
    <div>
      <h1>My Properties</h1>

      <nav>
        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          aria-pressed={statusFilter === "active"}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("archived")}
          aria-pressed={statusFilter === "archived"}
        >
          Archived
        </button>
      </nav>

      {properties.length === 0 ? (
        <p>
          You don&apos;t have any properties yet. Add your first one below to
          get started.
        </p>
      ) : filtered.length === 0 ? (
        <p>No {statusFilter} properties.</p>
      ) : (
        <ul>
          {filtered.map((property) => (
            <li key={property.propertyId}>
              <Link to={`/properties/${property.propertyId}`}>
                {property.name}
              </Link>
              {property.status === "archived" && (
                <em style={{ color: "gray" }}> (Archived)</em>
              )}
            </li>
          ))}
        </ul>
      )}

      {showAddForm ? (
        <PropertyForm
          submitLabel="Add property"
          isSubmitting={createProperty.isPending}
          onSubmit={(input) => {
            createProperty.mutate(input, {
              onSuccess: () => setShowAddForm(false),
            });
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button type="button" onClick={() => setShowAddForm(true)}>
          Add property
        </button>
      )}
    </div>
  );
}
