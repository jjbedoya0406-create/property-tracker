import { z } from "zod";

// Name required, address optional — per PRD §7 (Story 1.2/1.3).
export const propertyInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  address: z.string().trim().optional(),
});

export type PropertyInput = z.infer<typeof propertyInputSchema>;
