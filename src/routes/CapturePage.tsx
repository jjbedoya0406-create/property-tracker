import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "../i18n/useTranslation";
import { ExpenseForm } from "../features/expenses/ExpenseForm";

export function CapturePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPropertyId = searchParams.get("propertyId") ?? undefined;
  const initialBuildingId = searchParams.get("buildingId") ?? undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("capture.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ExpenseForm
          initialPropertyId={initialPropertyId}
          initialBuildingId={initialBuildingId}
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
