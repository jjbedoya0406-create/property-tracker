export type PropertyStatus = "active" | "archived";

export interface Property {
  propertyId: string;
  name: string;
  address?: string;
  status: PropertyStatus;
  createdAt: string;
}
