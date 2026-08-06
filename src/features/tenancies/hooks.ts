import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import {
  createTenancy,
  listTenancies,
  updateTenancy,
  type CreateTenancyInput,
} from "../../data/tenancies";
import { useSpreadsheetId } from "../../portfolio/context";
import type { Tenancy } from "../../types";

export function useTenancies(propertyId: string) {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.tenancies.all,
    queryFn: () => listTenancies(accessToken, spreadsheetId),
    select: (tenancies) =>
      tenancies.filter((tenancy) => tenancy.propertyId === propertyId),
  });
}

export function useCreateTenancy() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTenancyInput) =>
      createTenancy(accessToken, spreadsheetId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tenancies.all,
      });
    },
  });
}

// Records the actual move-out date on an existing tenancy — captured
// separately from expectedEndDate since the gap between them is meaningful
// (early departure vs. overstay), not just "the lease ended".
export function useUpdateTenancy() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenancy: Tenancy) =>
      updateTenancy(accessToken, spreadsheetId, tenancy),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tenancies.all,
      });
    },
  });
}
