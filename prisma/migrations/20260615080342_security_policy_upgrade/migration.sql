-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SecurityPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "systemManaged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SecurityPolicy" ("createdAt", "description", "enabled", "id", "name", "updatedAt") SELECT "createdAt", "description", "enabled", "id", "name", "updatedAt" FROM "SecurityPolicy";
DROP TABLE "SecurityPolicy";
ALTER TABLE "new_SecurityPolicy" RENAME TO "SecurityPolicy";
CREATE UNIQUE INDEX "SecurityPolicy_name_key" ON "SecurityPolicy"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
