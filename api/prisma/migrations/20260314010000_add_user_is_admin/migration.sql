-- AlterTable
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Set default admins: users with "aleksa" in their email
UPDATE "User" SET "isAdmin" = true WHERE email ILIKE '%aleksa%';
