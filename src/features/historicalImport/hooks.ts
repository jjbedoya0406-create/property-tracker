import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import {
  planHistoricalImport,
  runHistoricalImport,
  type HistoricalImportPlan,
  type IdentifierOverrides,
} from "../../data/historicalImport";
import { useSpreadsheetId } from "../../portfolio/context";
import { useBuildings } from "../buildings/hooks";
import { useCategories } from "../categories/hooks";
import { useProperties } from "../properties/hooks";

// Modeled as mutations, not queries — nothing runs until the user
// explicitly asks for it (same rationale as DriveMigration, issue #2):
// this is real financial data, previewed before anything is written.
export function usePlanHistoricalImport() {
  const properties = useProperties();
  const categories = useCategories();
  const buildings = useBuildings();

  return useMutation({
    mutationFn: ({
      file,
      overrides,
    }: {
      file: File;
      overrides?: IdentifierOverrides;
    }) =>
      planHistoricalImport(
        file,
        properties.data ?? [],
        categories.data ?? [],
        buildings.data ?? [],
        overrides,
      ),
  });
}

export function useRunHistoricalImport() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: HistoricalImportPlan) =>
      runHistoricalImport(accessToken, spreadsheetId, plan),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.income.all });
    },
  });
}
