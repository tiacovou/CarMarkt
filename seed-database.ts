import { initDb } from './server/db';
import { users, cars } from './shared/schema';
import { hashPassword } from './server/auth';

export async function seedDatabase() {
  console.log('Checking if database needs seeding...');
  
  try {
    // Initialize the database connection
    const { db } = await initDb();
    
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
        const [createdCar] = await db.insert(cars).values(car).returning();
        console.log(`Created car: ${createdCar.make} ${createdCar.model}`);
      }
      
      console.log('Database seeding completed successfully');
    } else {
      console.log('Database already has data, skipping seeding');
    }
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
}