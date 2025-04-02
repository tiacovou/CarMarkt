import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  verificationCode: text("verification_code"),
  verificationCodeExpires: timestamp("verification_code_expires"),
  avatarUrl: text("avatar_url"),
  isPremium: boolean("is_premium").default(false).notNull(),
  freeListingsUsed: integer("free_listings_used").default(0).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isPremium: true,
  freeListingsUsed: true,
  phoneVerified: true,
  verificationCode: true,
  verificationCodeExpires: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

// Car condition enum
export const conditionEnum = pgEnum("condition", ["new", "excellent", "good", "fair", "poor"]);

// Car status enum
export const carStatusEnum = pgEnum("car_status", ["available", "sold", "expired", "deleted"]);

// Cars schema
export const cars = pgTable("cars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: integer("price").notNull(),
  mileage: integer("mileage").notNull(),
  condition: conditionEnum("condition").notNull(),
  color: text("color").notNull(),
  fuelType: text("fuel_type"),
  transmission: text("transmission"),
  bodyType: text("body_type"),
  description: text("description"),
  location: text("location").notNull(),
  isActive: boolean("is_active").default(true),
  isSold: boolean("is_sold").default(false),
  status: carStatusEnum("status").default("available").notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertCarSchema = createInsertSchema(cars).omit({
  id: true,
  userId: true,
  createdAt: true,
  isActive: true,
  isSold: true,
  viewCount: true,
  expiresAt: true,
});

// Car images schema
export const carImages = pgTable("car_images", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull().references(() => cars.id),
  imageUrl: text("image_url").notNull(),
  isPrimary: boolean("is_primary").default(false),
});

export const insertCarImageSchema = createInsertSchema(carImages).omit({
  id: true,
});

// Favorites schema
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  carId: integer("car_id").notNull().references(() => cars.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

// Messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  carId: integer("car_id").notNull().references(() => cars.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCar = z.infer<typeof insertCarSchema>;
export type Car = typeof cars.$inferSelect;

export type InsertCarImage = z.infer<typeof insertCarImageSchema>;
export type CarImage = typeof carImages.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Extended schemas for validation
export const carSearchSchema = z.object({
  make: z.string().default(""),
  model: z.string().default(""),
  minYear: z.number().optional(),
  maxYear: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minMileage: z.number().optional(),
  maxMileage: z.number().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  bodyType: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'year_desc', 'mileage_asc', 'newest']).optional(),
});

export type CarSearch = z.infer<typeof carSearchSchema>;

// Phone verification schemas
export const phoneVerificationRequestSchema = z.object({
  phone: z.string()
    .min(8, "Phone number is too short")
    .max(15, "Phone number is too long")
    .regex(/^\+?[0-9]+$/, "Please enter a valid phone number"),
});

export const phoneVerificationConfirmSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  code: z.string().min(4, "Verification code is required").max(6, "Invalid verification code"),
});

export type PhoneVerificationRequest = z.infer<typeof phoneVerificationRequestSchema>;
export type PhoneVerificationConfirm = z.infer<typeof phoneVerificationConfirmSchema>;

// Payment schema
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Amount in cents (€)
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  stripePaymentIntentId: true,
  stripeSubscriptionId: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
