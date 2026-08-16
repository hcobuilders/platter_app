-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'scoping', 'bidding', 'leveling', 'submitted', 'awarded', 'lost');

-- CreateEnum
CREATE TYPE "ProjectDateKind" AS ENUM ('itb_out', 'site_walk', 'rfi_cutoff', 'addenda_cutoff', 'submission_due', 'award_target');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('spec', 'drawing', 'addendum', 'geotech', 'itb', 'contract', 'other');

-- CreateEnum
CREATE TYPE "ParseStatus" AS ENUM ('pending', 'running', 'needs_review', 'confirmed', 'failed');

-- CreateEnum
CREATE TYPE "ExtractedFieldState" AS ENUM ('pending', 'confirmed', 'corrected', 'rejected');

-- CreateEnum
CREATE TYPE "ScopeLineKind" AS ENUM ('inclusion', 'exclusion', 'alternate', 'allowance', 'unit_price', 'clarification', 'va_option');

-- CreateEnum
CREATE TYPE "InvitationIntent" AS ENUM ('none', 'bidding', 'no_bid');

-- CreateEnum
CREATE TYPE "BidSource" AS ENUM ('portal', 'xlsx_upload', 'manual');

-- CreateEnum
CREATE TYPE "BidLineSource" AS ENUM ('sub', 'parsed', 'plug', 'ours');

