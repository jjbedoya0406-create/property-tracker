export interface Tenancy {
  tenancyId: string;
  propertyId: string;
  contractStart: string;
  // Optional — some contracts are open-ended (month-to-month).
  expectedEndDate?: string;
  // Captured separately from expectedEndDate: the gap between them (early
  // departure vs. overstay) is meaningful, not just "the lease ended".
  actualMoveOutDate?: string;
  // Per-tenancy, not per-property — rent can change between tenants, and
  // this way a property's rent history isn't lost when a new tenant signs.
  rentRate: number;
  createdAt: string;
}
