import { 
  users, type User, type InsertUser,
  cars, type Car, type InsertCar,
  carImages, type CarImage, type InsertCarImage,
  favorites, type Favorite, type InsertFavorite,
  messages, type Message, type InsertMessage,
  payments, type Payment, type InsertPayment,
  type CarSearch
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateAvatar(userId: number, avatarUrl: string): Promise<User | undefined>;
  updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User | undefined>;
  updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  createVerificationCode(userId: number, phone: string): Promise<string>;
  verifyPhone(userId: number, code: string): Promise<boolean>;
  
  // Car operations
  getCar(id: number): Promise<Car | undefined>;
  getCars(): Promise<Car[]>;
  getCarsByUser(userId: number): Promise<Car[]>;
  countUserActiveCars(userId: number): Promise<number>;
  searchCars(search: CarSearch): Promise<Car[]>;
  createCar(car: InsertCar, userId: number): Promise<Car>;
  updateCar(id: number, car: Partial<InsertCar>): Promise<Car | undefined>;
  deleteCar(id: number): Promise<boolean>;
  markCarAsSold(id: number): Promise<Car | undefined>;
  markCarAsAvailable(id: number): Promise<Car | undefined>;
  renewCarListing(id: number): Promise<Car | undefined>;
  incrementViewCount(id: number): Promise<Car | undefined>;
  cleanupExpiredListings(): Promise<void>;
  hardDeleteCar(carId: number): Promise<void>;
  createExpiredTestCar(userId: number): Promise<Car>;
  
  // Car image operations
  getCarImages(carId: number): Promise<CarImage[]>;
  createCarImage(image: InsertCarImage): Promise<CarImage>;
  deleteCarImage(id: number): Promise<boolean>;
  setPrimaryImage(carId: number, imageId: number): Promise<boolean>;
  
  // Favorite operations
  getFavorites(userId: number): Promise<Favorite[]>;
  getFavoriteByUserAndCar(userId: number, carId: number): Promise<Favorite | undefined>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(id: number): Promise<boolean>;
  
  // Message operations
  getMessages(userId: number): Promise<Message[]>;
  getMessagesByCarAndUsers(carId: number, userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string): Promise<Payment | undefined>;
  
  // Session storage
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cars: Map<number, Car>;
  private carImages: Map<number, CarImage>;
  private favorites: Map<number, Favorite>;
  private messages: Map<number, Message>;
  private payments: Map<number, Payment>;
  
  sessionStore: any; // Using any to bypass TypeScript errors
  
  currentUserId: number;
  currentCarId: number;
  currentCarImageId: number;
  currentFavoriteId: number;
  currentMessageId: number;
  currentPaymentId: number;
  cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.users = new Map();
    this.cars = new Map();
    this.carImages = new Map();
    this.favorites = new Map();
    this.messages = new Map();
    this.payments = new Map();
    
    this.currentUserId = 1;
    this.currentCarId = 1;
    this.currentCarImageId = 1;
    this.currentFavoriteId = 1;
    this.currentMessageId = 1;
    this.currentPaymentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    
    // Set up automatic cleanup of expired car listings
    // Run every hour to check for and delete expired listings
    this.cleanupInterval = setInterval(() => this.cleanupExpiredListings(), 60 * 60 * 1000);
  }
  
  // Method to clean up expired car listings
  async cleanupExpiredListings(): Promise<void> {
    console.log("Running expired listings cleanup...");
    const now = new Date();
    const expiredCarIds: number[] = [];
    
    // Find all expired car listings (available cars with expired dates)
    this.cars.forEach((car, id) => {
      // Check for available cars using the new status field or the old isActive/isSold combo
      const isAvailable = car.status === "available" || (car.isActive === true && car.isSold === false);
      if (isAvailable && car.expiresAt && car.expiresAt < now) {
        expiredCarIds.push(id);
      }
    });
    
    if (expiredCarIds.length === 0) {
      console.log("No expired listings found.");
      return;
    }
    
    console.log(`Found ${expiredCarIds.length} expired listings.`);
    
    // Mark each expired car listing as "expired"
    for (const carId of expiredCarIds) {
      const car = this.cars.get(carId);
      if (car) {
        // Update with new status field and maintain old fields for compatibility
        const updatedCar = { 
          ...car, 
          status: "expired" as const,
          isActive: false 
        };
        this.cars.set(carId, updatedCar);
      }
    }
    
    console.log(`Expired listings cleanup complete. Marked ${expiredCarIds.length} listings as expired.`);
  }
  
  // Hard delete a car and its related data (images, favorites, messages)
  async hardDeleteCar(carId: number): Promise<void> {
    // Delete related car images
    const carImages = await this.getCarImages(carId);
    for (const image of carImages) {
      this.carImages.delete(image.id);
    }
    
    // Delete related favorites
    const allFavorites = Array.from(this.favorites.values());
    for (const favorite of allFavorites) {
      if (favorite.carId === carId) {
        this.favorites.delete(favorite.id);
      }
    }
    
    // Delete related messages
    const allMessages = Array.from(this.messages.values());
    for (const message of allMessages) {
      if (message.carId === carId) {
        this.messages.delete(message.id);
      }
    }
    
    // Finally, delete the car itself
    this.cars.delete(carId);
  }
  
  async createExpiredTestCar(userId: number): Promise<Car> {
    // Create a car with an expiration date in the past for testing purposes
    const car = await this.createCar({
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      price: 12000,
      mileage: 45000,
      condition: 'good',
      color: 'Silver',
      location: 'Nicosia, Cyprus',
      description: 'This is a test expired listing'
    }, userId);
    
    // Set expiration date to one month and one day ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 1);
    
    // Update car with expired date and keep status as "available" 
    // so it can be picked up by the cleanup job
    const updatedCar = { 
      ...car, 
      expiresAt: oneMonthAgo,
      status: "available" as const,
      isActive: true,
      isSold: false,
      viewCount: Math.floor(Math.random() * 50) // Random view count for test car 
    } as Car;
    
    this.cars.set(car.id, updatedCar);
    
    return updatedCar;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      isPremium: false,
      freeListingsUsed: 0,
      phoneVerified: false,
      phone: insertUser.phone || null,
      verificationCode: null,
      verificationCodeExpires: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      avatarUrl: insertUser.avatarUrl || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateAvatar(userId: number, avatarUrl: string): Promise<User | undefined> {
    const existingUser = this.users.get(userId);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, avatarUrl };
    this.users.set(userId, updatedUser);
    return updatedUser;
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
    
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Update user with verification data
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
    return this.cars.get(id);
  }
  
  async getCars(): Promise<Car[]> {
    const now = new Date();
    return Array.from(this.cars.values()).filter(car => {
      // Show only available (not sold, expired, or deleted) cars
      return car.status === "available" && (!car.expiresAt || car.expiresAt > now);
    });
  }
  
  async getCarsByUser(userId: number): Promise<Car[]> {
    // For the car owner, show all their listings, including expired ones
    // The UI can use the expiresAt field to display expired status
    return Array.from(this.cars.values()).filter(car => car.userId === userId);
  }
  
  async countUserActiveCars(userId: number): Promise<number> {
    return Array.from(this.cars.values()).filter(car => car.userId === userId && car.status === "available").length;
  }
  
  async searchCars(search: CarSearch): Promise<Car[]> {
    const now = new Date();
    console.log("Searching cars with criteria:", JSON.stringify(search));
    
    return Array.from(this.cars.values()).filter(car => {
      // Apply search filters - case insensitive for string searches
      if (search.make && search.make !== "" && !car.make.toLowerCase().includes(search.make.toLowerCase())) return false;
      if (search.model && search.model !== "" && !car.model.toLowerCase().includes(search.model.toLowerCase())) return false;
      if (search.minYear && search.minYear > 0 && car.year < search.minYear) return false;
      if (search.maxPrice && search.maxPrice > 0 && car.price > search.maxPrice) return false;
      
      // Only show available cars that haven't expired
      return car.status === "available" && (!car.expiresAt || car.expiresAt > now);
    });
  }
  
  async createCar(car: InsertCar, userId: number): Promise<Car> {
    const id = this.currentCarId++;
    const createdAt = new Date();
    
    // Calculate expiration date (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    // Using type casting to ensure TypeScript compatibility
    const status = "available" as const;
    
    const newCar = { 
      ...car, 
      id, 
      userId, 
      status,
      isActive: true,
      isSold: false,
      viewCount: 0,
      createdAt,
      expiresAt,
      fuelType: car.fuelType || null,
      transmission: car.transmission || null,
      color: car.color || "",
      description: car.description || null,
      bodyType: car.bodyType || null
    } as Car;
    this.cars.set(id, newCar);
    return newCar;
  }
  
  async updateCar(id: number, car: Partial<InsertCar>): Promise<Car | undefined> {
    const existingCar = this.cars.get(id);
    if (!existingCar) return undefined;
    
    // Handle bodyType specifically
    const bodyType = car.bodyType !== undefined ? (car.bodyType || null) : existingCar.bodyType;
    
    const updatedCar = { 
      ...existingCar, 
      ...car,
      bodyType 
    } as Car;
    
    this.cars.set(id, updatedCar);
    return updatedCar;
  }
  
  async deleteCar(id: number): Promise<boolean> {
    const car = this.cars.get(id);
    if (!car) return false;
    
    // Soft delete by setting status to "deleted" and keep old fields updated for compatibility
    const updatedCar = { 
      ...car, 
      status: "deleted" as const, 
      isActive: false
    };
    this.cars.set(id, updatedCar);
    return true;
  }
  
  async markCarAsSold(id: number): Promise<Car | undefined> {
    const car = this.cars.get(id);
    if (!car) return undefined;
    
    // Update with new status field and maintain old fields for compatibility
    const updatedCar = { 
      ...car, 
      status: "sold" as const,
      isSold: true
    };
    this.cars.set(id, updatedCar);
    return updatedCar;
  }

  async markCarAsAvailable(id: number): Promise<Car | undefined> {
    const car = this.cars.get(id);
    if (!car) return undefined;
    
    // Update with new status field and maintain old fields for compatibility
    const updatedCar = { 
      ...car, 
      status: "available" as const,
      isActive: true,
      isSold: false
    };
    this.cars.set(id, updatedCar);
    return updatedCar;
  }
  
  async renewCarListing(id: number): Promise<Car | undefined> {
    const car = this.cars.get(id);
    if (!car) return undefined;
    
    // Calculate new expiration date (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    // Also set status back to available if it was expired
    const status = car.status === "expired" ? "available" as const : car.status;
    const isActive = car.status === "expired" ? true : car.isActive;
    
    const updatedCar = { 
      ...car, 
      expiresAt,
      status,
      isActive
    } as Car;
    
    this.cars.set(id, updatedCar);
    return updatedCar;
  }
  
  async incrementViewCount(id: number): Promise<Car | undefined> {
    const car = this.cars.get(id);
    if (!car) return undefined;
    
    const updatedCar = { 
      ...car, 
      viewCount: (car.viewCount || 0) + 1 
    } as Car;
    
    this.cars.set(id, updatedCar);
    return updatedCar;
  }
  
  // Car image operations
  async getCarImages(carId: number): Promise<CarImage[]> {
    return Array.from(this.carImages.values()).filter(image => image.carId === carId);
  }
  
  async createCarImage(image: InsertCarImage): Promise<CarImage> {
    const id = this.currentCarImageId++;
    const newImage: CarImage = { 
      ...image, 
      id,
      isPrimary: image.isPrimary || false
    };
    this.carImages.set(id, newImage);
    return newImage;
  }
  
  async deleteCarImage(id: number): Promise<boolean> {
    return this.carImages.delete(id);
  }
  
  async setPrimaryImage(carId: number, imageId: number): Promise<boolean> {
    const images = await this.getCarImages(carId);
    for (const image of images) {
      const updated = { ...image, isPrimary: image.id === imageId };
      this.carImages.set(image.id, updated);
    }
    return true;
  }
  
  // Favorite operations
  async getFavorites(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter(fav => fav.userId === userId);
  }
  
  async getFavoriteByUserAndCar(userId: number, carId: number): Promise<Favorite | undefined> {
    return Array.from(this.favorites.values()).find(
      fav => fav.userId === userId && fav.carId === carId
    );
  }
  
  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const createdAt = new Date();
    const newFavorite: Favorite = { ...favorite, id, createdAt };
    this.favorites.set(id, newFavorite);
    return newFavorite;
  }
  
  async deleteFavorite(id: number): Promise<boolean> {
    return this.favorites.delete(id);
  }
  
  // Message operations
  async getMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      msg => msg.receiverId === userId || msg.senderId === userId
    );
  }
  
  async getMessagesByCarAndUsers(carId: number, userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      msg => msg.carId === carId && 
      ((msg.senderId === userId1 && msg.receiverId === userId2) || 
       (msg.senderId === userId2 && msg.receiverId === userId1))
    );
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const createdAt = new Date();
    const newMessage: Message = { ...message, id, isRead: false, createdAt };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) return false;
    
    message.isRead = true;
    this.messages.set(id, message);
    return true;
  }
  
  // Payment operations
  async createPayment(payment: any): Promise<Payment> {
    const id = this.currentPaymentId++;
    const createdAt = new Date();
    const newPayment: Payment = { 
      ...payment, 
      id, 
      createdAt,
      status: payment.status || 'pending',
      stripePaymentIntentId: payment.stripePaymentIntentId || null,
      stripeSubscriptionId: payment.stripeSubscriptionId || null
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }
  
  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.userId === userId);
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    payment.status = status;
    this.payments.set(id, payment);
    return payment;
  }
}

// We'll initialize storage in server/index.ts
export let storage: IStorage = new MemStorage();

// Function to replace the storage implementation
export function setStorageImplementation(newStorage: IStorage): void {
  storage = newStorage;
}
