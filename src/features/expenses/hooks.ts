import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import { createExpense, listExpenses } from "../../data/expenses";
import { uploadReceiptImage } from "../../data/receipts";
import { useSpreadsheetId } from "../../portfolio/context";
import type { Category } from "../../types";

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
  propertyId: string;
  vendor: string;
  amount: number;
  date: string;
  category: Category;
  photo: Blob | null;
}

export function useCreateExpenseWithReceipt() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseWithReceiptInput) => {
      const receiptDriveUrl = input.photo
        ? await uploadReceiptImage(
            accessToken,
            input.photo,
            `${input.date}-${input.vendor}-${crypto.randomUUID()}`,
          )
        : undefined;

      return createExpense(accessToken, spreadsheetId, {
        propertyId: input.propertyId,
        vendor: input.vendor,
        amount: input.amount,
        date: input.date,
        category: input.category,
        receiptDriveUrl,
        source: input.photo ? "ocr" : "manual",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}
