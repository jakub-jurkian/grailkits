-- GrailKits order-service: initial payments schema.
-- Owned by Prisma. Runs via `prisma migrate deploy` at container startup.
-- Disjoint from Sequelize-owned tables (carts, cart_lines, orders, order_items).

-- pgcrypto is needed for gen_random_uuid(). The catalog-service Knex migration
-- also creates this, but CREATE EXTENSION IF NOT EXISTS is idempotent so there
-- is no conflict regardless of which service boots first.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Payment ─────────────────────────────────────────────────────────────────
CREATE TABLE "Payment" (
    "id"        UUID         NOT NULL DEFAULT gen_random_uuid(),
    "orderId"   UUID         NOT NULL,
    "amount"    INTEGER      NOT NULL,
    "method"    VARCHAR(255) NOT NULL DEFAULT 'CARD',
    "status"    VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Payment_orderId_idx" ON "Payment" ("orderId");
CREATE INDEX "Payment_status_idx"  ON "Payment" ("status");

-- ─── PaymentEvent ────────────────────────────────────────────────────────────
CREATE TABLE "PaymentEvent" (
    "id"        UUID         NOT NULL DEFAULT gen_random_uuid(),
    "paymentId" UUID         NOT NULL,
    "type"      VARCHAR(255) NOT NULL,
    "payload"   JSONB,
    "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentEvent_paymentId_idx" ON "PaymentEvent" ("paymentId");

ALTER TABLE "PaymentEvent"
  ADD CONSTRAINT "PaymentEvent_paymentId_fkey"
  FOREIGN KEY ("paymentId")
  REFERENCES "Payment" ("id")
  ON DELETE CASCADE
  ON UPDATE NO ACTION;
