import { 
  users, type User, type InsertUser,
  cars, type Car, type InsertCar,
  carImages, type CarImage, type InsertCarImage,
  favorites, type Favorite, type InsertFavorite,
  messages, type Message, type InsertMessage,
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
  createUser(user: InsertUser): Promise<User>;
  
  // Car operations
  getCar(id: number): Promise<Car | undefined>;
  getCars(): Promise<Car[]>;
  getCarsByUser(userId: number): Promise<Car[]>;
  searchCars(search: CarSearch): Promise<Car[]>;
  createCar(car: InsertCar, userId: number): Promise<Car>;
  updateCar(id: number, car: Partial<InsertCar>): Promise<Car | undefined>;
  deleteCar(id: number): Promise<boolean>;
  
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
  
  // Session storage
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cars: Map<number, Car>;
  private carImages: Map<number, CarImage>;
  private favorites: Map<number, Favorite>;
  private messages: Map<number, Message>;
  
  sessionStore: session.SessionStore;
  
  currentUserId: number;
  currentCarId: number;
  currentCarImageId: number;
  currentFavoriteId: number;
  currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.cars = new Map();
    this.carImages = new Map();
    this.favorites = new Map();
    this.messages = new Map();
    
    this.currentUserId = 1;
    this.currentCarId = 1;
    this.currentCarImageId = 1;
    this.currentFavoriteId = 1;
    this.currentMessageId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Car operations
  async getCar(id: number): Promise<Car | undefined> {
    return this.cars.get(id);
  }
  
  async getCars(): Promise<Car[]> {
    return Array.from(this.cars.values()).filter(car => car.isActive);
  }
  
  async getCarsByUser(userId: number): Promise<Car[]> {
    return Array.from(this.cars.values()).filter(car => car.userId === userId);
  }
  
  async searchCars(search: CarSearch): Promise<Car[]> {
    return Array.from(this.cars.values()).filter(car => {
      if (search.make && car.make.toLowerCase() !== search.make.toLowerCase()) return false;
      if (search.model && car.model.toLowerCase() !== search.model.toLowerCase()) return false;
      if (search.minYear && car.year < search.minYear) return false;
      if (search.maxPrice && car.price > search.maxPrice) return false;
      return car.isActive;
    });
  }
  
  async createCar(car: InsertCar, userId: number): Promise<Car> {
    const id = this.currentCarId++;
    const createdAt = new Date();
    const newCar: Car = { ...car, id, userId, isActive: true, createdAt };
    this.cars.set(id, newCar);
    return newCar;
  }
  
  async updateCar(id: number, car: Partial<InsertCar>): Promise<Car | undefined> {
    const existingCar = this.cars.get(id);
    if (!existingCar) return undefined;
    
    const updatedCar = { ...existingCar, ...car };
    this.cars.set(id, updatedCar);
    return updatedCar;
  }
  
  async deleteCar(id: number): Promise<boolean> {
    const car = this.cars.get(id);
    if (!car) return false;
    
    // Soft delete by setting isActive to false
    car.isActive = false;
    this.cars.set(id, car);
    return true;
  }
  
  // Car image operations
  async getCarImages(carId: number): Promise<CarImage[]> {
    return Array.from(this.carImages.values()).filter(image => image.carId === carId);
  }
  
  async createCarImage(image: InsertCarImage): Promise<CarImage> {
    const id = this.currentCarImageId++;
    const newImage: CarImage = { ...image, id };
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
      msg => msg.toUserId === userId || msg.fromUserId === userId
    );
  }
  
  async getMessagesByCarAndUsers(carId: number, userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      msg => msg.carId === carId && 
      ((msg.fromUserId === userId1 && msg.toUserId === userId2) || 
       (msg.fromUserId === userId2 && msg.toUserId === userId1))
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
}

export const storage = new MemStorage();
