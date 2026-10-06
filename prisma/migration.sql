-- EventHene full schema migration
-- Paste this entire file into Supabase SQL Editor and click Run.

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'STAFF', 'ATTENDEE');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'EDITS_REQUESTED', 'PUBLISHED', 'REJECTED', 'PAUSED', 'ENDED', 'CANCELLED');
CREATE TYPE "EventType" AS ENUM ('PAID', 'FREE');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');
CREATE TYPE "TicketStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'TICKET_ISSUED', 'REGISTERED', 'ATTENDED', 'NOT_ATTENDED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'EMAIL', 'PHONE', 'SELECT', 'NUMBER', 'DATE', 'TEXTAREA');
CREATE TYPE "FieldKey" AS ENUM ('FULL_NAME', 'PHONE', 'EMAIL', 'GENDER', 'CITY', 'ADDRESS', 'ORGANIZATION', 'AGE_RANGE', 'EMERGENCY_CONTACT', 'CUSTOM');
CREATE TYPE "PromoTier" AS ENUM ('BASIC_BOOST', 'FEATURED', 'HOMEPAGE_SPOTLIGHT', 'CATEGORY_FEATURE');
CREATE TYPE "PromoStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'CONTACTED', 'WON', 'LOST');
CREATE TYPE "ServiceType" AS ENUM ('SOCIAL_MEDIA', 'GRAPHIC_DESIGN', 'LIVESTREAM', 'PHOTOGRAPHY', 'MEDIA_COVERAGE', 'MARKETING');
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'STRIPE', 'MANUAL');
CREATE TYPE "SmsStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'PARTIAL');
CREATE TYPE "SmsRecipientStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');
CREATE TYPE "SenderIdStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SmsTxnKind" AS ENUM ('GRANT', 'PURCHASE', 'DEDUCT', 'REFUND', 'ADJUST');

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT,
    "imageUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ATTENDEE',
    "country" TEXT,
    "currency" TEXT,
    "timezone" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "paystackSubacct" TEXT,
    "stripeAccountId" TEXT,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "smsBalance" INTEGER NOT NULL DEFAULT 0,
    "smsFrozen" BOOLEAN NOT NULL DEFAULT false,
    "senderId" TEXT,
    "senderIdStatus" "SenderIdStatus" NOT NULL DEFAULT 'NONE',
    "senderIdNote" TEXT,
    "senderIdApprovedAt" TIMESTAMP(3),
    "senderIdApprovedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "bookingOpensAt" TIMESTAMP(3) NOT NULL,
    "bookingClosesAt" TIMESTAMP(3) NOT NULL,
    "flyerUrl" TEXT,
    "bannerUrl" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'PAID',
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "buyerPaysFee" BOOLEAN NOT NULL DEFAULT true,
    "adminNote" TEXT,
    "rejectionReason" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttendeeField" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "key" "FieldKey" NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AttendeeField_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "buyerUserId" TEXT,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "buyerName" TEXT NOT NULL,
    "subtotalMinor" INTEGER NOT NULL,
    "platformFeeMinor" INTEGER NOT NULL,
    "processorFeeMinor" INTEGER NOT NULL,
    "totalMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "PaymentProvider",
    "providerRef" TEXT,
    "draftPayload" JSONB,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "orderId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "gender" TEXT,
    "city" TEXT,
    "address" TEXT,
    "organization" TEXT,
    "ageRange" TEXT,
    "emergencyContact" TEXT,
    "customAnswers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "orderId" TEXT,
    "visibleRef" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "qrTokenHash" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "issuedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "scannedByUserId" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScanLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT,
    "eventId" TEXT NOT NULL,
    "scannedById" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventStaff" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventStaff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "tier" "PromoTier" NOT NULL,
    "country" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PromoStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoPrice" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "tier" "PromoTier" NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PromoPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmsCampaign" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "segmentsPer" INTEGER NOT NULL DEFAULT 1,
    "creditsCharged" INTEGER NOT NULL DEFAULT 0,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "status" "SmsStatus" NOT NULL DEFAULT 'QUEUED',
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmsCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmsTransaction" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "kind" "SmsTxnKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmsTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmsRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "attendeeId" TEXT,
    "status" "SmsRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "errorText" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmsRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceInquiry" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT,
    "eventId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "serviceType" "ServiceType" NOT NULL,
    "budgetMinor" INTEGER,
    "currency" TEXT,
    "preferredDate" TIMESTAMP(3),
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceInquiry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "reporterEmail" TEXT NOT NULL,
    "eventId" TEXT,
    "organizerId" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE UNIQUE INDEX "Organizer_userId_key" ON "Organizer"("userId");
