import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import { createExpense, listExpenses } from "../../data/expenses";
import { updateProperty } from "../../data/properties";
import { createPropertyFolder, uploadReceiptImage } from "../../data/receipts";
import { useSpreadsheetId } from "../../portfolio/context";
import type { Property } from "../../types";

// Single shared cache entry for the whole portfolio's expenses — Sheets has
// no server-side filter-by-column, so every consumer fetches the same full
// list and narrows it with `select` rather than each property triggering
// its own redundant fetch.
export function useExpenses(propertyId: string) {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: () => listExpenses(accessToken, spreadsheetId),
    select: (expenses) =>
      expenses.filter((expense) => expense.propertyId === propertyId),
  });
}

interface CreateExpenseWithReceiptInput {
  property: Property;
  amount: number;
  date: string;
  categoryId: string;
  notes?: string;
  photo: Blob | null;
}

export function useCreateExpenseWithReceipt() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseWithReceiptInput) => {
      let receiptDriveUrl: string | undefined;
      if (input.photo) {
        let folderId = input.property.driveFolderId;
        if (!folderId) {
          // Property predates issue #2 (Organize Drive Storage) and has no
          // folder yet — create one now and persist it so future captures
          // for this property reuse it instead of creating a new one
          // every time.
          folderId = await createPropertyFolder(
            accessToken,
            input.property.name,
          );
          await updateProperty(accessToken, spreadsheetId, {
            ...input.property,
            driveFolderId: folderId,
          });
        }
        receiptDriveUrl = await uploadReceiptImage(
          accessToken,
          input.photo,
          `${input.date}-${crypto.randomUUID()}`,
          folderId,
        );
      }

      return createExpense(accessToken, spreadsheetId, {
        propertyId: input.property.propertyId,
        amount: input.amount,
        date: input.date,
        categoryId: input.categoryId,
        notes: input.notes,
        receiptDriveUrl,
        source: input.photo ? "ocr" : "manual",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.properties.all,
      });
    },
  });
}
