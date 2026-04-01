import { z } from "zod";

export const CreateCreditLogSchema = z.object({
  userId: z.number().int().nonnegative().optional(),
  amount: z.number().int().optional(),
  type: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  projectId: z.number().int().nonnegative().optional(),
});

export const UpdateCreditLogSchema = z.object({
  userId: z.number().int().nonnegative().optional(),
  amount: z.number().int().optional(),
  type: z.string().min(1, "Required").optional(),
  description: z.string().min(1, "Required").optional(),
  projectId: z.number().int().nonnegative().optional(),
});

export type CreateCreditLogInput = z.infer<typeof CreateCreditLogSchema>;
export type UpdateCreditLogInput = z.infer<typeof UpdateCreditLogSchema>;
