/*
  Warnings:

  - You are about to drop the column `email` on the `Submission` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" DATETIME,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Submission" ("address", "birthDate", "consent", "consentAt", "createdAt", "educationLevel", "employmentType", "foreignLanguages", "fullName", "gender", "id", "message", "phone", "positionApplied", "prevCompany", "prevDuration", "prevReason", "prevTitle", "shiftAvailability", "subject") SELECT "address", "birthDate", "consent", "consentAt", "createdAt", "educationLevel", "employmentType", "foreignLanguages", "fullName", "gender", "id", "message", "phone", "positionApplied", "prevCompany", "prevDuration", "prevReason", "prevTitle", "shiftAvailability", "subject" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
