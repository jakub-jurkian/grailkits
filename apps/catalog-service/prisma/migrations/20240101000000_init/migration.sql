-- Migration: 20240101000000_init
-- Baseline schema for catalog-service (PostgreSQL)
-- Managed by Prisma. Run with: prisma migrate deploy

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── categories ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "categories" (
    "id"         SERIAL PRIMARY KEY,
    "name"       VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "categories_name_unique" UNIQUE ("name")
);

-- ─── products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "products" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "category_id" INTEGER      NOT NULL,
    "name"        VARCHAR(255) NOT NULL,
    "brand"       VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "products_category_id_foreign"
        FOREIGN KEY ("category_id")
        REFERENCES "categories" ("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
);

-- ─── variants ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "variants" (
    "id"         UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "product_id" UUID         NOT NULL,
    "size"       VARCHAR(255) NOT NULL,
    "price"      INTEGER      NOT NULL,
    "stock"      INTEGER      NOT NULL DEFAULT 0,
    "sku"        VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "variants_sku_unique" UNIQUE ("sku"),
    CONSTRAINT "variants_product_id_foreign"
        FOREIGN KEY ("product_id")
        REFERENCES "products" ("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
);
