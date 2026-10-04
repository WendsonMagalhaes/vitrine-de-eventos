import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "mínimo de 2 letras").max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  priceFrom: z.number().int().nonnegative().nullable().optional(), // centavos; null = sob consulta
  includes: z.array(z.string().trim().min(1).max(120)).max(15).default([]),
  // Foto do serviço, já enviada ao Cloudinary pelo painel ou pelo app. null remove a foto.
  imageUrl: z.string().url().startsWith("https://res.cloudinary.com/").nullable().optional(),
  imagePublicId: z.string().max(300).nullable().optional(),
});

const digits = z.string().regex(/^\d{10,13}$/, "use só números, com DDD (10 a 13 dígitos)").nullable().optional();
export const providerFields = {
  name: z.string().trim().min(2, "mínimo de 2 letras").max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  phone: digits, whatsapp: digits,
  categoryIds: z.array(z.string()).max(5, "no máximo 5 categorias").default([]),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).default("APPROVED"),
  featured: z.boolean().default(false),
};
