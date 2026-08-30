import { useExpenses, useExpensesForProperties } from "../expenses/hooks";
import { useBuildingExpenses } from "../expenses/hooks";
import { useIncome, useIncomeForProperties } from "../income/hooks";

// A standalone property, or one specific unit tab selected, scopes to
// just that unit — unchanged behavior from before issue #4. A
// multi-unit building's overview (no unit tab selected) scopes to every
// unit's income/expenses plus the building's own shared bills combined.
export type FinancialScope =
  | { kind: "unit"; propertyId: string }
  | { kind: "building"; buildingId: string; unitPropertyIds: string[] };

// React hooks must run unconditionally every render, so both branches
// below are always called — the inactive one is passed a harmless empty
// scope (an empty array/string matches nothing, no crash) and its result
// is simply discarded.
export function useScopedIncome(scope: FinancialScope) {
  const unit = useIncome(scope.kind === "unit" ? scope.propertyId : "");
  const building = useIncomeForProperties(
    scope.kind === "building" ? scope.unitPropertyIds : [],
  );
  return scope.kind === "unit" ? unit : building;
}

export function useScopedExpenses(scope: FinancialScope) {
  const unit = useExpenses(scope.kind === "unit" ? scope.propertyId : "");
  const buildingUnits = useExpensesForProperties(
    scope.kind === "building" ? scope.unitPropertyIds : [],
  );
  const buildingShared = useBuildingExpenses(
    scope.kind === "building" ? scope.buildingId : "",
  );

  if (scope.kind === "unit") {
    return unit;
  }

  return {
    data:
      buildingUnits.data && buildingShared.data
        ? [...buildingUnits.data, ...buildingShared.data]
        : undefined,
    isPending: buildingUnits.isPending || buildingShared.isPending,
    isError: buildingUnits.isError || buildingShared.isError,
    error: buildingUnits.error ?? buildingShared.error,
  };
}
