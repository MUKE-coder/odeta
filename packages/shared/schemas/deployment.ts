import { z } from "zod";

export const CreateDeploymentSchema = z.object({
  projectId: z.number().int().nonnegative().optional(),
  status: z.string().min(1, "Required"),
  subdomain: z.string().min(1, "Required"),
  logs: z.string().optional(),
  deployedAt: z.string().nullable(),
});

export const UpdateDeploymentSchema = z.object({
  projectId: z.number().int().nonnegative().optional(),
  status: z.string().min(1, "Required").optional(),
  subdomain: z.string().min(1, "Required").optional(),
  logs: z.string().optional(),
  deployedAt: z.string().nullable(),
});

export type CreateDeploymentInput = z.infer<typeof CreateDeploymentSchema>;
export type UpdateDeploymentInput = z.infer<typeof UpdateDeploymentSchema>;
