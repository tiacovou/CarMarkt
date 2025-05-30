// This file is intentionally in JavaScript to avoid TypeScript import issues
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { hashPassword } = require('./auth');
const schema = require('../shared/schema');

async function seedDatabase() {
  try {
    console.log('Checking if database needs seeding...');
    
    // Connect to the database  
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const db = drizzle(pool, { schema });
    
    // Check if users table is empty
    const existingUsers = await db.select().from(schema.users);
    
    if (existingUsers.length === 0) {
      console.log('Seeding database with initial data...');
      
      // Create test user
      const hashedPassword = await hashPassword('password123');
      const [user] = await db.insert(schema.users).values({
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
      const carsToCreate = [
        {
          userId: user.id,
          make: 'Toyota',
          model: 'Corolla',
          year: 2018,
          price: 12500,
          mileage: 45000,
          condition: 'good',
          color: 'Silver',
          fuelType: 'Petrol',
          transmission: 'Automatic',
          bodyType: 'Sedan',
          description: 'Well-maintained Toyota Corolla with service history',
          location: 'Limassol',
          status: 'available',
          viewCount: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        {
          userId: user.id,
          make: 'BMW',
          model: '3 Series',
          year: 2020,
          price: 29500,
          mileage: 20000,
          condition: 'excellent',
          color: 'Black',
          fuelType: 'Diesel',
          transmission: 'Automatic',
          bodyType: 'Sedan',
          description: 'Premium BMW 3 Series in excellent condition',
          location: 'Nicosia',
          status: 'available',
          viewCount: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          userId: user.id,
          make: 'Mercedes-Benz',
          model: 'C-Class',
          year: 2019,
          price: 35000,
          mileage: 30000,
          condition: 'good',
          color: 'White',
          fuelType: 'Hybrid',
          transmission: 'Automatic',
          bodyType: 'Sedan',
          description: 'Luxury Mercedes C-Class with hybrid engine',
          location: 'Larnaca',
          status: 'available',
          viewCount: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ];
      
      for (const car of carsToCreate) {
        const [createdCar] = await db.insert(schema.cars).values(car).returning();
        console.log(`Created car: ${createdCar.make} ${createdCar.model}`);
      }
      
      console.log('Database seeding completed successfully');
    } else {
      console.log('Database already has data, skipping seeding');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

// If run directly
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seed script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
}

module.exports = { seedDatabase };