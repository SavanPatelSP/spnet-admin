/*
  Warnings:

  - You are about to drop the `SecurityPolicy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `activatedAt` on the `Activation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SecurityPolicy_role_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SecurityPolicy";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "licenseId" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenseId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activation_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Activation" ("deviceId", "deviceName", "id", "ipAddress", "licenseId") SELECT "deviceId", "deviceName", "id", "ipAddress", "licenseId" FROM "Activation";
DROP TABLE "Activation";
ALTER TABLE "new_Activation" RENAME TO "Activation";
CREATE TABLE "new_License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "maxDevices" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_License" ("createdAt", "expiresAt", "id", "key", "maxDevices", "notes", "organization", "plan", "status") SELECT "createdAt", "expiresAt", "id", "key", "maxDevices", "notes", "organization", "plan", "status" FROM "License";
DROP TABLE "License";
ALTER TABLE "new_License" RENAME TO "License";
CREATE UNIQUE INDEX "License_key_key" ON "License"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
