import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import { addConnectedPortfolio } from "../../data/connectedPortfolios";
import { useHomeSpreadsheetId } from "../../portfolio/context";

// The list itself is read via usePortfolioSwitcher() (RequirePortfolio
// already fetches it into PortfolioContext) — this only adds new ones.
export function useAddConnectedPortfolio() {
  const accessToken = useRequiredAccessToken();
  const homeSpreadsheetId = useHomeSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { spreadsheetId: string; label: string }) =>
      addConnectedPortfolio(accessToken, homeSpreadsheetId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.connectedPortfolios.all,
      });
    },
  });
}
