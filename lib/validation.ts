import { z } from "zod";
import { ValidationError } from "@/lib/security/errors";

export const emailSchema = z.string().email().max(255).transform(v => v.toLowerCase().trim());

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const licenseSchema = z.object({
  key: z.string().min(1).max(100),
  plan: z.string().min(1).max(50),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING", "EXPIRED", "REVOKED"]).optional(),
  expiresAt: z.coerce.date(),
  maxDevices: z.number().int().min(0).optional(),
  teamMemberId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const premiumGrantSchema = z.object({
  teamMemberId: z.string().min(1),
  plan: z.string().min(1),
  subscriptionType: z.enum(["MONTHLY", "YEARLY", "CUSTOM", "LIFETIME"]),
  durationDays: z.number().int().min(1).optional(),
  reason: z.string().max(500).optional(),
});

export const coinAdjustSchema = z.object({
  teamMemberId: z.string().min(1),
  amount: z.number().int().min(1),
  reason: z.string().max(500).optional(),
});

export const gemAdjustSchema = z.object({
  teamMemberId: z.string().min(1),
  amount: z.number().int().min(1),
  reason: z.string().max(500).optional(),
});

export const deviceActionSchema = z.object({
  deviceId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const teamMemberCreateSchema = z.object({
  email: emailSchema,
  name: z.string().min(1).max(255),
  roleId: z.string().min(1),
  licenseId: z.string().optional(),
});

export const roleCreateSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
});

export const sessionExtendSchema = z.object({
  sessionId: z.string().min(1),
  durationMinutes: z.number().int().min(1).max(1440),
});

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  return result.data;
}

export function validateBody<T>(schema: z.ZodSchema<T>, req: Request): Promise<T> {
  return req.json().then(body => validateOrThrow(schema, body));
}
