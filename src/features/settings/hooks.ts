import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import { updateSettings } from "../../data/settings";
import { useSpreadsheetId } from "../../portfolio/context";
import type { Settings } from "../../types";

export function useUpdateSettings() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Settings) =>
      updateSettings(accessToken, spreadsheetId, settings),
    onSuccess: (_data, settings) => {
      queryClient.setQueryData(["portfolio", "settings"], settings);
      // Currency changing changes how amounts should be entered/read, and
      // category defaults are language-scoped seed data (though existing
      // categories themselves aren't touched by a settings change) — safe
      // to just drop cached expense/category data and let it refetch.
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}
