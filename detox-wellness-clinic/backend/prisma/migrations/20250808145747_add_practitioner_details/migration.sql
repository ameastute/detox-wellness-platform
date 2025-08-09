/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Practitioner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contactPrimary` to the `Practitioner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Practitioner` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PractitionerRole" AS ENUM ('DOCTOR', 'THERAPIST', 'COUNSELOR', 'CONSULTANT');

-- AlterTable
ALTER TABLE "public"."Practitioner" ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "contactPrimary" TEXT NOT NULL,
ADD COLUMN     "contactSecondary" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "role" "public"."PractitionerRole" NOT NULL DEFAULT 'THERAPIST',
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Practitioner_slug_key" ON "public"."Practitioner"("slug");
