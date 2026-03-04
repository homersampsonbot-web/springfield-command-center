-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('INTAKE', 'QUEUED', 'RUNNING', 'BLOCKED', 'REVIEW', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "Owner" AS ENUM ('HOMER', 'BART', 'LISA', 'MARGE', 'MAGGIE', 'MIXED');

-- CreateEnum
CREATE TYPE "Risk" AS ENUM ('LOW', 'MED', 'HIGH');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'INTAKE',
    "owner" "Owner" NOT NULL DEFAULT 'MAGGIE',
    "risk" "Risk" NOT NULL DEFAULT 'LOW',
    "labels" TEXT[],
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    "links" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEventAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobEvent" ADD CONSTRAINT "JobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
