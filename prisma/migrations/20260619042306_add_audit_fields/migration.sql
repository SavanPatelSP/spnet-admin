-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT,
    "licenseId" TEXT,
    "organization" TEXT,
    "actorRole" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AuditLog" ("action", "actorEmail", "actorName", "actorRole", "createdAt", "description", "id", "licenseId", "organization") SELECT "action", "actorEmail", "actorName", "actorRole", "createdAt", "description", "id", "licenseId", "organization" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
