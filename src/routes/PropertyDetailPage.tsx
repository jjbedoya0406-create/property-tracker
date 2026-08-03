import { useParams } from "react-router-dom";

// Placeholder — Outcome 2/3 feature implementation (property info, expense
// list, running total) comes in a later pass, not part of scaffolding.
export function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();

  return (
    <div>
      <h1>Property Detail</h1>
      <p>Property ID: {propertyId}</p>
    </div>
  );
}
