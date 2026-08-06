import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