CREATE UNIQUE INDEX "Organizer_slug_key" ON "Organizer"("slug");
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE UNIQUE INDEX "Ticket_visibleRef_key" ON "Ticket"("visibleRef");
CREATE UNIQUE INDEX "Ticket_qrToken_key" ON "Ticket"("qrToken");
CREATE UNIQUE INDEX "Ticket_qrTokenHash_key" ON "Ticket"("qrTokenHash");
CREATE UNIQUE INDEX "EventStaff_eventId_userId_key" ON "EventStaff"("eventId", "userId");
CREATE UNIQUE INDEX "PromoPrice_country_tier_key" ON "PromoPrice"("country", "tier");

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "Event_status_startsAt_idx" ON "Event"("status", "startsAt");
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");
CREATE INDEX "Event_category_status_idx" ON "Event"("category", "status");
CREATE INDEX "TicketType_eventId_idx" ON "TicketType"("eventId");
CREATE INDEX "Order_eventId_status_idx" ON "Order"("eventId", "status");
CREATE INDEX "Order_providerRef_idx" ON "Order"("providerRef");
CREATE INDEX "Order_buyerEmail_idx" ON "Order"("buyerEmail");
CREATE INDEX "Attendee_eventId_idx" ON "Attendee"("eventId");
CREATE INDEX "Attendee_email_idx" ON "Attendee"("email");
CREATE INDEX "Attendee_phone_idx" ON "Attendee"("phone");
CREATE INDEX "Ticket_eventId_status_idx" ON "Ticket"("eventId", "status");
CREATE INDEX "Ticket_visibleRef_idx" ON "Ticket"("visibleRef");
CREATE INDEX "ScanLog_eventId_createdAt_idx" ON "ScanLog"("eventId", "createdAt");
CREATE INDEX "ScanLog_ticketId_idx" ON "ScanLog"("ticketId");
CREATE INDEX "Promotion_status_endsAt_idx" ON "Promotion"("status", "endsAt");
CREATE INDEX "Promotion_eventId_idx" ON "Promotion"("eventId");
CREATE INDEX "SmsCampaign_organizerId_createdAt_idx" ON "SmsCampaign"("organizerId", "createdAt");
CREATE INDEX "SmsCampaign_eventId_idx" ON "SmsCampaign"("eventId");
CREATE INDEX "SmsCampaign_status_idx" ON "SmsCampaign"("status");
CREATE INDEX "SmsTransaction_organizerId_createdAt_idx" ON "SmsTransaction"("organizerId", "createdAt");
CREATE INDEX "SmsTransaction_campaignId_idx" ON "SmsTransaction"("campaignId");
CREATE INDEX "SmsRecipient_campaignId_status_idx" ON "SmsRecipient"("campaignId", "status");
CREATE INDEX "SmsRecipient_phone_idx" ON "SmsRecipient"("phone");
CREATE INDEX "ServiceInquiry_status_createdAt_idx" ON "ServiceInquiry"("status", "createdAt");
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");
CREATE INDEX "Complaint_status_createdAt_idx" ON "Complaint"("status", "createdAt");
CREATE INDEX "Review_eventId_idx" ON "Review"("eventId");
CREATE INDEX "AdminLog_actorId_createdAt_idx" ON "AdminLog"("actorId", "createdAt");

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendeeField" ADD CONSTRAINT "AttendeeField_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "Attendee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SmsCampaign" ADD CONSTRAINT "SmsCampaign_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SmsCampaign" ADD CONSTRAINT "SmsCampaign_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SmsTransaction" ADD CONSTRAINT "SmsTransaction_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmsTransaction" ADD CONSTRAINT "SmsTransaction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SmsCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SmsRecipient" ADD CONSTRAINT "SmsRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SmsCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceInquiry" ADD CONSTRAINT "ServiceInquiry_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- PRISMA MIGRATIONS TABLE (so Prisma knows the DB is in sync)
-- ============================================================

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP WITH TIME ZONE,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP WITH TIME ZONE,
    "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
VALUES (gen_random_uuid()::text, 'manual_full_schema', '20261006_init', now(), 1);
