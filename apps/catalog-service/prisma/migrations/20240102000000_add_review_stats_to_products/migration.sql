-- This migration is intentionally a no-op.
-- review_count and avg_rating are added to products by the Knex migration
-- 20260422100000_add_review_stats_to_products.js which runs at app startup.
-- Prisma tracks this entry so migrate deploy does not fail on re-runs.
SELECT 1;
