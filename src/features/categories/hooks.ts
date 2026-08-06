import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import {
  createCategory,
  listCategories,
  setCategoryStatus,
  updateCategory,
} from "../../data/categories";
import { useSpreadsheetId } from "../../portfolio/context";
import type { Category, CategoryStatus } from "../../types";

export function useCategories() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => listCategories(accessToken, spreadsheetId),
  });
}

export function useCreateCategory() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string }) =>
      createCategory(accessToken, spreadsheetId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}

// Also used for renaming — a category rename is just an update with a new
// name (Story 1.6), same pattern as useUpdateProperty.
export function useRenameCategory() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: Category) =>
      updateCategory(accessToken, spreadsheetId, category),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}

export function useSetCategoryStatus() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      category,
      status,
    }: {
      category: Category;
      status: CategoryStatus;
    }) => setCategoryStatus(accessToken, spreadsheetId, category, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}
