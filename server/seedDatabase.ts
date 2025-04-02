// TypeScript version of the seed script
import { hashPassword } from './auth';
import * as schema from '../shared/schema';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, cars } from '../shared/schema';

export async function seedDatabase() {
  try {
    const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
    console.log(`Checking if database needs seeding (${isProduction ? 'production' : 'development'})...`);
    
    // Skip seeding in production unless FORCE_SEED is set
    if (isProduction && !process.env.FORCE_SEED) {
      console.log('Skipping seed in production to preserve data');
      return;
    }
    
    // Connect to the database  
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const db = drizzle(pool, { schema });
    
    // Check if users table is empty
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      console.log('Seeding database with initial data...');
      
      // Create test user
      const hashedPassword = await hashPassword('password123');
      const [user] = await db.insert(users).values({
        username: 'testuser',
        password: hashedPassword,
        email: 'test@example.com',
        name: 'Test User',
        isPremium: false,
        freeListingsUsed: 0,
        phoneVerified: true,
        phone: '+35799123456'
      }).returning();
      
      console.log('Created test user:', user.username);
      
      // Add sample cars
      // Create cars one by one
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      // First car - Toyota Corolla
      const [toyota] = await db.insert(cars).values({
        userId: user.id,
        make: 'Toyota',
        model: 'Corolla',
        year: 2018,
        price: 12500,
        mileage: 45000,
        condition: 'good' as const,
        color: 'Silver',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        bodyType: 'Sedan',
        description: 'Well-maintained Toyota Corolla with service history',
        location: 'Limassol',
        status: 'available' as const,
        viewCount: 0,
        expiresAt
      }).returning();
      console.log(`Created car: ${toyota.make} ${toyota.model}`);
      
      // Second car - BMW 3 Series
      const [bmw] = await db.insert(cars).values({
        userId: user.id,
        make: 'BMW',
        model: '3 Series',
        year: 2020,
        price: 29500,
        mileage: 20000,
        condition: 'excellent' as const,
        color: 'Black',
        fuelType: 'Diesel',
        transmission: 'Automatic',
        bodyType: 'Sedan',
        description: 'Premium BMW 3 Series in excellent condition',
        location: 'Nicosia',
        status: 'available' as const,
        viewCount: 0,
        expiresAt
      }).returning();
      console.log(`Created car: ${bmw.make} ${bmw.model}`);
      
      // Third car - Mercedes-Benz C-Class
      const [mercedes] = await db.insert(cars).values({
        userId: user.id,
        make: 'Mercedes-Benz',
        model: 'C-Class',
        year: 2019,
        price: 35000,
        mileage: 30000,
        condition: 'good' as const,
        color: 'White',
        fuelType: 'Hybrid',
        transmission: 'Automatic',
        bodyType: 'Sedan',
        description: 'Luxury Mercedes C-Class with hybrid engine',
        location: 'Larnaca',
        status: 'available' as const,
        viewCount: 0,
        expiresAt
      }).returning();
      console.log(`Created car: ${mercedes.make} ${mercedes.model}`);
      
      console.log('Database seeding completed successfully');
    } else {
      console.log('Database already has data, skipping seeding');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}