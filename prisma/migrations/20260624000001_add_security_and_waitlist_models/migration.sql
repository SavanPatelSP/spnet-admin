-- AlterTable
ALTER TABLE "Session" ADD COLUMN "lastOverrideAt" DATETIME;
ALTER TABLE "Session" ADD COLUMN "overrideCooldownMinutes" INTEGER;
ALTER TABLE "Session" ADD COLUMN "overrideDurationMinutes" INTEGER;
-- CreateTable
CREATE TABLE "SessionFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "country" TEXT,
    "countryName" TEXT,
    "region" TEXT,
    "city" TEXT,
    "isp" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "browser" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "deviceType" TEXT,
    "deviceId" TEXT,
    "userAgent" TEXT,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "riskScore" TEXT NOT NULL DEFAULT 'LOW',
    "riskFactors" TEXT,
    "isNewDevice" BOOLEAN NOT NULL DEFAULT false,
    "isNewBrowser" BOOLEAN NOT NULL DEFAULT false,
    "isNewCountry" BOOLEAN NOT NULL DEFAULT false,
    "isNewRegion" BOOLEAN NOT NULL DEFAULT false,
    "ipChanged" BOOLEAN NOT NULL DEFAULT false,
    "deviceChanged" BOOLEAN NOT NULL DEFAULT false,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SessionFingerprint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reason" TEXT,
    "metadata" TEXT,
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT,
    "requesterEmail" TEXT,
    "approverId" TEXT,
    "approverName" TEXT,
    "approverEmail" TEXT,
    "approvalNote" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "executedAt" DATETIME,
    "expiresAt" DATETIME,
    "auditId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- CreateTable
CREATE TABLE "TemporaryPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "permission" TEXT NOT NULL,
    "roleId" TEXT,
    "teamMemberId" TEXT,
    "grantedById" TEXT,
    "grantedByName" TEXT,
    "grantedByEmail" TEXT,
    "duration" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" DATETIME,
    "revokedById" TEXT,
    "auditLogId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemporaryPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TemporaryPermission_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "AuditChainLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditLogId" TEXT NOT NULL,
    "auditHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "chainIndex" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "timestamp" DATETIME NOT NULL,
    "integrityStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "referralCode" TEXT,
    "interestCategory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "position" INTEGER NOT NULL,
    "inviteSentAt" DATETIME,
    "invitedBy" TEXT,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "convertedAt" DATETIME,
    "convertedUserId" TEXT,
    "ownReferralCode" TEXT NOT NULL,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "referralRank" INTEGER NOT NULL DEFAULT 0,
    "referralConversionRate" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- CreateTable
CREATE TABLE "WaitlistInviteCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "expiresAt" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamMemberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoginHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamMemberId" TEXT,
    "email" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginHistory_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LoginHistory" ("createdAt", "failureReason", "id", "ipAddress", "success", "teamMemberId", "userAgent") SELECT "createdAt", "failureReason", "id", "ipAddress", "success", "teamMemberId", "userAgent" FROM "LoginHistory";
