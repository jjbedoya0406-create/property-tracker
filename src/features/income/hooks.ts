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

// Rollup across every sibling unit in a building (issue #7's Building tab
// "Units income" card) — income stays unit-scoped always (Requirement 3),
// so this reads the same shared cache and narrows to a set of unit IDs
// instead of one.
export function useIncomeForProperties(propertyIds: string[]) {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.income.all,
    queryFn: () => listIncome(accessToken, spreadsheetId),
    select: (income) =>
      income.filter((entry) => propertyIds.includes(entry.propertyId)),
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
