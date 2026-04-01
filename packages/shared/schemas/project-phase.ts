import { z } from "zod";

export const CreateProjectPhaseSchema = z.object({
  projectId: z.number().int().nonnegative().optional(),
  phaseNumber: z.number().int().optional(),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  status: z.string().min(1, "Required"),
  tasks: z.string().optional(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

export const UpdateProjectPhaseSchema = z.object({
  projectId: z.number().int().nonnegative().optional(),
  phaseNumber: z.number().int().optional(),
  title: z.string().min(1, "Required").optional(),
  description: z.string().optional(),
  status: z.string().min(1, "Required").optional(),
  tasks: z.string().optional(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

export type CreateProjectPhaseInput = z.infer<typeof CreateProjectPhaseSchema>;
export type UpdateProjectPhaseInput = z.infer<typeof UpdateProjectPhaseSchema>;
