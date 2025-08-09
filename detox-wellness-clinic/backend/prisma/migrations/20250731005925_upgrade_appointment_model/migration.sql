-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "medicalReportUrl" TEXT,
ADD COLUMN     "residentialMonth" TEXT,
ADD COLUMN     "residentialYear" TEXT,
ADD COLUMN     "sessionDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[];