-- CreateEnum
CREATE TYPE "FlagType" AS ENUM ('requirement', 'informational', 'risk');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "owner" TEXT,
    "architectOfRecord" TEXT,
    "deliveryMethod" TEXT,
    "bondPct" DOUBLE PRECISION,
    "retainagePct" DOUBLE PRECISION,
    "status" "ProjectStatus" NOT NULL DEFAULT 'draft',
    "externalIds" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "ProjectDateKind" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "ProjectDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectNote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "pinnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "actor" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sharepointId" TEXT,
    "kind" "DocumentKind" NOT NULL,
    "discipline" TEXT,
    "sheetNo" TEXT,
    "pageCount" INTEGER,
    "ocrRequired" BOOLEAN NOT NULL DEFAULT false,
    "parseStatus" "ParseStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParseRun" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "tokenCost" INTEGER,
    "error" TEXT,

    CONSTRAINT "ParseRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedField" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "documentId" TEXT,
    "page" INTEGER,
    "bbox" JSONB,
    "state" "ExtractedFieldState" NOT NULL DEFAULT 'pending',
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "parseRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractedField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecSection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "csiCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentId" TEXT,
    "pageFrom" INTEGER,
    "pageTo" INTEGER,

    CONSTRAINT "SpecSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidPackage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "csiCodes" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dueAt" TIMESTAMP(3),
    "budgetAmount" BIGINT,
    "requiresBond" BOOLEAN NOT NULL DEFAULT false,
    "longLead" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,

    CONSTRAINT "BidPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScopeLineItem" (
    "id" TEXT NOT NULL,
    "bidPackageId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "csiCode" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "qty" DOUBLE PRECISION,
    "kind" "ScopeLineKind" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "submittalRequired" BOOLEAN NOT NULL DEFAULT false,
    "longLeadWeeks" INTEGER,
    "specSectionId" TEXT,
    "sourceDocumentId" TEXT,
    "sourcePage" INTEGER,

    CONSTRAINT "ScopeLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcontractor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dba" TEXT,
    "ein" TEXT,
    "flLicense" TEXT,
    "trades" TEXT[],
    "groups" TEXT[],
    "rating" DOUBLE PRECISION,
    "lastVerifiedAt" TIMESTAMP(3),
    "prequalJson" JSONB,
    "notes" TEXT,

    CONSTRAINT "Subcontractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubContact" (
    "id" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isItbContact" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SubContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "bidPackageId" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "intent" "InvitationIntent" NOT NULL DEFAULT 'none',
    "feedbackRequested" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "total" BIGINT,
    "addendaAcked" TEXT[],
    "source" "BidSource" NOT NULL DEFAULT 'portal',
    "attachments" TEXT[],

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidLine" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "scopeLineItemId" TEXT,
    "amount" BIGINT NOT NULL,
    "unitPrice" BIGINT,
    "qty" DOUBLE PRECISION,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "source" "BidLineSource" NOT NULL,
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "BidLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addendum" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'all',
    "trades" TEXT[],

    CONSTRAINT "Addendum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rfi" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromInvitationId" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "routedTo" TEXT,
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rfi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subcontractorId" TEXT,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" TEXT NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bidPackageId" TEXT,
    "csiCode" TEXT,
    "description" TEXT NOT NULL,
    "budget" BIGINT NOT NULL,
    "current" BIGINT NOT NULL,
    "buyoutExpected" BIGINT,
    "awardedTo" TEXT,
    "note" TEXT,
    "tags" TEXT[],

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRevision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revNo" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleScenario" (
    "id" TEXT NOT NULL,
    "budgetLineId" TEXT,
    "scopeLineItemId" TEXT,
    "label" TEXT NOT NULL,
    "isBaseline" BOOLEAN NOT NULL DEFAULT true,
    "initialCost" BIGINT NOT NULL,
    "installYear" INTEGER,
    "serviceLifeYrs" INTEGER NOT NULL,
    "replacementCost" BIGINT,
    "annualMaintenanceCost" BIGINT NOT NULL,
    "annualEnergyCost" BIGINT NOT NULL,
    "energyEscalationRate" DOUBLE PRECISION NOT NULL,
    "salvageValuePct" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "sourceDocumentId" TEXT,
    "sourcePage" INTEGER,

    CONSTRAINT "LifecycleScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FlagType" NOT NULL,
    "description" TEXT,
    "parseKeywords" TEXT[],

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFlag" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,

    CONSTRAINT "ProjectFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "csiCode" TEXT,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTag" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "csiCodes" TEXT[],
    "defaultFlags" TEXT[],

    CONSTRAINT "PackageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_number_key" ON "Project"("number");

-- CreateIndex
CREATE INDEX "AuditEvent_entity_entityId_idx" ON "AuditEvent"("entity", "entityId");

-- CreateIndex
CREATE INDEX "ExtractedField_entityType_entityId_idx" ON "ExtractedField"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "BidPackage_projectId_code_key" ON "BidPackage"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_bidPackageId_subcontractorId_key" ON "Invitation"("bidPackageId", "subcontractorId");

-- CreateIndex
CREATE UNIQUE INDEX "Addendum_projectId_number_key" ON "Addendum"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetRevision_projectId_revNo_key" ON "BudgetRevision"("projectId", "revNo");

-- CreateIndex
CREATE UNIQUE INDEX "Flag_label_key" ON "Flag"("label");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFlag_projectId_flagId_key" ON "ProjectFlag"("projectId", "flagId");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_name_key" ON "Trade"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTag_projectId_tagId_key" ON "ProjectTag"("projectId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageTemplate_code_key" ON "PackageTemplate"("code");

-- AddForeignKey
ALTER TABLE "ProjectDate" ADD CONSTRAINT "ProjectDate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParseRun" ADD CONSTRAINT "ParseRun_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedField" ADD CONSTRAINT "ExtractedField_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedField" ADD CONSTRAINT "ExtractedField_parseRunId_fkey" FOREIGN KEY ("parseRunId") REFERENCES "ParseRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecSection" ADD CONSTRAINT "SpecSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecSection" ADD CONSTRAINT "SpecSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidPackage" ADD CONSTRAINT "BidPackage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidPackage" ADD CONSTRAINT "BidPackage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PackageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeLineItem" ADD CONSTRAINT "ScopeLineItem_bidPackageId_fkey" FOREIGN KEY ("bidPackageId") REFERENCES "BidPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeLineItem" ADD CONSTRAINT "ScopeLineItem_specSectionId_fkey" FOREIGN KEY ("specSectionId") REFERENCES "SpecSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubContact" ADD CONSTRAINT "SubContact_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_bidPackageId_fkey" FOREIGN KEY ("bidPackageId") REFERENCES "BidPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidLine" ADD CONSTRAINT "BidLine_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidLine" ADD CONSTRAINT "BidLine_scopeLineItemId_fkey" FOREIGN KEY ("scopeLineItemId") REFERENCES "ScopeLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addendum" ADD CONSTRAINT "Addendum_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfi" ADD CONSTRAINT "Rfi_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfi" ADD CONSTRAINT "Rfi_fromInvitationId_fkey" FOREIGN KEY ("fromInvitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_bidPackageId_fkey" FOREIGN KEY ("bidPackageId") REFERENCES "BidPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRevision" ADD CONSTRAINT "BudgetRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleScenario" ADD CONSTRAINT "LifecycleScenario_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleScenario" ADD CONSTRAINT "LifecycleScenario_scopeLineItemId_fkey" FOREIGN KEY ("scopeLineItemId") REFERENCES "ScopeLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFlag" ADD CONSTRAINT "ProjectFlag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFlag" ADD CONSTRAINT "ProjectFlag_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "Flag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
