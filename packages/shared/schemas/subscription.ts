import { z } from "zod";

export const CreateSubscriptionSchema = z.object({
  userId: z.number().int().nonnegative().optional(),
  stripeSubscriptionId: z.string().min(1, "Required"),
  stripePriceId: z.string().min(1, "Required"),
  status: z.string().min(1, "Required"),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export const UpdateSubscriptionSchema = z.object({
  userId: z.number().int().nonnegative().optional(),
  stripeSubscriptionId: z.string().min(1, "Required").optional(),
  stripePriceId: z.string().min(1, "Required").optional(),
  status: z.string().min(1, "Required").optional(),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;
