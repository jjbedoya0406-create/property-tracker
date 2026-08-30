import type { Building, Property } from "../../types";

export type PropertyListItem =
  | { kind: "standalone"; property: Property }
  | { kind: "building"; building: Building; units: Property[] };

// Pure display-grouping for the Properties list (issue #12), same spirit
// as groupByYear.ts from issue #11. Walks `properties` in order so a
// building's position in the list matches where its first unit would
// have appeared in the old flat list, rather than sorting buildings to
// the end. A buildingId left with fewer than 2 surviving units (e.g. a
// sibling was archived and the list is filtered to Active) falls back to
// standalone — matches PropertyDetailPage's own isMultiUnit convention.
export function groupPropertiesByBuilding(
  properties: Property[],
  buildings: Building[],
): PropertyListItem[] {
  const items: PropertyListItem[] = [];
  const seenBuildingIds = new Set<string>();

  for (const property of properties) {
    if (!property.buildingId) {
      items.push({ kind: "standalone", property });
      continue;
    }
    if (seenBuildingIds.has(property.buildingId)) {
      continue;
    }
    seenBuildingIds.add(property.buildingId);

    const units = properties.filter(
      (p) => p.buildingId === property.buildingId,
    );
    if (units.length < 2) {
      items.push({ kind: "standalone", property });
      continue;
    }

    const building = buildings.find(
      (b) => b.buildingId === property.buildingId,
    );
    if (!building) {
      // Defensive — the Buildings row is missing or hasn't loaded yet.
      // Don't drop the units from the list while that resolves.
      for (const unit of units) {
        items.push({ kind: "standalone", property: unit });
      }
      continue;
    }

    items.push({ kind: "building", building, units });
  }

  return items;
}
