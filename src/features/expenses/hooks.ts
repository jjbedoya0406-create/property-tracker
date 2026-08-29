import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from "../../data/expenses";
import { updateProperty } from "../../data/properties";
import { createPropertyFolder, uploadReceiptImage } from "../../data/receipts";
import { useSpreadsheetId } from "../../portfolio/context";
import type { Building, Expense, Property } from "../../types";

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

// Building-scoped expenses (issue #7) — the Building tab's own shared
// bills, distinct from any unit's expenses.
export function useBuildingExpenses(buildingId: string) {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: () => listExpenses(accessToken, spreadsheetId),
    select: (expenses) =>
      expenses.filter((expense) => expense.buildingId === buildingId),
  });
}

// Exactly one of these is set — a unit-scoped expense (the common case)
// vs a building-scoped shared bill (issue #7). Kept as a discriminated
// union rather than an optional property/building pair so a caller can't
// accidentally supply both or neither.
type ExpenseTarget =
  | { scope: "unit"; property: Property }
  | { scope: "building"; building: Building };

interface CreateExpenseWithReceiptInput {
  target: ExpenseTarget;
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
        const folderId = await resolveTargetFolderId(
          accessToken,
          spreadsheetId,
          input.target,
        );
        receiptDriveUrl = await uploadReceiptImage(
          accessToken,
          input.photo,
          `${input.date}-${crypto.randomUUID()}`,
          folderId,
        );
      }

      return createExpense(accessToken, spreadsheetId, {
        propertyId:
          input.target.scope === "unit"
            ? input.target.property.propertyId
            : undefined,
        buildingId:
          input.target.scope === "building"
            ? input.target.building.buildingId
            : undefined,
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

export function useUpdateExpense() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: Expense) =>
      updateExpense(accessToken, spreadsheetId, expense),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}

export function useDeleteExpense() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) =>
      deleteExpense(accessToken, spreadsheetId, expenseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}

async function resolveTargetFolderId(
  accessToken: string,
  spreadsheetId: string,
  target: ExpenseTarget,
): Promise<string> {
  if (target.scope === "building") {
    // Buildings only ever come into existence already carrying a Drive
    // folder (see data/buildings.ts) — nothing to create lazily here.
    if (!target.building.driveFolderId) {
      throw new Error(`Building ${target.building.buildingId} has no Drive folder`);
    }
    return target.building.driveFolderId;
  }

  if (target.property.driveFolderId) {
    return target.property.driveFolderId;
  }
  // Property predates issue #2 (Organize Drive Storage) and has no folder
  // yet — create one now and persist it so future captures for this
  // property reuse it instead of creating a new one every time.
  const folderId = await createPropertyFolder(
    accessToken,
    target.property.name,
  );
  await updateProperty(accessToken, spreadsheetId, {
    ...target.property,
    driveFolderId: folderId,
  });
  return folderId;
}
