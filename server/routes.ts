import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { 
  insertCarSchema, 
  insertMessageSchema, 
  insertPaymentSchema,
  carSearchSchema,
  phoneVerificationRequestSchema,
  phoneVerificationConfirmSchema,
  User
} from "@shared/schema";

// Set up multer for file storage
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_disk = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueId = randomUUID();
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniqueId}${fileExt}`);
  }
});

const upload = multer({ 
  storage: storage_disk,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Check authentication middleware
const checkAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Add a route to get user by ID (public but with limited info)
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return only public information
      const publicUserInfo = {
        id: user.id,
        name: user.name,
        // Phone is only included if the requesting user is authenticated
        phone: req.isAuthenticated() ? user.phone : undefined
      };
      
      res.json(publicUserInfo);
    } catch (error) {
      next(error);
    }
  });
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));
  
  // Car routes
  app.get("/api/cars", async (req, res, next) => {
    try {
      const cars = await storage.getCars();
      
      // Fetch primary image for each car
      const carsWithImages = await Promise.all(cars.map(async (car) => {
        const images = await storage.getCarImages(car.id);
        const primaryImage = images.find(img => img.isPrimary);
        return {
          ...car,
          primaryImageUrl: primaryImage ? primaryImage.imageUrl : null
        };
      }));
      
      res.json(carsWithImages);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/cars/search", async (req, res, next) => {
    try {
      const query = req.query;
      
      // Convert empty strings to undefined for better handling
      const search = {
        make: query.make && (query.make as string).trim() !== "" ? query.make as string : "",
        model: query.model && (query.model as string).trim() !== "" ? query.model as string : "",
        minYear: query.minYear && (query.minYear as string).trim() !== "" ? parseInt(query.minYear as string) : undefined,
        maxPrice: query.maxPrice && (query.maxPrice as string).trim() !== "" ? parseInt(query.maxPrice as string) : undefined
      };
      
      console.log("Search params:", search);
      
      // Validate search params
      const validatedSearch = carSearchSchema.parse(search);
      const cars = await storage.searchCars(validatedSearch);
      
      // Fetch primary image for each car
      const carsWithImages = await Promise.all(cars.map(async (car) => {
        const images = await storage.getCarImages(car.id);
        const primaryImage = images.find(img => img.isPrimary);
        return {
          ...car,
          primaryImageUrl: primaryImage ? primaryImage.imageUrl : null
        };
      }));
      
      res.json(carsWithImages);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/cars/:id", async (req, res, next) => {
    try {
      const car = await storage.getCar(parseInt(req.params.id));
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      // Get primary image
      const images = await storage.getCarImages(car.id);
      const primaryImage = images.find(img => img.isPrimary);
      
      res.json({
        ...car,
        primaryImageUrl: primaryImage ? primaryImage.imageUrl : null
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/cars", checkAuth, async (req, res, next) => {
    try {
      const validatedCar = insertCarSchema.parse(req.body);
      
      // Check if user has reached free listing limit and needs to pay
      const user = await storage.getUser(req.user.id);
      const activeListings = await storage.countUserActiveCars(req.user.id);
      
      if (!user?.isPremium && activeListings >= 5) {
        return res.status(402).json({ 
          message: "You have reached your limit of 5 free car listings. Please upgrade to premium to list more cars.",
          requiresPayment: true
        });
      }
      
      const car = await storage.createCar(validatedCar, req.user.id);
      
      // Increment free listings used if not premium
      if (!user?.isPremium) {
        await storage.updateUser(req.user.id, {
          freeListingsUsed: (user?.freeListingsUsed || 0) + 1
        });
      }
      
      res.status(201).json(car);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/cars/:id", checkAuth, async (req, res, next) => {
    try {
      const carId = parseInt(req.params.id);
      const car = await storage.getCar(carId);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      if (car.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this car" });
      }
      
      const validatedCar = insertCarSchema.partial().parse(req.body);
      const updatedCar = await storage.updateCar(carId, validatedCar);
      res.json(updatedCar);
    } catch (error) {
      next(error);
    }
  });
  
  // Mark car as sold
  app.post("/api/cars/:id/sold", checkAuth, async (req, res, next) => {
    try {
      const carId = parseInt(req.params.id);
      const car = await storage.getCar(carId);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      if (car.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this car" });
      }
      
      const updatedCar = await storage.markCarAsSold(carId);
      
      // Get primary image for the updated car
      const images = await storage.getCarImages(carId);
      const primaryImage = images.find(img => img.isPrimary);
      
      res.json({
        ...updatedCar,
        primaryImageUrl: primaryImage ? primaryImage.imageUrl : null
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/cars/:id", checkAuth, async (req, res, next) => {
    try {
      const carId = parseInt(req.params.id);
      const car = await storage.getCar(carId);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      if (car.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this car" });
      }
      
      await storage.deleteCar(carId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // Car Images routes
  app.get("/api/cars/:id/images", async (req, res, next) => {
    try {
      const carId = parseInt(req.params.id);
      const images = await storage.getCarImages(carId);
      res.json(images);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/cars/:id/images", checkAuth, upload.single('image'), async (req, res, next) => {
    try {
      const carId = parseInt(req.params.id);
      const car = await storage.getCar(carId);
      
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      if (car.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to add images to this car" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      
      // Get existing images to determine if this should be primary
      const existingImages = await storage.getCarImages(carId);
      const isPrimary = existingImages.length === 0;
      
      const imageUrl = `/uploads/${req.file.filename}`;
      const carImage = await storage.createCarImage({
        carId,
        imageUrl,
        isPrimary
      });
      
      res.status(201).json(carImage);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/cars/:carId/images/:imageId/primary", checkAuth, async (req, res, next) => {
    try {
      const carId = parseInt(req.params.carId);
      const imageId = parseInt(req.params.imageId);
      
      const car = await storage.getCar(carId);
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      if (car.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this car" });
      }
      
      await storage.setPrimaryImage(carId, imageId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/cars/:carId/images/:imageId", checkAuth, async (req, res, next) => {
    try {
      const carId = parseInt(req.params.carId);
      const imageId = parseInt(req.params.imageId);
      
      const car = await storage.getCar(carId);
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      if (car.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this car" });
      }
      
      await storage.deleteCarImage(imageId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // User Car routes
  app.get("/api/user/cars", checkAuth, async (req, res, next) => {
    try {
      const cars = await storage.getCarsByUser(req.user.id);
      
      // Fetch primary image for each car
      const carsWithImages = await Promise.all(cars.map(async (car) => {
        const images = await storage.getCarImages(car.id);
        const primaryImage = images.find(img => img.isPrimary);
        return {
          ...car,
          primaryImageUrl: primaryImage ? primaryImage.imageUrl : null
        };
      }));
      
      res.json(carsWithImages);
    } catch (error) {
      next(error);
    }
  });
  
  // Favorites routes
  app.get("/api/user/favorites", checkAuth, async (req, res, next) => {
    try {
      const favorites = await storage.getFavorites(req.user.id);
      res.json(favorites);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/user/favorites", checkAuth, async (req, res, next) => {
    try {
      const carId = parseInt(req.body.carId);
      
      // Check if car exists
      const car = await storage.getCar(carId);
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      // Check if already favorited
      const existing = await storage.getFavoriteByUserAndCar(req.user.id, carId);
      if (existing) {
        return res.status(400).json({ message: "Car already in favorites" });
      }
      
      const favorite = await storage.createFavorite({
        userId: req.user.id,
        carId
      });
      
      res.status(201).json(favorite);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/user/favorites/:id", checkAuth, async (req, res, next) => {
    try {
      const favoriteId = parseInt(req.params.id);
      
      // Get the favorite to check ownership
      const favorites = await storage.getFavorites(req.user.id);
      const favorite = favorites.find(f => f.id === favoriteId);
      
      if (!favorite) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      await storage.deleteFavorite(favoriteId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // Messages routes
  app.get("/api/user/messages", checkAuth, async (req, res, next) => {
    try {
      const messages = await storage.getMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  // Get unread messages count
  app.get("/api/user/messages/unread/count", checkAuth, async (req, res, next) => {
    try {
      console.log("Fetching unread messages count for user:", req.user.id);
      const messages = await storage.getMessages(req.user.id);
      console.log("Total messages for user:", messages.length);
      console.log("Messages:", JSON.stringify(messages));
      const unreadCount = messages.filter(m => !m.isRead && m.toUserId === req.user.id).length;
      console.log("Unread messages count:", unreadCount);
      res.json(unreadCount);
    } catch (error) {
      console.error("Error fetching unread messages count:", error);
      next(error);
    }
  });
  
  app.get("/api/cars/:carId/messages/:userId", checkAuth, async (req, res, next) => {
    try {
      const carId = parseInt(req.params.carId);
      const otherUserId = parseInt(req.params.userId);
      
      const messages = await storage.getMessagesByCarAndUsers(carId, req.user.id, otherUserId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/messages", checkAuth, async (req, res, next) => {
    try {
      const validatedMessage = insertMessageSchema.parse({
        ...req.body,
        fromUserId: req.user.id
      });
      
      // Check if car exists
      const car = await storage.getCar(validatedMessage.carId);
      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }
      
      // Create the message
      const message = await storage.createMessage(validatedMessage);
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/messages/:id/read", checkAuth, async (req, res, next) => {
    try {
      const messageId = parseInt(req.params.id);
      
      // Check if message exists and is addressed to the current user
      const messages = await storage.getMessages(req.user.id);
      const message = messages.find(m => m.id === messageId && m.toUserId === req.user.id);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  
  // Payment routes
  app.get("/api/user/premium-info", checkAuth, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.user.id);
      const activeListings = await storage.countUserActiveCars(req.user.id);
      
      res.json({
        isPremium: user?.isPremium || false,
        freeListingsUsed: user?.freeListingsUsed || 0,
        freeListingsRemaining: Math.max(0, 5 - (user?.freeListingsUsed || 0)),
        activeListings,
        requiresPayment: !user?.isPremium && activeListings >= 5
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/payments", checkAuth, async (req, res, next) => {
    try {
      const { amount, description } = req.body;
      
      // Simple validation
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }
      
      // Create a payment record
      const payment = await storage.createPayment({
        userId: req.user.id,
        amount,
        description,
        status: "pending"
      });
      
      // In a real app, this would integrate with a payment provider
      // For now, we'll simulate successful payment
      
      // Update payment status to completed
      const updatedPayment = await storage.updatePaymentStatus(payment.id, "completed");
      
      // If payment is for premium status, update user
      if (description.includes("premium")) {
        await storage.updateUser(req.user.id, { isPremium: true });
      }
      
      res.status(201).json(updatedPayment);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/user/payments", checkAuth, async (req, res, next) => {
    try {
      const payments = await storage.getPaymentsByUser(req.user.id);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });
  
  // Phone verification routes
  app.get("/api/user/verify-phone/status", checkAuth, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      res.json({
        phone: user?.phone || null,
        verified: user?.phoneVerified || false,
        hasPhone: !!user?.phone
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/user/verify-phone/request", checkAuth, async (req, res, next) => {
    try {
      // Validate phone number
      const validatedData = phoneVerificationRequestSchema.parse(req.body);
      
      // Check if phone is already used by another user
      const existingUserWithPhone = await storage.getUserByPhone(validatedData.phone);
      if (existingUserWithPhone && existingUserWithPhone.id !== req.user.id) {
        return res.status(400).json({ 
          message: "This phone number is already registered to another account" 
        });
      }
      
      // Generate and store verification code
      const code = await storage.createVerificationCode(req.user.id, validatedData.phone);
      
      // In a real app, we would send an SMS with the code
      // For now, we'll just return it in the response for testing
      // NOTE: In production, never return the code directly
      // Instead integrate with an SMS service like Twilio
      
      // Simulate SMS sending
      console.log(`Sending verification code ${code} to ${validatedData.phone}`);
      
      res.json({ 
        message: "Verification code sent",
        // For demo purposes only, this would be removed in production:
        code: code 
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/user/verify-phone/confirm", checkAuth, async (req, res, next) => {
    try {
      // Validate verification data
      const validatedData = phoneVerificationConfirmSchema.parse(req.body);
      
      // Verify the code
      const isVerified = await storage.verifyPhone(req.user.id, validatedData.code);
      
      if (!isVerified) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      
      res.json({ 
        message: "Phone number successfully verified",
        verified: true
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Password change route
  app.post("/api/user/change-password", checkAuth, async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both current and new password are required" });
      }
      
      // Get the user with the current password
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify the current password
      const isPasswordCorrect = await comparePasswords(currentPassword, user.password);
      
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user with the new password
      const updatedUser = await storage.updateUser(req.user.id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Upload avatar image
  app.post("/api/user/avatar", checkAuth, upload.single('avatar'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      
      // Set the image URL
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Update user with new avatar URL
      const updatedUser = await storage.updateAvatar(req.user.id, imageUrl);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ 
        message: "Avatar updated successfully", 
        avatarUrl: imageUrl 
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Update user profile information
  app.patch("/api/user/profile", checkAuth, async (req, res, next) => {
    try {
      const { name, email, phone } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      // Check if email already exists (if changing)
      if (email && email !== req.user.email) {
        const existingUserWithEmail = await storage.getUserByEmail(email);
        if (existingUserWithEmail && existingUserWithEmail.id !== req.user.id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      // Check if phone already exists (if changing and not null)
      if (phone && phone !== req.user.phone) {
        const existingUserWithPhone = await storage.getUserByPhone(phone);
        if (existingUserWithPhone && existingUserWithPhone.id !== req.user.id) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }
      
      // Prepare update data
      const updateData: Partial<User> = { 
        name,
        email: email || req.user.email,
        phone: phone === "" ? null : phone
      };
      
      // If phone number is changed, set phoneVerified to false
      if (phone && phone !== req.user.phone) {
        updateData.phoneVerified = false;
        updateData.verificationCode = null;
        updateData.verificationCodeExpires = null;
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ 
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get phone verification status
  app.get("/api/user/verify-phone/status", checkAuth, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        phone: user.phone,
        verified: user.phoneVerified,
        hasPhone: !!user.phone
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Phone verification endpoints for registration (no auth required)
  app.post("/api/verify-phone/request", async (req, res, next) => {
    try {
      // Validate phone number
      const validatedData = phoneVerificationRequestSchema.parse(req.body);
      
      // Check if phone is already used by another user
      const existingUserWithPhone = await storage.getUserByPhone(validatedData.phone);
      if (existingUserWithPhone) {
        return res.status(400).json({ 
          message: "This phone number is already registered to another account" 
        });
      }
      
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // In a real app, we would store this code in a temporary storage with the phone number
      // and an expiration time. For simplicity in this demo, we're just storing it in memory.
      const tempCodes = req.app.locals.tempCodes || new Map();
      tempCodes.set(validatedData.phone, {
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiration
      });
      
      req.app.locals.tempCodes = tempCodes;
      
      // Simulate SMS sending
      console.log(`Sending verification code ${code} to ${validatedData.phone} for registration`);
      
      res.json({ 
        message: "Verification code sent",
        // For demo purposes only, this would be removed in production:
        code: code 
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Payment handling for user upgrade
  app.post("/api/user/upgrade", checkAuth, async (req, res, next) => {
    try {
      const { amount, description } = req.body;
      
      // Create a payment record
      const payment = await storage.createPayment({
        userId: req.user.id,
        amount,
        description,
        status: "completed"
      });
      
      // Update user to premium
      await storage.updateUser(req.user.id, { isPremium: true });
      
      res.status(201).json({ 
        success: true,
        payment
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Test endpoint to create messages (for development only)
  app.post("/api/test/create-messages", async (req, res, next) => {
    try {
      // Create test users if they don't exist
      let user1 = await storage.getUserByUsername('user1');
      if (!user1) {
        user1 = await storage.createUser({
          username: 'user1',
          password: await hashPassword('password123'),
          name: 'User One',
          email: 'user1@example.com',
          phone: '+35799123456'
        });
      }
      
      let user2 = await storage.getUserByUsername('user2');
      if (!user2) {
        user2 = await storage.createUser({
          username: 'user2',
          password: await hashPassword('password123'),
          name: 'User Two',
          email: 'user2@example.com',
          phone: '+35799789012'
        });
      }
      
      // Create a test car if none exists
      const cars = await storage.getCars();
      let car;
      if (cars.length === 0) {
        car = await storage.createCar({
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          price: 15000,
          mileage: 25000,
          condition: 'excellent'
        }, user1.id);
      } else {
        car = cars[0];
      }
      
      // Create messages between users
      const message1 = await storage.createMessage({
        fromUserId: user1.id,
        toUserId: user2.id,
        carId: car.id,
        content: 'Hi, I\'m interested in your car!'
      });
      
      const message2 = await storage.createMessage({
        fromUserId: user2.id,
        toUserId: user1.id,
        carId: car.id,
        content: 'Great! When would you like to see it?'
      });
      
      const message3 = await storage.createMessage({
        fromUserId: user1.id,
        toUserId: user2.id,
        carId: car.id,
        content: 'How about tomorrow at 2pm?'
      });
      
      // Mark message1 as read
      await storage.markMessageAsRead(message1.id);
      
      res.json({
        success: true,
        users: [user1.id, user2.id],
        car: car.id,
        messages: [message1.id, message2.id, message3.id]
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Integration with Stripe for payments
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("Missing STRIPE_SECRET_KEY environment variable. Stripe payment functionality will be disabled.");
  } else {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });
    
    // Create a payment intent for one-time premium listing fee
    app.post("/api/create-payment-intent", checkAuth, async (req, res, next) => {
      try {
        const { amount, description = "Additional Listing" } = req.body;
        
        if (!amount || amount <= 0) {
          return res.status(400).json({ message: "Invalid payment amount" });
        }
        
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "eur",
          automatic_payment_methods: {
            enabled: true,
          },
        });
        
        // Create payment record
        await storage.createPayment({
          userId: req.user.id,
          amount: amount,
          description: description,
          status: "pending",
          stripePaymentIntentId: paymentIntent.id
        });
        
        res.json({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        next(error);
      }
    });

    // Create a subscription for premium membership
    app.post("/api/create-subscription", checkAuth, async (req, res, next) => {
      try {
        const user = await storage.getUser(req.user.id);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Check if customer already exists
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          // Create a new customer
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
          });
          
          customerId = customer.id;
          
          // Update user with customer ID
          await storage.updateUser(user.id, { stripeCustomerId: customerId });
        }
        
        // Create the subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [
            { price: 'price_1PghnFC7gnJbSTEaXlc3UGGw' }, // Hard-coded for now, use a config in production
          ],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
        });
        
        // Get the client secret from the latest invoice
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
        
        // Create local payment record
        await storage.createPayment({
          userId: user.id,
          amount: 5.00,
          description: "Premium Subscription",
          status: "pending",
          stripePaymentIntentId: paymentIntent.id,
          stripeSubscriptionId: subscription.id
        });
        
        // Return the subscription and client secret
        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        next(error);
      }
    });
    
    // Webhook endpoint to handle Stripe events
    app.post("/api/stripe-webhook", express.raw({type: 'application/json'}), async (req, res) => {
      const sig = req.headers['stripe-signature'];
      
      if (!sig) {
        return res.status(400).send('Webhook Error: No Stripe signature header');
      }
      
      let event;
      
      try {
        // This would use a webhook secret in production
        // event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        event = stripe.webhooks.constructEvent(req.body, sig, 'whsec_12345'); // Replace with actual secret
      } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('PaymentIntent succeeded:', paymentIntent.id);
          
          try {
            // Get all payments
            const payments = Array.from((storage as any).payments.values());
            
            // Find payment by Stripe payment intent ID
            const payment = payments.find((p: any) => p.stripePaymentIntentId === paymentIntent.id);
            
            if (payment) {
              // Update payment status
              await storage.updatePaymentStatus(payment.id, "completed");
              
              // If this was a one-time payment for an additional listing
              if (payment.description.includes("Additional Listing")) {
                const user = await storage.getUser(payment.userId);
                if (user) {
                  // No need to update anything as they've already paid for the specific listing
                  console.log(`User ${user.id} paid for an additional listing`);
                }
              }
            }
          } catch (err) {
            console.error('Error processing payment_intent.succeeded:', err);
          }
          
          break;
          
        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          console.log('Invoice payment succeeded:', invoice.id);
          
          try {
            // Handle subscription payment success
            if (invoice.subscription) {
              // Find the subscription in Stripe
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
              
              // Get all payments
              const payments = Array.from((storage as any).payments.values());
              
              // Find any pending payments for this subscription
              const pendingPayment = payments.find((p: any) => 
                p.status === "pending" && 
                p.description.includes("Premium Subscription")
              );
              
              if (pendingPayment) {
                // Update payment status
                await storage.updatePaymentStatus(pendingPayment.id, "completed");
                
                // Update user subscription information
                const user = await storage.getUser(pendingPayment.userId);
                if (user) {
                  await storage.updateUser(user.id, { 
                    isPremium: true,
                    stripeSubscriptionId: subscription.id
                  });
                  console.log(`User ${user.id} upgraded to premium subscription`);
                }
              }
            }
          } catch (err) {
            console.error('Error processing invoice.payment_succeeded:', err);
          }
          
          break;
          
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          console.log('Subscription canceled:', subscription.id);
          
          try {
            // Find user by subscription ID
            // Loop through all users
            const users = Array.from((storage as any).users.values());
            const user = users.find((u: any) => u.stripeSubscriptionId === subscription.id);
            
            if (user) {
              // Update user to remove premium status
              await storage.updateUser(user.id, {
                isPremium: false,
                stripeSubscriptionId: null
              });
              console.log(`User ${user.id} subscription canceled, premium status removed`);
            }
          } catch (err) {
            console.error('Error processing customer.subscription.deleted:', err);
          }
          
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      // Return a 200 response to acknowledge receipt of the event
      res.send();
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
