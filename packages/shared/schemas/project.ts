import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Required"),
  slug: z.string().min(1, "Required"),
  type: z.string().min(1, "Required"),
  status: z.string().min(1, "Required"),
  description: z.string().optional(),
  techStack: z.string().optional(),
  githubRepoUrl: z.string().min(1, "Required"),
  githubRepoName: z.string().min(1, "Required"),
  subdomain: z.string().min(1, "Required"),
  customDomain: z.string().min(1, "Required"),
  orbitaAppId: z.string().min(1, "Required"),
  userId: z.number().int().nonnegative().optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1, "Required").optional(),
  slug: z.string().min(1, "Required").optional(),
  type: z.string().min(1, "Required").optional(),
  status: z.string().min(1, "Required").optional(),
  description: z.string().optional(),
  techStack: z.string().optional(),
  githubRepoUrl: z.string().min(1, "Required").optional(),
  githubRepoName: z.string().min(1, "Required").optional(),
  subdomain: z.string().min(1, "Required").optional(),
  customDomain: z.string().min(1, "Required").optional(),
  orbitaAppId: z.string().min(1, "Required").optional(),
  userId: z.number().int().nonnegative().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
