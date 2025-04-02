import { IStorage } from "./storage";
import { 
  users, type User, type InsertUser,
  cars, type Car, type InsertCar,
  carImages, type CarImage, type InsertCarImage,
  favorites, type Favorite, type InsertFavorite,
  messages, type Message, type InsertMessage,
  payments, type Payment, type InsertPayment,
  type CarSearch
} from "@shared/schema";
import { eq, and, like, or, gte, lte, desc, asc, isNull, inArray, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { randomBytes } from "crypto";

export class DatabaseStorage implements IStorage {
  private db: NodePgDatabase;
  private pool: Pool;
  public sessionStore: session.Store;

  constructor(db: NodePgDatabase, pool: Pool) {
    this.db = db;
    this.pool = pool;
    
    const PostgresSessionStore = connectPgSimple(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await this.db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await this.db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  async updateAvatar(userId: number, avatarUrl: string): Promise<User | undefined> {
    return this.updateUser(userId, { avatarUrl });
  }
  
  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(id, { stripeCustomerId });
  }
  
  async updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(id, stripeInfo);
  }
  
  async createVerificationCode(userId: number, phone: string): Promise<string> {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes
    
    await this.updateUser(userId, {
      phone,
      phoneVerified: false,
      verificationCode: code,
      verificationCodeExpires: expiresAt
    });
    
    return code;
  }
  
  async verifyPhone(userId: number, code: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Check if verification code exists and is not expired
    if (!user.verificationCode || !user.verificationCodeExpires) {
      return false;
    }
    
    const now = new Date();
    if (now > user.verificationCodeExpires) {
      // Code has expired
      await this.updateUser(userId, {
        verificationCode: null,
        verificationCodeExpires: null
      });
      return false;
    }
    
    // Check if codes match
    if (user.verificationCode !== code) {
      return false;
    }
    
    // Code is valid, mark the phone as verified
    await this.updateUser(userId, {
      phoneVerified: true,
      verificationCode: null,
      verificationCodeExpires: null
    });
    
    return true;
  }

  // Car operations
  async getCar(id: number): Promise<Car | undefined> {
    const [car] = await this.db.select().from(cars).where(eq(cars.id, id));
    return car || undefined;
  }
  
  async getCars(): Promise<Car[]> {
    const now = new Date();
    return this.db.select()
      .from(cars)
      .where(
        and(
          eq(cars.status, "available"),
          or(
            isNull(cars.expiresAt),
            gte(cars.expiresAt, now)
          )
        )
      );
  }
  
  async getCarsByUser(userId: number): Promise<Car[]> {
    return this.db.select()
      .from(cars)
      .where(eq(cars.userId, userId));
  }
  
  async countUserActiveCars(userId: number): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` })
      .from(cars)
      .where(
        and(
          eq(cars.userId, userId),
          eq(cars.status, "available")
        )
      );
    return Number(result[0].count) || 0;
  }
  
  async searchCars(search: CarSearch): Promise<Car[]> {
    const now = new Date();
    console.log("Searching cars with criteria:", JSON.stringify(search));
    
    let filteredCars = await this.db.select().from(cars).where(
      and(
        eq(cars.status, "available"),
        or(
          isNull(cars.expiresAt),
          gte(cars.expiresAt, now)
        )
      )
    );
    
    // Apply search filters
    if (search.make && search.make !== "") {
      filteredCars = filteredCars.filter(car => 
        car.make.toLowerCase().includes(search.make!.toLowerCase())
      );
    }
    
    if (search.model && search.model !== "") {
      filteredCars = filteredCars.filter(car => 
        car.model.toLowerCase().includes(search.model!.toLowerCase())
      );
    }
    
    if (search.minYear && search.minYear > 0) {
      filteredCars = filteredCars.filter(car => car.year >= search.minYear!);
    }
    
    if (search.maxYear && search.maxYear > 0) {
      filteredCars = filteredCars.filter(car => car.year <= search.maxYear!);
    }
    
    if (search.minPrice && search.minPrice > 0) {
      filteredCars = filteredCars.filter(car => car.price >= search.minPrice!);
    }
    
    if (search.maxPrice && search.maxPrice > 0) {
      filteredCars = filteredCars.filter(car => car.price <= search.maxPrice!);
    }
    
    if (search.minMileage && search.minMileage > 0) {
      filteredCars = filteredCars.filter(car => car.mileage >= search.minMileage!);
    }
    
    if (search.maxMileage && search.maxMileage > 0) {
      filteredCars = filteredCars.filter(car => car.mileage <= search.maxMileage!);
    }
    
    if (search.condition) {
      filteredCars = filteredCars.filter(car => car.condition === search.condition);
    }
    
    if (search.location && search.location !== "") {
      filteredCars = filteredCars.filter(car => 
        car.location.toLowerCase().includes(search.location!.toLowerCase())
      );
    }
    
    if (search.fuelType && search.fuelType !== "") {
      filteredCars = filteredCars.filter(car => car.fuelType === search.fuelType);
    }
    
    if (search.transmission && search.transmission !== "") {
      filteredCars = filteredCars.filter(car => car.transmission === search.transmission);
    }
    
    if (search.bodyType && search.bodyType !== "") {
      filteredCars = filteredCars.filter(car => car.bodyType === search.bodyType);
    }
    
    // Apply sorting
    if (search.sortBy) {
      if (search.sortBy === "price_asc") {
        filteredCars.sort((a, b) => a.price - b.price);
      } else if (search.sortBy === "price_desc") {
        filteredCars.sort((a, b) => b.price - a.price);
      } else if (search.sortBy === "year_desc") {
        filteredCars.sort((a, b) => b.year - a.year);
      } else if (search.sortBy === "mileage_asc") {
        filteredCars.sort((a, b) => a.mileage - b.mileage);
      } else if (search.sortBy === "newest") {
        filteredCars.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      }
    } else {
      // Default sort - newest first
      filteredCars.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    }
    
    return filteredCars;
  }
  
  async createCar(car: InsertCar, userId: number): Promise<Car> {
    // Calculate expiration date (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    const [newCar] = await this.db.insert(cars)
      .values({
        ...car,
        userId,
        status: "available",
        viewCount: 0,
        expiresAt
      })
      .returning();
    
    return newCar;
  }
  
  async updateCar(id: number, car: Partial<InsertCar>): Promise<Car | undefined> {
    const [updatedCar] = await this.db
      .update(cars)
      .set(car)
      .where(eq(cars.id, id))
      .returning();
    
    return updatedCar || undefined;
  }
  
  async deleteCar(id: number): Promise<boolean> {
    const [updatedCar] = await this.db
      .update(cars)
      .set({ status: "deleted" })
      .where(eq(cars.id, id))
      .returning();
    
    return !!updatedCar;
  }
  
  async markCarAsSold(id: number): Promise<Car | undefined> {
    const [updatedCar] = await this.db
      .update(cars)
      .set({ 
        status: "sold",
        isActive: false,
        isSold: true
      })
      .where(eq(cars.id, id))
      .returning();
    
    return updatedCar || undefined;
  }
  
  async markCarAsAvailable(id: number): Promise<Car | undefined> {
    const [updatedCar] = await this.db
      .update(cars)
      .set({ 
        status: "available",
        isActive: true,
        isSold: false 
      })
      .where(eq(cars.id, id))
      .returning();
    
    return updatedCar || undefined;
  }
  
  async renewCarListing(id: number): Promise<Car | undefined> {
    // Set expiration date to 1 month from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    const [updatedCar] = await this.db
      .update(cars)
      .set({ 
        status: "available",
        isActive: true,
        isSold: false,
        expiresAt 
      })
      .where(eq(cars.id, id))
      .returning();
    
    return updatedCar || undefined;
  }
  
  async incrementViewCount(id: number): Promise<Car | undefined> {
    const car = await this.getCar(id);
    if (!car) return undefined;
    
    const [updatedCar] = await this.db
      .update(cars)
      .set({ viewCount: car.viewCount + 1 })
      .where(eq(cars.id, id))
      .returning();
    
    return updatedCar || undefined;
  }
  
  async cleanupExpiredListings(): Promise<void> {
    console.log("Running expired listings cleanup...");
    const now = new Date();
    
    // Find and update expired listings
    const [result] = await this.db
      .update(cars)
      .set({ 
        status: "expired",
        isActive: false 
      })
      .where(
        and(
          eq(cars.status, "available"),
          lte(cars.expiresAt, now)
        )
      )
      .returning({ count: sql`count(*)` });
    
    const count = Number(result?.count || 0);
    
    if (count === 0) {
      console.log("No expired listings found.");
    } else {
      console.log(`Expired listings cleanup complete. Marked ${count} listings as expired.`);
    }
  }
  
  async hardDeleteCar(carId: number): Promise<void> {
    // Delete related car images
    await this.db.delete(carImages).where(eq(carImages.carId, carId));
    
    // Delete related favorites
    await this.db.delete(favorites).where(eq(favorites.carId, carId));
    
    // Delete related messages
    await this.db.delete(messages).where(eq(messages.carId, carId));
    
    // Delete the car itself
    await this.db.delete(cars).where(eq(cars.id, carId));
  }
  
  async createExpiredTestCar(userId: number): Promise<Car> {
    // Create a car with an expiration date in the past for testing purposes
    // Set expiration date to one month and one day ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 1);
    
    const [car] = await this.db.insert(cars)
      .values({
        userId,
        make: 'Toyota',
        model: 'Corolla',
        year: 2018,
        price: 12000,
        mileage: 45000,
        condition: 'good',
        color: 'Silver',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        bodyType: 'Sedan',
        location: 'Nicosia, Cyprus',
        description: 'This is a test expired listing',
        status: "available",
        isActive: true,
        isSold: false,
        viewCount: Math.floor(Math.random() * 50),
        expiresAt: oneMonthAgo
      })
      .returning();
    
    return car;
  }

  // Car image operations
  async getCarImages(carId: number): Promise<CarImage[]> {
    return this.db.select()
      .from(carImages)
      .where(eq(carImages.carId, carId));
  }
  
  async createCarImage(image: InsertCarImage): Promise<CarImage> {
    const [newImage] = await this.db.insert(carImages)
      .values(image)
      .returning();
    return newImage;
  }
  
  async deleteCarImage(id: number): Promise<boolean> {
    const [deletedImage] = await this.db.delete(carImages)
      .where(eq(carImages.id, id))
      .returning();
    return !!deletedImage;
  }
  
  async setPrimaryImage(carId: number, imageId: number): Promise<boolean> {
    // First, set all images for this car as not primary
    await this.db.update(carImages)
      .set({ isPrimary: false })
      .where(eq(carImages.carId, carId));
    
    // Then set the specified image as primary
    const [updatedImage] = await this.db.update(carImages)
      .set({ isPrimary: true })
      .where(
        and(
          eq(carImages.id, imageId),
          eq(carImages.carId, carId)
        )
      )
      .returning();
    
    return !!updatedImage;
  }

  // Favorite operations
  async getFavorites(userId: number): Promise<Favorite[]> {
    return this.db.select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
  }
  
  async getFavoriteByUserAndCar(userId: number, carId: number): Promise<Favorite | undefined> {
    const [favorite] = await this.db.select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.carId, carId)
        )
      );
    return favorite || undefined;
  }
  
  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await this.db.insert(favorites)
      .values(favorite)
      .returning();
    return newFavorite;
  }
  
  async deleteFavorite(id: number): Promise<boolean> {
    const [deletedFavorite] = await this.db.delete(favorites)
      .where(eq(favorites.id, id))
      .returning();
    return !!deletedFavorite;
  }

  // Message operations
  async getMessages(userId: number): Promise<Message[]> {
    return this.db.select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));
  }
  
  async getMessagesByCarAndUsers(carId: number, userId1: number, userId2: number): Promise<Message[]> {
    return this.db.select()
      .from(messages)
      .where(
        and(
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
        )
      )
      .orderBy(asc(messages.createdAt));
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await this.db.insert(messages)
      .values({
        ...message,
        isRead: false
      })
      .returning();
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<boolean> {
    const [updatedMessage] = await this.db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return !!updatedMessage;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await this.db.insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }
  
  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return this.db.select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const [updatedPayment] = await this.db.update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment || undefined;
  }
}