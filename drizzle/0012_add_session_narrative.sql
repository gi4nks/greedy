-- Migration: Add narrative field to sessions table
-- Generated for Drizzle ORM

ALTER TABLE sessions ADD COLUMN narrative TEXT;
