-- CreateEnum
CREATE TYPE "public"."ConsultationType" AS ENUM ('ONLINE', 'OFFLINE', 'BOTH');

-- CreateTable
CREATE TABLE "public"."Specialist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "experienceInYears" INTEGER NOT NULL,
    "philosophy" TEXT,
    "languages" TEXT[],
    "consultationType" "public"."ConsultationType" NOT NULL DEFAULT 'BOTH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialist_pkey" PRIMARY KEY ("id")
);
