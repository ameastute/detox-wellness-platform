/*
  Warnings:

  - You are about to drop the column `specialistId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the `Specialist` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[title]` on the table `Service` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `therapistId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_specialistId_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" DROP COLUMN "specialistId",
ADD COLUMN     "therapistId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Specialist";

-- CreateTable
CREATE TABLE "public"."Therapist" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "Therapist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_TherapistServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TherapistServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Therapist_email_key" ON "public"."Therapist"("email");

-- CreateIndex
CREATE INDEX "_TherapistServices_B_index" ON "public"."_TherapistServices"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Service_title_key" ON "public"."Service"("title");

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."Therapist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TherapistServices" ADD CONSTRAINT "_TherapistServices_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TherapistServices" ADD CONSTRAINT "_TherapistServices_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
