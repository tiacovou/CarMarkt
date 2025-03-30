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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Car condition enum
export const conditionEnum = pgEnum("condition", ["new", "excellent", "good", "fair", "poor"]);

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
  description: text("description"),
  location: text("location").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCarSchema = createInsertSchema(cars).omit({
  id: true,
  userId: true,
  createdAt: true,
  isActive: true,
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
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
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
  make: z.string().optional(),
  model: z.string().optional(),
  minYear: z.number().optional(),
  maxPrice: z.number().optional(),
});

export type CarSearch = z.infer<typeof carSearchSchema>;
