-- Fix LoginHistory schema drift
-- 1. Add missing email column
-- 2. Make teamMemberId nullable (supports failed logins with no known member)

ALTER TABLE "LoginHistory" ADD COLUMN "email" TEXT;

ALTER TABLE "LoginHistory" ALTER COLUMN "teamMemberId" DROP NOT NULL;
