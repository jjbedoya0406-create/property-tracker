import { describe, expect, it } from "vitest";
import type { Building, Property } from "../../types";
import { groupPropertiesByBuilding } from "./groupByBuilding";

function makeProperty(overrides: Partial<Property> & { propertyId: string }): Property {
  return {
    name: overrides.propertyId,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeBuilding(overrides: Partial<Building> & { buildingId: string }): Building {
  return {
    name: overrides.buildingId,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("groupPropertiesByBuilding", () => {
  it("returns every property as standalone when none belong to a building", () => {
    const properties = [
      makeProperty({ propertyId: "p1" }),
      makeProperty({ propertyId: "p2" }),
    ];
    const result = groupPropertiesByBuilding(properties, []);
    expect(result).toEqual([
      { kind: "standalone", property: properties[0] },
      { kind: "standalone", property: properties[1] },
    ]);
  });

  it("groups siblings sharing a buildingId into one building item", () => {
    const building = makeBuilding({ buildingId: "b1", name: "Georgetown duplex" });
    const unit1 = makeProperty({ propertyId: "u1", buildingId: "b1" });
    const unit2 = makeProperty({ propertyId: "u2", buildingId: "b1" });
    const result = groupPropertiesByBuilding([unit1, unit2], [building]);
    expect(result).toEqual([
      { kind: "building", building, units: [unit1, unit2] },
    ]);
  });

  it("preserves list order, emitting a building at its first unit's position", () => {
    const building = makeBuilding({ buildingId: "b1" });
    const standalone = makeProperty({ propertyId: "solo" });
    const unit1 = makeProperty({ propertyId: "u1", buildingId: "b1" });
    const unit2 = makeProperty({ propertyId: "u2", buildingId: "b1" });
    const result = groupPropertiesByBuilding(
      [unit1, standalone, unit2],
      [building],
    );
    expect(result).toEqual([
      { kind: "building", building, units: [unit1, unit2] },
      { kind: "standalone", property: standalone },
    ]);
  });

  it("falls back to standalone when only one unit of a building survives filtering", () => {
    const building = makeBuilding({ buildingId: "b1" });
    const unit1 = makeProperty({ propertyId: "u1", buildingId: "b1" });
    const result = groupPropertiesByBuilding([unit1], [building]);
    expect(result).toEqual([{ kind: "standalone", property: unit1 }]);
  });

  it("falls back to standalone units when the building record is missing", () => {
    const unit1 = makeProperty({ propertyId: "u1", buildingId: "missing" });
    const unit2 = makeProperty({ propertyId: "u2", buildingId: "missing" });
    const result = groupPropertiesByBuilding([unit1, unit2], []);
    expect(result).toEqual([
      { kind: "standalone", property: unit1 },
      { kind: "standalone", property: unit2 },
    ]);
  });
});
