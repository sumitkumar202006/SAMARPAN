-- ============================================================
-- Samarpan Subscription & Billing Migration
-- Run this SQL directly on Neon console to add the new tables
-- ============================================================

-- CreateTable Subscription
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "razorpaySubId" TEXT,
    "razorpayCustomerId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable UsageQuota
CREATE TABLE IF NOT EXISTS "UsageQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiGenerations" INTEGER NOT NULL DEFAULT 0,
    "pdfUploads" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable DeviceTrial
CREATE TABLE IF NOT EXISTS "DeviceTrial" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    CONSTRAINT "DeviceTrial_pkey" PRIMARY KEY ("id")
);

-- Unique and index constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "UsageQuota_userId_key" ON "UsageQuota"("userId");
CREATE INDEX IF NOT EXISTS "UsageQuota_userId_idx" ON "UsageQuota"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "DeviceTrial_fingerprint_key" ON "DeviceTrial"("fingerprint");
CREATE INDEX IF NOT EXISTS "DeviceTrial_fingerprint_idx" ON "DeviceTrial"("fingerprint");

-- Foreign Keys
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UsageQuota" ADD CONSTRAINT "UsageQuota_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
