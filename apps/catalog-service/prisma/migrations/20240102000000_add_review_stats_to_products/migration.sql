-- Migration: 20240102000000_add_review_stats_to_products
-- Adds denormalised review statistics to products for hybrid PG+MongoDB writes.
-- review_count and avg_rating are updated by review-service when a review is approved.

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "review_count" INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "avg_rating"   NUMERIC(3,2) DEFAULT NULL;
