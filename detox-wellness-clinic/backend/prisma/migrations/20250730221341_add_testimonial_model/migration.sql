-- CreateTable
CREATE TABLE "public"."Testimonial" (
    "id" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "beforeImage" TEXT,
    "afterImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);
