-- CreateTable
CREATE TABLE "SessionFingerprint" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "country" TEXT,
    "countryName" TEXT,
    "region" TEXT,
    "city" TEXT,
    "isp" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "browser" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "deviceType" TEXT,
    "deviceId" TEXT,
    "userAgent" TEXT,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL,
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
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
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
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "auditId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemporaryPermission" (
    "id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "roleId" TEXT,
    "teamMemberId" TEXT,
    "grantedById" TEXT,
    "grantedByName" TEXT,
    "grantedByEmail" TEXT,
    "duration" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "auditLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemporaryPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditChainLink" (
    "id" TEXT NOT NULL,
    "auditLogId" TEXT NOT NULL,
    "auditHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "chainIndex" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "integrityStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditChainLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "referralCode" TEXT,
    "interestCategory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "position" INTEGER NOT NULL,
    "inviteSentAt" TIMESTAMP(3),
    "invitedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "convertedAt" TIMESTAMP(3),
    "convertedUserId" TEXT,
    "ownReferralCode" TEXT NOT NULL,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "referralRank" INTEGER NOT NULL DEFAULT 0,
    "referralConversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistInviteCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistInviteCode_pkey" PRIMARY KEY ("id")
);

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

-- AddForeignKey
ALTER TABLE "SessionFingerprint" ADD CONSTRAINT "SessionFingerprint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryPermission" ADD CONSTRAINT "TemporaryPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryPermission" ADD CONSTRAINT "TemporaryPermission_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
