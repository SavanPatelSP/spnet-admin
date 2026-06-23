-- Add missing indexes to Activation table (most-queried model without indexes)
CREATE INDEX IF NOT EXISTS "Activation_deviceId_idx" ON "Activation"("deviceId");
CREATE INDEX IF NOT EXISTS "Activation_licenseId_idx" ON "Activation"("licenseId");
CREATE INDEX IF NOT EXISTS "Activation_status_idx" ON "Activation"("status");
CREATE INDEX IF NOT EXISTS "Activation_licenseId_status_idx" ON "Activation"("licenseId", "status");

-- Add missing indexes to Permission table (queried on every auth check)
CREATE INDEX IF NOT EXISTS "Permission_roleId_idx" ON "Permission"("roleId");
CREATE INDEX IF NOT EXISTS "Permission_roleId_permission_idx" ON "Permission"("roleId", "permission");
