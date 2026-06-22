-- Add missing performance indexes for AuditLog and TeamMember

CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_actorEmail_idx" ON "AuditLog"("actorEmail");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_licenseId_idx" ON "AuditLog"("licenseId");

CREATE INDEX IF NOT EXISTS "TeamMember_roleId_idx" ON "TeamMember"("roleId");
CREATE INDEX IF NOT EXISTS "TeamMember_status_idx" ON "TeamMember"("status");

-- SupportTicket createdAt index for ticket listing queries
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");
