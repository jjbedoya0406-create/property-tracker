import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import {
  planDriveMigration,
  runDriveMigration,
  type MigrationPlan,
} from "../../data/driveMigration";
import { useSpreadsheetId } from "../../portfolio/context";

// Modeled as mutations, not queries — nothing runs until the user
// explicitly asks for it (issue #2: manual, with a preview, never
// automatic — real receipt files are at stake).
export function usePlanDriveMigration() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useMutation({
    mutationFn: () => planDriveMigration(accessToken, spreadsheetId),
  });
}

export function useRunDriveMigration() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: MigrationPlan) =>
      runDriveMigration(accessToken, spreadsheetId, plan),
    onSuccess: () => {
      // Properties may have just had a folder created + persisted.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.properties.all,
      });
    },
  });
}
