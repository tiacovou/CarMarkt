import { IStorage } from "./storage";
import pg from "pg";
import { eq, and, like, or, gte, lte, desc, asc, isNull, inArray, SQL } from "drizzle-orm";

const { Pool } = pg;
import { 
  User, 
  Car, 
  CarImage, 
  Favorite, 
  Message, 
  Payment, 
  users, 
  cars, 
  carImages, 
  favorites, 
  messages, 
  payments,
  InsertUser,
  InsertCar,
  InsertCarImage,
  InsertFavorite,
  InsertMessage,
  InsertPayment,
  CarSearch
} from "@shared/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { randomBytes } from "crypto";

export class DatabaseStorage implements IStorage {
  private db: any; // Using any temporarily to bypass type issues
  private pool: any;
  public sessionStore: session.Store;

  constructor(db: any, pool: any) {
    this.db = db;
    this.pool = pool;
    
    const PostgresSessionStore = connectPgSimple(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      tableName: 'session', // You might need to create this table
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    if (!phone) return undefined;
    const result = await this.db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values({
      ...user,
      freeListingsUsed: 0,
      isPremium: false,
      phoneVerified: false
    }).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateAvatar(userId: number, avatarUrl: string): Promise<User | undefined> {
    return this.updateUser(userId, { avatarUrl });
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(id, { stripeCustomerId });
  }

  async updateUserStripeInfo(
    id: number, 
    stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }
  ): Promise<User | undefined> {
    return this.updateUser(id, { 
      stripeCustomerId: stripeInfo.stripeCustomerId,
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
      isPremium: true
    });
  }

  async createVerificationCode(userId: number, phone: string): Promise<string> {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.db.update(users)
      .set({ 
        phone,
        verificationCode: code, 
        verificationCodeExpires: expiresAt 
      })
      .where(eq(users.id, userId));

    return code;
  }

  async verifyPhone(userId: number, code: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Check if code matches and hasn't expired
    if (
      user.verificationCode === code &&
      user.verificationCodeExpires &&
      new Date() < new Date(user.verificationCodeExpires)
    ) {
      await this.db.update(users)
        .set({ 
          phoneVerified: true, 
          verificationCode: null, 
          verificationCodeExpires: null 
        })
        .where(eq(users.id, userId));
      return true;
    }
    
    return false;
  }

  // Car operations
  async getCar(id: number): Promise<Car | undefined> {
    const result = await this.db.select().from(cars).where(eq(cars.id, id)).limit(1);
    return result[0];
  }

  async getCars(): Promise<Car[]> {
    return this.db.select().from(cars).where(eq(cars.status, "available"));
  }

  async getCarsByUser(userId: number): Promise<Car[]> {
    return this.db.select().from(cars).where(eq(cars.userId, userId));
  }

  async countUserActiveCars(userId: number): Promise<number> {
    const result = await this.db.select({ count: cars.id }).from(cars)
      .where(and(
        eq(cars.userId, userId),
        eq(cars.status, "available")
      ));
    
    return result.length;
  }

  async searchCars(search: CarSearch): Promise<Car[]> {
    let query = this.db.select().from(cars).where(eq(cars.status, "available"));

    if (search.make) {
      query = query.where(eq(cars.make, search.make));
    }
    
    if (search.model) {
      query = query.where(eq(cars.model, search.model));
    }
    
    if (search.minYear !== undefined) {
      query = query.where(gte(cars.year, search.minYear));
    }
    
    if (search.maxYear !== undefined) {
      query = query.where(lte(cars.year, search.maxYear));
    }
    
    if (search.minPrice !== undefined) {
      query = query.where(gte(cars.price, search.minPrice));
    }
    
    if (search.maxPrice !== undefined) {
      query = query.where(lte(cars.price, search.maxPrice));
    }
    
    if (search.minMileage !== undefined) {
      query = query.where(gte(cars.mileage, search.minMileage));
    }
    
    if (search.maxMileage !== undefined) {
      query = query.where(lte(cars.mileage, search.maxMileage));
    }
    
    if (search.condition) {
      // Convert string to the enum type
      query = query.where(eq(cars.condition, search.condition as any));
    }
    
    if (search.location) {
      query = query.where(eq(cars.location, search.location));
    }

    if (search.fuelType) {
      query = query.where(eq(cars.fuelType, search.fuelType));
    }

    if (search.transmission) {
      query = query.where(eq(cars.transmission, search.transmission));
    }

    if (search.bodyType) {
      query = query.where(eq(cars.bodyType, search.bodyType));
    }

    if (search.sortBy === "price_asc") {
      query = query.orderBy(asc(cars.price));
    } else if (search.sortBy === "price_desc") {
      query = query.orderBy(desc(cars.price));
    } else if (search.sortBy === "year_desc") {
      query = query.orderBy(desc(cars.year));
    } else if (search.sortBy === "mileage_asc") {
      query = query.orderBy(asc(cars.mileage));
    } else {
      // Default sort by newest (created_at desc)
      query = query.orderBy(desc(cars.createdAt));
    }

    return query;
  }

  async createCar(car: InsertCar, userId: number): Promise<Car> {
    // Increment user's free listings used
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    if (!user.isPremium) {
      await this.db.update(users)
        .set({ freeListingsUsed: (user.freeListingsUsed || 0) + 1 })
        .where(eq(users.id, userId));
    }

    // Create car with expiration date one month from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    const result = await this.db.insert(cars).values({
      ...car,
      userId,
      status: "available",
      viewCount: 0,
      expiresAt
    }).returning();
    
