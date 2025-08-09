/*
  Warnings:

  - You are about to drop the column `therapistId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the `Therapist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TherapistServices` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `practitionerId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Title" AS ENUM ('MR', 'MRS', 'DR');

-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_TherapistServices" DROP CONSTRAINT "_TherapistServices_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_TherapistServices" DROP CONSTRAINT "_TherapistServices_B_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" DROP COLUMN "therapistId",
ADD COLUMN     "practitionerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Therapist";

-- DropTable
DROP TABLE "public"."_TherapistServices";

-- CreateTable
CREATE TABLE "public"."Practitioner" (
    "id" TEXT NOT NULL,
    "title" "public"."Title" NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT,
    "experienceInYears" INTEGER NOT NULL,
    "languages" TEXT[],
    "consultationType" "public"."ConsultationType" NOT NULL DEFAULT 'BOTH',
    "philosophy" TEXT,
    "availability" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Practitioner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_PractitionerServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PractitionerServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Practitioner_email_key" ON "public"."Practitioner"("email");

-- CreateIndex
CREATE INDEX "_PractitionerServices_B_index" ON "public"."_PractitionerServices"("B");

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "public"."Practitioner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PractitionerServices" ADD CONSTRAINT "_PractitionerServices_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Practitioner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PractitionerServices" ADD CONSTRAINT "_PractitionerServices_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
