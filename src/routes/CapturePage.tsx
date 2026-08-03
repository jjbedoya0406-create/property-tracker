import { useNavigate, useSearchParams } from "react-router-dom";
import { ExpenseForm } from "../features/expenses/ExpenseForm";

export function CapturePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPropertyId = searchParams.get("propertyId") ?? undefined;

  return (
    <div>
      <h1>Capture Receipt</h1>
      <ExpenseForm
        initialPropertyId={initialPropertyId}
        onSaved={(propertyId) => navigate(`/properties/${propertyId}`)}
      />
    </div>
  );
}
