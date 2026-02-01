-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('Informatics', 'Mathematics', 'Physics', 'Chemistry');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert');

-- CreateEnum
CREATE TYPE "ValidationMode" AS ENUM ('Strict', 'Flexible', 'OpenEnded', 'AIValidation');

-- CreateEnum
CREATE TYPE "ValidationType" AS ENUM ('Exact', 'Numeric', 'TestCases', 'Pattern', 'AICheck', 'PeerReview');

-- CreateEnum
CREATE TYPE "ChallengeCompletionStatus" AS ENUM ('NotStarted', 'InProgress', 'Completed', 'Failed', 'Abandoned');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('FirstChallenge', 'FirstPerfect', 'Streak7', 'Streak30', 'Master10', 'SpeedRunner', 'NoHints', 'Helper');

-- CreateEnum
CREATE TYPE "MentorRelationStatus" AS ENUM ('Pending', 'Active', 'Paused', 'Completed');

-- CreateEnum
CREATE TYPE "MediaEmbedProvider" AS ENUM ('YouTube', 'Rutube', 'VK', 'Vimeo', 'Custom');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MindLogType" ADD VALUE 'ChallengeStarted';
ALTER TYPE "MindLogType" ADD VALUE 'ChallengeProgress';
ALTER TYPE "MindLogType" ADD VALUE 'ChallengeCompleted';
ALTER TYPE "MindLogType" ADD VALUE 'HintRequested';
ALTER TYPE "MindLogType" ADD VALUE 'SolutionError';
ALTER TYPE "MindLogType" ADD VALUE 'Achievement';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "informaticsLevel" INTEGER DEFAULT 0,
ADD COLUMN     "informaticsRating" INTEGER DEFAULT 0,
ADD COLUMN     "informaticsScore" INTEGER DEFAULT 0,
ADD COLUMN     "isMentor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "mathematicsLevel" INTEGER DEFAULT 0,
ADD COLUMN     "mathematicsRating" INTEGER DEFAULT 0,
ADD COLUMN     "mathematicsScore" INTEGER DEFAULT 0,
ADD COLUMN     "mentorSubjects" TEXT[],
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalChallenges" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Challenge" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "videoUrl" TEXT,
    "videoEmbedUrl" TEXT,
    "subject" "Subject" NOT NULL,
    "challengeType" VARCHAR(100) NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'Elementary',
    "estimatedTime" INTEGER,
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "content" JSONB,
    "seed" JSONB,
    "solution" JSONB,
    "hints" JSONB,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "externalId" VARCHAR(100),
    "validationMode" "ValidationMode" NOT NULL DEFAULT 'Strict',
    "allowedMethods" TEXT[],
    "solutions" JSONB,
    "createdById" VARCHAR(36) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeStep" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "validation" JSONB NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 1,
    "hints" JSONB,
    "solutionMethod" VARCHAR(100),
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "validationType" "ValidationType" NOT NULL DEFAULT 'Exact',
    "alternativeSteps" JSONB,
    "challengeId" VARCHAR(36) NOT NULL,

    CONSTRAINT "ChallengeStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeCompletion" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ChallengeCompletionStatus" NOT NULL DEFAULT 'InProgress',
    "solution" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL,
    "timeSpent" INTEGER,
    "hintsUsed" JSONB,
    "selectedMethod" VARCHAR(100),
    "challengeId" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,

    CONSTRAINT "ChallengeCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepCompletion" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "feedback" TEXT,
    "stepId" VARCHAR(36) NOT NULL,
    "completionId" VARCHAR(36) NOT NULL,

    CONSTRAINT "StepCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "subject" "Subject" NOT NULL,
    "order" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "estimatedHours" INTEGER,
    "createdById" VARCHAR(36) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackStage" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "trackId" VARCHAR(36) NOT NULL,

    CONSTRAINT "TrackStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackChallenge" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "stageId" VARCHAR(36) NOT NULL,
    "challengeId" VARCHAR(36) NOT NULL,

    CONSTRAINT "TrackChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrack" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentStage" INTEGER NOT NULL DEFAULT 0,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trackId" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,

    CONSTRAINT "UserTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "AchievementType" NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "achievementId" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorRelation" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MentorRelationStatus" NOT NULL DEFAULT 'Pending',
    "subject" "Subject" NOT NULL,
    "notes" TEXT,
    "mentorId" VARCHAR(36) NOT NULL,
    "studentId" VARCHAR(36) NOT NULL,

    CONSTRAINT "MentorRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStatistics" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" DATE NOT NULL,
    "subject" "Subject" NOT NULL,
    "challengesStarted" INTEGER NOT NULL DEFAULT 0,
    "challengesCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "averageAttempts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" VARCHAR(36) NOT NULL,

    CONSTRAINT "UserStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaEmbed" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" "MediaEmbedProvider" NOT NULL DEFAULT 'Custom',
    "title" VARCHAR(500),
    "description" TEXT,
    "url" TEXT,
    "embedUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationSec" INTEGER,
    "createdById" VARCHAR(36),

    CONSTRAINT "MediaEmbed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaEmbedPlacement" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "embedId" VARCHAR(36) NOT NULL,
    "targetType" VARCHAR(100) NOT NULL,
    "targetId" VARCHAR(36) NOT NULL,
    "slot" VARCHAR(100),
    "position" INTEGER NOT NULL DEFAULT 0,
    "props" JSONB,

    CONSTRAINT "MediaEmbedPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Challenge_subject_idx" ON "Challenge"("subject");

