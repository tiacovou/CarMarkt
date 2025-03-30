import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { randomUUID } from "crypto";
import { 
  insertCarSchema, 
  insertMessageSchema, 
  carSearchSchema
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
      res.json(cars);
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
      res.json(cars);
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
      res.json(car);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/cars", checkAuth, async (req, res, next) => {
    try {
      const validatedCar = insertCarSchema.parse(req.body);
      const car = await storage.createCar(validatedCar, req.user.id);
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
      res.json(cars);
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

  const httpServer = createServer(app);
  return httpServer;
}
