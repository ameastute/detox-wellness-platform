-- CreateEnum
CREATE TYPE "public"."PractitionerStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "public"."Practitioner" ADD COLUMN     "status" "public"."PractitionerStatus" NOT NULL DEFAULT 'ACTIVE';
