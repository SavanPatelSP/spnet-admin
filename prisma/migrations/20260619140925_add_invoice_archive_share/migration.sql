-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "licenseId" TEXT,
    "organization" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL DEFAULT 'SALE',
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "action" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lineItems" TEXT,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" DATETIME,
    "paidAt" DATETIME,
    "notes" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "targetName" TEXT,
    "targetId" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "shareToken" TEXT,
    "shareTokenExpiresAt" DATETIME,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("action", "actorEmail", "actorName", "category", "createdAt", "currency", "customerEmail", "customerName", "discount", "dueAt", "id", "invoiceNumber", "issuedAt", "licenseId", "lineItems", "notes", "organization", "paidAt", "relatedEntityId", "relatedEntityType", "status", "subtotal", "targetId", "targetName", "tax", "total", "type", "updatedAt") SELECT "action", "actorEmail", "actorName", "category", "createdAt", "currency", "customerEmail", "customerName", "discount", "dueAt", "id", "invoiceNumber", "issuedAt", "licenseId", "lineItems", "notes", "organization", "paidAt", "relatedEntityId", "relatedEntityType", "status", "subtotal", "targetId", "targetName", "tax", "total", "type", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX "Invoice_shareToken_key" ON "Invoice"("shareToken");
CREATE INDEX "Invoice_licenseId_idx" ON "Invoice"("licenseId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_category_idx" ON "Invoice"("category");
CREATE INDEX "Invoice_action_idx" ON "Invoice"("action");
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
