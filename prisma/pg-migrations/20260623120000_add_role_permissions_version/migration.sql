-- Add permissionsVersion column to Role model for permission change tracking
ALTER TABLE "Role" ADD COLUMN "permissionsVersion" INTEGER NOT NULL DEFAULT 0;
