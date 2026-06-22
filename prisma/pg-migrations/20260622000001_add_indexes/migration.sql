-- Add performance indexes for frequent query patterns

CREATE INDEX IF NOT EXISTS "License_expiresAt_idx" ON "License"("expiresAt");
CREATE INDEX IF NOT EXISTS "License_status_idx" ON "License"("status");
CREATE INDEX IF NOT EXISTS "License_organization_idx" ON "License"("organization");

CREATE INDEX IF NOT EXISTS "Session_teamMemberId_idx" ON "Session"("teamMemberId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"("token");
