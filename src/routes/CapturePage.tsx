import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "../features/expenses/ExpenseForm";

export function CapturePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPropertyId = searchParams.get("propertyId") ?? undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Capture Receipt</CardTitle>
      </CardHeader>
      <CardContent>
        <ExpenseForm
          initialPropertyId={initialPropertyId}
          onSaved={(propertyId, expenseId) =>
            navigate(`/properties/${propertyId}`, {
              state: { justLoggedExpenseId: expenseId },
            })
          }
        />
      </CardContent>
    </Card>
  );
}
