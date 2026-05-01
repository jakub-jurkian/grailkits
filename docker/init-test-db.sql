-- Creates the test database alongside the main one.
-- Runs automatically when the postgres container starts for the first time.
SELECT 'CREATE DATABASE grailkits_test OWNER root'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'grailkits_test')\gexec
