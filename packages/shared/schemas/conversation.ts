import { z } from "zod";

export const CreateConversationSchema = z.object({
  projectId: z.number().int().nonnegative().optional(),
  role: z.string().min(1, "Required"),
  content: z.string().optional(),
  phase: z.string().min(1, "Required"),
  creditsUsed: z.number().int().optional(),
  metadata: z.string().optional(),
});

export const UpdateConversationSchema = z.object({
  projectId: z.number().int().nonnegative().optional(),
  role: z.string().min(1, "Required").optional(),
  content: z.string().optional(),
  phase: z.string().min(1, "Required").optional(),
  creditsUsed: z.number().int().optional(),
  metadata: z.string().optional(),
});

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type UpdateConversationInput = z.infer<typeof UpdateConversationSchema>;
