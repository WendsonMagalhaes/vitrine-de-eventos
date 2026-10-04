import { z } from "zod";

export const BANNER_COLORS = ["lilac", "mint", "peach", "sky"] as const;
export const bannerSchema = z.object({
  title: z.string().trim().min(2, "mínimo de 2 letras").max(80),
  subtitle: z.string().trim().max(140).nullable().optional(),
  imageUrl: z.string().trim().url("link inválido").startsWith("https://", "use um link https://").nullable().optional(),
  color: z.enum(BANNER_COLORS).default("lilac"),
  providerId: z.string().nullable().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});