-- CreateIndex
CREATE INDEX "Challenge_challengeType_idx" ON "Challenge"("challengeType");

-- CreateIndex
CREATE INDEX "Challenge_difficulty_idx" ON "Challenge"("difficulty");

-- CreateIndex
CREATE INDEX "Challenge_isPublished_idx" ON "Challenge"("isPublished");

-- CreateIndex
CREATE INDEX "Challenge_createdById_idx" ON "Challenge"("createdById");

-- CreateIndex
CREATE INDEX "ChallengeStep_challengeId_idx" ON "ChallengeStep"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeStep_challengeId_order_key" ON "ChallengeStep"("challengeId", "order");

-- CreateIndex
CREATE INDEX "ChallengeCompletion_challengeId_idx" ON "ChallengeCompletion"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeCompletion_userId_idx" ON "ChallengeCompletion"("userId");

-- CreateIndex
CREATE INDEX "ChallengeCompletion_status_idx" ON "ChallengeCompletion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeCompletion_challengeId_userId_key" ON "ChallengeCompletion"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "StepCompletion_stepId_idx" ON "StepCompletion"("stepId");

-- CreateIndex
CREATE INDEX "StepCompletion_completionId_idx" ON "StepCompletion"("completionId");

-- CreateIndex
CREATE INDEX "Track_subject_idx" ON "Track"("subject");

-- CreateIndex
CREATE INDEX "Track_isPublished_idx" ON "Track"("isPublished");

-- CreateIndex
CREATE INDEX "Track_createdById_idx" ON "Track"("createdById");

-- CreateIndex
CREATE INDEX "TrackStage_trackId_idx" ON "TrackStage"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackStage_trackId_order_key" ON "TrackStage"("trackId", "order");

-- CreateIndex
CREATE INDEX "TrackChallenge_stageId_idx" ON "TrackChallenge"("stageId");

-- CreateIndex
CREATE INDEX "TrackChallenge_challengeId_idx" ON "TrackChallenge"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackChallenge_stageId_challengeId_key" ON "TrackChallenge"("stageId", "challengeId");

-- CreateIndex
CREATE INDEX "UserTrack_trackId_idx" ON "UserTrack"("trackId");

-- CreateIndex
CREATE INDEX "UserTrack_userId_idx" ON "UserTrack"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrack_trackId_userId_key" ON "UserTrack"("trackId", "userId");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_achievementId_userId_key" ON "UserAchievement"("achievementId", "userId");

-- CreateIndex
CREATE INDEX "MentorRelation_mentorId_idx" ON "MentorRelation"("mentorId");

-- CreateIndex
CREATE INDEX "MentorRelation_studentId_idx" ON "MentorRelation"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorRelation_mentorId_studentId_subject_key" ON "MentorRelation"("mentorId", "studentId", "subject");

-- CreateIndex
CREATE INDEX "UserStatistics_userId_idx" ON "UserStatistics"("userId");

-- CreateIndex
CREATE INDEX "UserStatistics_date_idx" ON "UserStatistics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "UserStatistics_userId_date_subject_key" ON "UserStatistics"("userId", "date", "subject");

-- CreateIndex
CREATE INDEX "MediaEmbed_provider_idx" ON "MediaEmbed"("provider");

-- CreateIndex
CREATE INDEX "MediaEmbed_createdById_idx" ON "MediaEmbed"("createdById");

-- CreateIndex
CREATE INDEX "MediaEmbedPlacement_embedId_idx" ON "MediaEmbedPlacement"("embedId");

-- CreateIndex
CREATE INDEX "MediaEmbedPlacement_targetType_targetId_idx" ON "MediaEmbedPlacement"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "MediaEmbedPlacement_slot_idx" ON "MediaEmbedPlacement"("slot");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeStep" ADD CONSTRAINT "ChallengeStep_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeCompletion" ADD CONSTRAINT "ChallengeCompletion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeCompletion" ADD CONSTRAINT "ChallengeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepCompletion" ADD CONSTRAINT "StepCompletion_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ChallengeStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepCompletion" ADD CONSTRAINT "StepCompletion_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "ChallengeCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackStage" ADD CONSTRAINT "TrackStage_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackChallenge" ADD CONSTRAINT "TrackChallenge_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "TrackStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackChallenge" ADD CONSTRAINT "TrackChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrack" ADD CONSTRAINT "UserTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrack" ADD CONSTRAINT "UserTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRelation" ADD CONSTRAINT "MentorRelation_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRelation" ADD CONSTRAINT "MentorRelation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStatistics" ADD CONSTRAINT "UserStatistics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaEmbed" ADD CONSTRAINT "MediaEmbed_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaEmbedPlacement" ADD CONSTRAINT "MediaEmbedPlacement_embedId_fkey" FOREIGN KEY ("embedId") REFERENCES "MediaEmbed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
