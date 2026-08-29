import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import { closeYear, listClosedYears } from "../../data/closedYears";
import { useSpreadsheetId } from "../../portfolio/context";

// Portfolio-wide (not per-property) — reads/writes the ACTIVE spreadsheet,
// same as everything else via useSpreadsheetId(), so closing a year while
// viewing a connected portfolio (issue #3) closes it there, not at home.
export function useClosedYears() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.closedYears.list(),
    queryFn: () => listClosedYears(accessToken, spreadsheetId),
  });
}

export function useCloseYear() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (year: number) => closeYear(accessToken, spreadsheetId, year),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.closedYears.all,
      });
    },
  });
}
