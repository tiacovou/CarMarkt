-- Create schema for all tables

-- Create enum types
CREATE TYPE "condition" AS ENUM ('new', 'excellent', 'good', 'fair', 'poor');
CREATE TYPE "car_status" AS ENUM ('available', 'sold', 'expired', 'deleted');

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "phone_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "verification_code" TEXT,
  "verification_code_expires" TIMESTAMP,
  "avatar_url" TEXT,
  "is_premium" BOOLEAN NOT NULL DEFAULT FALSE,
  "free_listings_used" INTEGER NOT NULL DEFAULT 0,
  "stripe_customer_id" TEXT,
  "stripe_subscription_id" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cars table
CREATE TABLE IF NOT EXISTS "cars" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "mileage" INTEGER NOT NULL,
  "condition" condition NOT NULL,
  "color" TEXT NOT NULL,
  "fuel_type" TEXT,
  "transmission" TEXT,
  "body_type" TEXT,
  "description" TEXT,
  "location" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT TRUE,
  "is_sold" BOOLEAN DEFAULT FALSE,
  "status" car_status NOT NULL DEFAULT 'available',
  "view_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP
);

-- Car Images table
CREATE TABLE IF NOT EXISTS "car_images" (
  "id" SERIAL PRIMARY KEY,
  "car_id" INTEGER NOT NULL REFERENCES "cars"("id"),
  "image_url" TEXT NOT NULL,
  "is_primary" BOOLEAN DEFAULT FALSE
);

-- Favorites table
CREATE TABLE IF NOT EXISTS "favorites" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "car_id" INTEGER NOT NULL REFERENCES "cars"("id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS "messages" (
  "id" SERIAL PRIMARY KEY,
  "sender_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "receiver_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "car_id" INTEGER NOT NULL REFERENCES "cars"("id"),
  "content" TEXT NOT NULL,
  "is_read" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS "payments" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "amount" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "stripe_payment_intent_id" TEXT,
  "stripe_subscription_id" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session table for connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");