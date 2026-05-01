-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "birthDate" TEXT,
    "gender" TEXT,
    "address" TEXT,
    "positionApplied" TEXT,
    "employmentType" TEXT,
    "shiftAvailability" TEXT,
    "educationLevel" TEXT,
    "foreignLanguages" TEXT,
    "prevCompany" TEXT,
    "prevTitle" TEXT,
    "prevDuration" TEXT,
    "prevReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

