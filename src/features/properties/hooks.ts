import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import {
  createProperty,
  listProperties,
  setPropertyStatus,
  updateProperty,
} from "../../data/properties";
import { useSpreadsheetId } from "../../portfolio/context";
import type { Property, PropertyStatus } from "../../types";

export function useProperties() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.properties.list(),
    queryFn: () => listProperties(accessToken, spreadsheetId),
  });
}

export function useCreateProperty() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; address?: string }) =>
      createProperty(accessToken, spreadsheetId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.properties.all,
      });
    },
  });
}

export function useUpdateProperty() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (property: Property) =>
      updateProperty(accessToken, spreadsheetId, property),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.properties.all,
      });
    },
  });
}

export function useSetPropertyStatus() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      property,
      status,
    }: {
      property: Property;
      status: PropertyStatus;
    }) => setPropertyStatus(accessToken, spreadsheetId, property, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.properties.all,
      });
    },
  });
}