DROP TABLE "LoginHistory";
ALTER TABLE "new_LoginHistory" RENAME TO "LoginHistory";
CREATE INDEX "LoginHistory_teamMemberId_idx" ON "LoginHistory"("teamMemberId");
CREATE INDEX "LoginHistory_createdAt_idx" ON "LoginHistory"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
-- CreateIndex
CREATE UNIQUE INDEX "SessionFingerprint_sessionId_key" ON "SessionFingerprint"("sessionId");
-- CreateIndex
CREATE INDEX "SessionFingerprint_sessionId_idx" ON "SessionFingerprint"("sessionId");
-- CreateIndex
CREATE INDEX "SessionFingerprint_deviceId_idx" ON "SessionFingerprint"("deviceId");
-- CreateIndex
CREATE INDEX "SessionFingerprint_riskScore_idx" ON "SessionFingerprint"("riskScore");
-- CreateIndex
CREATE INDEX "SessionFingerprint_suspicious_idx" ON "SessionFingerprint"("suspicious");
-- CreateIndex
CREATE INDEX "SessionFingerprint_country_idx" ON "SessionFingerprint"("country");
-- CreateIndex
CREATE INDEX "SessionFingerprint_createdAt_idx" ON "SessionFingerprint"("createdAt");
-- CreateIndex
CREATE INDEX "SecurityAlert_type_idx" ON "SecurityAlert"("type");
-- CreateIndex
CREATE INDEX "SecurityAlert_severity_idx" ON "SecurityAlert"("severity");
-- CreateIndex
CREATE INDEX "SecurityAlert_resolved_idx" ON "SecurityAlert"("resolved");
-- CreateIndex
CREATE INDEX "SecurityAlert_createdAt_idx" ON "SecurityAlert"("createdAt");
-- CreateIndex
CREATE INDEX "SecurityAlert_entityType_entityId_idx" ON "SecurityAlert"("entityType", "entityId");
-- CreateIndex
CREATE INDEX "SecurityAlert_severity_createdAt_idx" ON "SecurityAlert"("severity", "createdAt");
-- CreateIndex
CREATE INDEX "SecurityAlert_type_createdAt_idx" ON "SecurityAlert"("type", "createdAt");
-- CreateIndex
CREATE INDEX "ApprovalRequest_workflowType_idx" ON "ApprovalRequest"("workflowType");
-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");
-- CreateIndex
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");
-- CreateIndex
CREATE INDEX "ApprovalRequest_approverId_idx" ON "ApprovalRequest"("approverId");
-- CreateIndex
CREATE INDEX "ApprovalRequest_status_workflowType_idx" ON "ApprovalRequest"("status", "workflowType");
-- CreateIndex
CREATE INDEX "ApprovalRequest_status_createdAt_idx" ON "ApprovalRequest"("status", "createdAt");
-- CreateIndex
CREATE INDEX "ApprovalRequest_requesterId_status_idx" ON "ApprovalRequest"("requesterId", "status");
-- CreateIndex
CREATE INDEX "ApprovalRequest_createdAt_idx" ON "ApprovalRequest"("createdAt");
-- CreateIndex
CREATE INDEX "TemporaryPermission_teamMemberId_active_idx" ON "TemporaryPermission"("teamMemberId", "active");
-- CreateIndex
CREATE INDEX "TemporaryPermission_roleId_active_idx" ON "TemporaryPermission"("roleId", "active");
-- CreateIndex
CREATE INDEX "TemporaryPermission_expiresAt_idx" ON "TemporaryPermission"("expiresAt");
-- CreateIndex
CREATE INDEX "TemporaryPermission_permission_idx" ON "TemporaryPermission"("permission");
-- CreateIndex
CREATE INDEX "TemporaryPermission_active_expiresAt_idx" ON "TemporaryPermission"("active", "expiresAt");
-- CreateIndex
CREATE UNIQUE INDEX "AuditChainLink_auditLogId_key" ON "AuditChainLink"("auditLogId");
-- CreateIndex
CREATE UNIQUE INDEX "AuditChainLink_auditHash_key" ON "AuditChainLink"("auditHash");
-- CreateIndex
CREATE INDEX "AuditChainLink_auditLogId_idx" ON "AuditChainLink"("auditLogId");
-- CreateIndex
CREATE INDEX "AuditChainLink_auditHash_idx" ON "AuditChainLink"("auditHash");
-- CreateIndex
CREATE INDEX "AuditChainLink_previousHash_idx" ON "AuditChainLink"("previousHash");
-- CreateIndex
CREATE INDEX "AuditChainLink_chainIndex_idx" ON "AuditChainLink"("chainIndex");
-- CreateIndex
CREATE INDEX "AuditChainLink_integrityStatus_idx" ON "AuditChainLink"("integrityStatus");
-- CreateIndex
CREATE INDEX "AuditChainLink_chainIndex_integrityStatus_idx" ON "AuditChainLink"("chainIndex", "integrityStatus");
-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");
-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_position_key" ON "WaitlistEntry"("position");
-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_ownReferralCode_key" ON "WaitlistEntry"("ownReferralCode");
-- CreateIndex
CREATE INDEX "WaitlistEntry_email_idx" ON "WaitlistEntry"("email");
-- CreateIndex
CREATE INDEX "WaitlistEntry_status_idx" ON "WaitlistEntry"("status");
-- CreateIndex
CREATE INDEX "WaitlistEntry_position_idx" ON "WaitlistEntry"("position");
-- CreateIndex
CREATE INDEX "WaitlistEntry_referralCode_idx" ON "WaitlistEntry"("referralCode");
-- CreateIndex
CREATE INDEX "WaitlistEntry_ownReferralCode_idx" ON "WaitlistEntry"("ownReferralCode");
-- CreateIndex
CREATE INDEX "WaitlistEntry_status_position_idx" ON "WaitlistEntry"("status", "position");
-- CreateIndex
CREATE INDEX "WaitlistEntry_referralCount_referralRank_idx" ON "WaitlistEntry"("referralCount", "referralRank");
-- CreateIndex
CREATE INDEX "WaitlistEntry_createdAt_idx" ON "WaitlistEntry"("createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "WaitlistInviteCode_code_key" ON "WaitlistInviteCode"("code");
-- CreateIndex
CREATE INDEX "WaitlistInviteCode_code_idx" ON "WaitlistInviteCode"("code");
-- CreateIndex
CREATE INDEX "WaitlistInviteCode_active_expiresAt_idx" ON "WaitlistInviteCode"("active", "expiresAt");
-- CreateIndex
CREATE INDEX "Notification_teamMemberId_read_idx" ON "Notification"("teamMemberId", "read");
-- CreateIndex
CREATE INDEX "Notification_teamMemberId_createdAt_idx" ON "Notification"("teamMemberId", "createdAt");
-- CreateIndex
CREATE INDEX "Activation_licenseId_idx" ON "Activation"("licenseId");
-- CreateIndex
CREATE INDEX "Activation_deviceId_idx" ON "Activation"("deviceId");
-- CreateIndex
CREATE INDEX "Activation_status_idx" ON "Activation"("status");
-- CreateIndex
CREATE INDEX "Activation_trustScore_idx" ON "Activation"("trustScore");
-- CreateIndex
CREATE INDEX "Activation_deviceFingerprintId_idx" ON "Activation"("deviceFingerprintId");
-- CreateIndex
CREATE INDEX "Activation_licenseId_status_idx" ON "Activation"("licenseId", "status");
-- CreateIndex
CREATE INDEX "Activation_deviceId_status_idx" ON "Activation"("deviceId", "status");
-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
-- CreateIndex
CREATE INDEX "AuditLog_actorEmail_idx" ON "AuditLog"("actorEmail");
-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
-- CreateIndex
CREATE INDEX "AuditLog_licenseId_idx" ON "AuditLog"("licenseId");
-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
-- CreateIndex
CREATE INDEX "AuditLog_actorEmail_createdAt_idx" ON "AuditLog"("actorEmail", "createdAt");
-- CreateIndex
CREATE INDEX "AuditLog_licenseId_createdAt_idx" ON "AuditLog"("licenseId", "createdAt");
-- CreateIndex
CREATE INDEX "AuditLog_severity_createdAt_idx" ON "AuditLog"("severity", "createdAt");
-- CreateIndex
CREATE INDEX "CoinTransaction_licenseId_idx" ON "CoinTransaction"("licenseId");
-- CreateIndex
CREATE INDEX "CoinTransaction_licenseId_createdAt_idx" ON "CoinTransaction"("licenseId", "createdAt");
-- CreateIndex
CREATE INDEX "CoinTransaction_type_idx" ON "CoinTransaction"("type");
-- CreateIndex
CREATE INDEX "CoinTransaction_createdAt_idx" ON "CoinTransaction"("createdAt");
-- CreateIndex
CREATE INDEX "GemTransaction_licenseId_idx" ON "GemTransaction"("licenseId");
-- CreateIndex
CREATE INDEX "GemTransaction_licenseId_createdAt_idx" ON "GemTransaction"("licenseId", "createdAt");
-- CreateIndex
CREATE INDEX "GemTransaction_type_idx" ON "GemTransaction"("type");
-- CreateIndex
CREATE INDEX "GemTransaction_rewardId_idx" ON "GemTransaction"("rewardId");
-- CreateIndex
CREATE INDEX "GemTransaction_createdAt_idx" ON "GemTransaction"("createdAt");
-- CreateIndex
CREATE INDEX "Invoice_status_issuedAt_idx" ON "Invoice"("status", "issuedAt");
-- CreateIndex
CREATE INDEX "Invoice_organization_status_idx" ON "Invoice"("organization", "status");
-- CreateIndex
CREATE INDEX "Invoice_category_status_idx" ON "Invoice"("category", "status");
-- CreateIndex
CREATE INDEX "License_expiresAt_idx" ON "License"("expiresAt");
-- CreateIndex
CREATE INDEX "License_status_idx" ON "License"("status");
-- CreateIndex
CREATE INDEX "License_organization_idx" ON "License"("organization");
-- CreateIndex
CREATE INDEX "License_plan_idx" ON "License"("plan");
-- CreateIndex
CREATE INDEX "License_status_expiresAt_idx" ON "License"("status", "expiresAt");
-- CreateIndex
CREATE INDEX "License_organization_plan_idx" ON "License"("organization", "plan");
-- CreateIndex
CREATE INDEX "License_plan_status_idx" ON "License"("plan", "status");
-- CreateIndex
CREATE INDEX "LicenseEvent_licenseId_idx" ON "LicenseEvent"("licenseId");
-- CreateIndex
CREATE INDEX "LicenseEvent_licenseId_createdAt_idx" ON "LicenseEvent"("licenseId", "createdAt");
-- CreateIndex
CREATE INDEX "LicenseEvent_type_idx" ON "LicenseEvent"("type");
-- CreateIndex
CREATE INDEX "LicenseEvent_createdAt_idx" ON "LicenseEvent"("createdAt");
-- CreateIndex
CREATE INDEX "Permission_roleId_idx" ON "Permission"("roleId");
-- CreateIndex
CREATE INDEX "Permission_permission_idx" ON "Permission"("permission");
-- CreateIndex
CREATE INDEX "Permission_roleId_permission_idx" ON "Permission"("roleId", "permission");
-- CreateIndex
CREATE INDEX "PremiumRequest_licenseId_idx" ON "PremiumRequest"("licenseId");
-- CreateIndex
CREATE INDEX "PremiumRequest_status_idx" ON "PremiumRequest"("status");
-- CreateIndex
CREATE INDEX "PremiumRequest_status_createdAt_idx" ON "PremiumRequest"("status", "createdAt");
-- CreateIndex
CREATE INDEX "PremiumSubscription_licenseId_idx" ON "PremiumSubscription"("licenseId");
-- CreateIndex
CREATE INDEX "PremiumSubscription_endDate_idx" ON "PremiumSubscription"("endDate");
-- CreateIndex
CREATE INDEX "PremiumSubscription_plan_idx" ON "PremiumSubscription"("plan");
-- CreateIndex
CREATE INDEX "PremiumSubscription_licenseId_endDate_idx" ON "PremiumSubscription"("licenseId", "endDate");
-- CreateIndex
CREATE INDEX "PremiumSubscription_action_endDate_idx" ON "PremiumSubscription"("action", "endDate");
-- CreateIndex
CREATE INDEX "Promotion_productType_idx" ON "Promotion"("productType");
-- CreateIndex
CREATE INDEX "Promotion_active_idx" ON "Promotion"("active");
-- CreateIndex
CREATE INDEX "Promotion_active_endDate_idx" ON "Promotion"("active", "endDate");
-- CreateIndex
CREATE INDEX "Promotion_appliesTo_idx" ON "Promotion"("appliesTo");
-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
-- CreateIndex
CREATE INDEX "Session_teamMemberId_idx" ON "Session"("teamMemberId");
-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
-- CreateIndex
CREATE INDEX "Session_teamMemberId_expiresAt_idx" ON "Session"("teamMemberId", "expiresAt");
-- CreateIndex
CREATE INDEX "Session_token_expiresAt_idx" ON "Session"("token", "expiresAt");
-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");
-- CreateIndex
CREATE INDEX "SupportTicket_assignedTo_idx" ON "SupportTicket"("assignedTo");
-- CreateIndex
CREATE INDEX "SupportTicket_licenseId_idx" ON "SupportTicket"("licenseId");
-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");
-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");
-- CreateIndex
CREATE INDEX "TeamMember_roleId_idx" ON "TeamMember"("roleId");
-- CreateIndex
CREATE INDEX "TeamMember_status_idx" ON "TeamMember"("status");
-- CreateIndex
CREATE INDEX "TeamMember_email_idx" ON "TeamMember"("email");
-- CreateIndex
CREATE INDEX "TeamMember_status_roleId_idx" ON "TeamMember"("status", "roleId");
-- CreateIndex
CREATE INDEX "TeamMember_licenseId_idx" ON "TeamMember"("licenseId");
