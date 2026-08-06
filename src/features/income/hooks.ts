import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import { createIncome, listIncome, type CreateIncomeInput } from "../../data/income";
import { useSpreadsheetId } from "../../portfolio/context";

// Same shared-cache-narrowed-by-select pattern as useExpenses (Sheets has
// no server-side filter-by-column).
export function useIncome(propertyId: string) {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.income.all,
    queryFn: () => listIncome(accessToken, spreadsheetId),
    select: (income) =>
      income.filter((entry) => entry.propertyId === propertyId),
  });
}

export function useCreateIncome() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIncomeInput) =>
      createIncome(accessToken, spreadsheetId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.income.all });
    },
  });
}