    return result[0];
  }

  async updateCar(id: number, car: Partial<InsertCar>): Promise<Car | undefined> {
    const result = await this.db.update(cars)
      .set(car)
      .where(eq(cars.id, id))
      .returning();
    return result[0];
  }

  async deleteCar(id: number): Promise<boolean> {
    // Soft-delete by updating status to "deleted"
    const result = await this.db.update(cars)
      .set({ status: "deleted" })
      .where(eq(cars.id, id));
    return result.rowCount > 0;
  }

  async markCarAsSold(id: number): Promise<Car | undefined> {
    const result = await this.db.update(cars)
      .set({ status: "sold" })
      .where(eq(cars.id, id))
      .returning();
    return result[0];
  }

  async markCarAsAvailable(id: number): Promise<Car | undefined> {
    const result = await this.db.update(cars)
      .set({ status: "available" })
      .where(eq(cars.id, id))
      .returning();
    return result[0];
  }

  async renewCarListing(id: number): Promise<Car | undefined> {
    // Set new expiration date one month from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    const result = await this.db.update(cars)
      .set({ expiresAt })
      .where(eq(cars.id, id))
      .returning();
    return result[0];
  }

  async incrementViewCount(id: number): Promise<Car | undefined> {
    const car = await this.getCar(id);
    if (!car) return undefined;
    
    const result = await this.db.update(cars)
      .set({ viewCount: (car.viewCount || 0) + 1 })
      .where(eq(cars.id, id))
      .returning();
    return result[0];
  }

  async cleanupExpiredListings(): Promise<void> {
    const now = new Date();
    await this.db.update(cars)
      .set({ status: "expired" })
      .where(and(
        eq(cars.status, "available"),
        lte(cars.expiresAt, now)
      ));
  }

  async hardDeleteCar(carId: number): Promise<void> {
    // First delete related records
    await this.db.delete(carImages).where(eq(carImages.carId, carId));
    await this.db.delete(favorites).where(eq(favorites.carId, carId));
    await this.db.delete(messages).where(eq(messages.carId, carId));
    
    // Then delete the car
    await this.db.delete(cars).where(eq(cars.id, carId));
  }

  async createExpiredTestCar(userId: number): Promise<Car> {
    // Create car with expiration date in the past
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() - 1);
    
    const result = await this.db.insert(cars).values({
      userId,
      make: "Test",
      model: "Expired",
      year: 2020,
      price: 10000,
      mileage: 50000,
      condition: "good",
      color: "red",
      fuelType: "petrol",
      transmission: "automatic",
      description: "This is a test expired car",
      location: "Nicosia",
      status: "available",
      viewCount: 0,
      expiresAt
    }).returning();
    
    return result[0];
  }

  // Car image operations
  async getCarImages(carId: number): Promise<CarImage[]> {
    return this.db.select().from(carImages).where(eq(carImages.carId, carId));
  }

  async createCarImage(image: InsertCarImage): Promise<CarImage> {
    const result = await this.db.insert(carImages).values(image).returning();
    return result[0];
  }

  async deleteCarImage(id: number): Promise<boolean> {
    const result = await this.db.delete(carImages).where(eq(carImages.id, id));
    return result.rowCount > 0;
  }

  async setPrimaryImage(carId: number, imageId: number): Promise<boolean> {
    // First, set all images for this car to not primary
    await this.db.update(carImages)
      .set({ isPrimary: false })
      .where(eq(carImages.carId, carId));
    
    // Then set the selected image as primary
    const result = await this.db.update(carImages)
      .set({ isPrimary: true })
      .where(and(
        eq(carImages.id, imageId),
        eq(carImages.carId, carId)
      ));
    
    return result.rowCount > 0;
  }

  // Favorite operations
  async getFavorites(userId: number): Promise<Favorite[]> {
    return this.db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async getFavoriteByUserAndCar(userId: number, carId: number): Promise<Favorite | undefined> {
    const result = await this.db.select().from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.carId, carId)
      ))
      .limit(1);
    return result[0];
  }

  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const result = await this.db.insert(favorites).values(favorite).returning();
    return result[0];
  }

  async deleteFavorite(id: number): Promise<boolean> {
    const result = await this.db.delete(favorites).where(eq(favorites.id, id));
    return result.rowCount > 0;
  }

  // Message operations
  async getMessages(userId: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      ))
      .orderBy(desc(messages.createdAt));
  }

  async getMessagesByCarAndUsers(carId: number, userId1: number, userId2: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.carId, carId),
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.receiverId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.receiverId, userId1)
          )
        )
      ))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await this.db.insert(messages).values({
      ...message,
      isRead: false
    }).returning();
    return result[0];
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await this.db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
    return result.rowCount > 0;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await this.db.insert(payments).values(payment).returning();
    return result[0];
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return this.db.select().from(payments).where(eq(payments.userId, userId));
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const result = await this.db.update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }
}