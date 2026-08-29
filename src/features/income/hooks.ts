import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import {
  createIncome,
  deleteIncome,
  listIncome,
  updateIncome,
  type CreateIncomeInput,
} from "../../data/income";
import { useSpreadsheetId } from "../../portfolio/context";
import type { Income } from "../../types";

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

// Unfiltered — every income entry across every property/unit in the
// active portfolio. Needed by the closed-year guard and the Settings
// page's year list (issue #10).
export function useAllIncome() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.income.all,
    queryFn: () => listIncome(accessToken, spreadsheetId),
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

export function useUpdateIncome() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (income: Income) =>
      updateIncome(accessToken, spreadsheetId, income),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.income.all });
    },
  });
}

export function useDeleteIncome() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (incomeId: string) =>
      deleteIncome(accessToken, spreadsheetId, incomeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.income.all });
    },
  });
}
