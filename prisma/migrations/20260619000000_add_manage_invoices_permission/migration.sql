-- Add Manage Invoices permission to billing-related roles if missing
INSERT INTO "Permission" ("id", "roleId", "permission", "createdAt")
SELECT lower(hex(randomblob(16))), "Role"."id", 'Manage Invoices', datetime('now')
FROM "Role"
WHERE "Role"."name" IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'BILLING_MANAGER')
  AND NOT EXISTS (
    SELECT 1 FROM "Permission" p2
    WHERE p2."roleId" = "Role"."id"
      AND p2."permission" = 'Manage Invoices'
  );
