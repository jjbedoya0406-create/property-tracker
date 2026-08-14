import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequiredAccessToken } from "../../auth";
import { queryKeys } from "../../api/queryKeys";
import {
  addUnitToBuilding,
  listBuildings,
  promotePropertyToBuilding,
  type PromotePropertyToBuildingInput,
} from "../../data/buildings";
import { useSpreadsheetId } from "../../portfolio/context";
import type { Building } from "../../types";

export function useBuildings() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();

  return useQuery({
    queryKey: queryKeys.buildings.list(),
    queryFn: () => listBuildings(accessToken, spreadsheetId),
  });
}

// Both mutations invalidate properties (folder IDs / buildingId change or
// a new unit appears) and buildings (a new Buildings row, or none yet).
function useInvalidateAfterBuildingChange() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
  };
}

export function usePromotePropertyToBuilding() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const invalidate = useInvalidateAfterBuildingChange();

  return useMutation({
    mutationFn: (input: PromotePropertyToBuildingInput) =>
      promotePropertyToBuilding(accessToken, spreadsheetId, input),
    onSuccess: invalidate,
  });
}

export function useAddUnitToBuilding() {
  const accessToken = useRequiredAccessToken();
  const spreadsheetId = useSpreadsheetId();
  const invalidate = useInvalidateAfterBuildingChange();

  return useMutation({
    mutationFn: ({
      building,
      unitName,
    }: {
      building: Building;
      unitName: string;
    }) => addUnitToBuilding(accessToken, spreadsheetId, building, unitName),
    onSuccess: invalidate,
  });
}
