import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import {
  createProperty,
  listProperties,
  setPropertyStatus,
  updateProperty,
} from "../../data/properties";
import { createPropertyFolder, renamePropertyFolder } from "../../data/receipts";
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
    mutationFn: async (input: { name: string; address?: string }) => {
      // Every property gets its own Drive folder from creation onward
      // (issue #2 Story 1) — properties that predate this feature get one
      // lazily, on first receipt capture, instead.
      const driveFolderId = await createPropertyFolder(
        accessToken,
        input.name,
      );
      return createProperty(accessToken, spreadsheetId, {
        ...input,
        driveFolderId,
      });
    },
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
    mutationFn: async (property: Property) => {
      await updateProperty(accessToken, spreadsheetId, property);
      // Keeps the Drive folder name in sync with a rename (issue #2 Story
      // 3) — properties without a folder yet (predate this feature) have
      // nothing to rename until their folder is lazily created.
      if (property.driveFolderId) {
        await renamePropertyFolder(
          accessToken,
          property.driveFolderId,
          property.name,
        );
      }
    },
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
