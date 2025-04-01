// Script to create test users and cars
import { storage } from './server/storage';
import { hashPassword } from './server/auth';
import { InsertUser, InsertCar, InsertMessage } from './shared/schema';

async function setupTestData() {
  try {
    console.log('Setting up test data...');
    
    // Create test users
    const user1 = await createTestUser({
      username: 'seller1',
      password: 'password123',
      name: 'John Seller',
      email: 'john@example.com',
      phone: '+35799112233',
      phoneVerified: true
    });
    
    const user2 = await createTestUser({
      username: 'buyer1',
      password: 'password123',
      name: 'Maria Buyer',
      email: 'maria@example.com',
      phone: '+35799445566',
      phoneVerified: true
    });
    
    console.log(`Created users: ${user1.username} (ID: ${user1.id}) and ${user2.username} (ID: ${user2.id})`);
    
    // Create cars for user1 (seller)
    const car1 = await createTestCar({
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      price: 12500,
      mileage: 45000,
      condition: 'good',
      color: 'Silver',
      location: 'Nicosia, Cyprus',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      description: 'Well maintained Toyota Corolla with full service history. Low mileage and excellent condition.'
    }, user1.id);
    
    const car2 = await createTestCar({
      make: 'Honda',
      model: 'Civic',
      year: 2019,
      price: 15800,
      mileage: 35000,
      condition: 'excellent',
      color: 'Blue',
      location: 'Limassol, Cyprus',
      fuelType: 'Hybrid',
      transmission: 'Automatic',
      description: 'Fuel-efficient Honda Civic hybrid with low emissions. Perfect family car with spacious interior.'
    }, user1.id);
    
    // Create cars for user2 (buyer)
    const car3 = await createTestCar({
      make: 'Volkswagen',
      model: 'Golf',
      year: 2017,
      price: 11200,
      mileage: 60000,
      condition: 'good',
      color: 'Black',
      location: 'Larnaca, Cyprus',
      fuelType: 'Diesel',
      transmission: 'Manual',
      description: 'Economical VW Golf diesel with great fuel economy. Recently serviced with new tires.'
    }, user2.id);
    
    const car4 = await createTestCar({
      make: 'BMW',
      model: '320i',
      year: 2020,
      price: 28500,
      mileage: 25000,
      condition: 'excellent',
      color: 'White',
      location: 'Paphos, Cyprus',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      description: 'Luxury BMW sedan with premium features including leather seats, navigation, and parking sensors.'
    }, user2.id);
    
    console.log(`Created cars: ${car1.make} ${car1.model}, ${car2.make} ${car2.model}, ${car3.make} ${car3.model}, ${car4.make} ${car4.model}`);
    
    // Create test messages between users
    await createTestMessage({
      fromUserId: user2.id,
      toUserId: user1.id,
      carId: car1.id,
      content: "Hi, I'm interested in your Toyota Corolla. Is it still available? Does it have any issues I should know about?"
    });
    
    await createTestMessage({
      fromUserId: user1.id,
      toUserId: user2.id,
      carId: car1.id,
      content: "Hello! Yes, the Corolla is still available. No major issues - it's been regularly serviced and well maintained. Would you like to schedule a viewing?"
    });
    
    await createTestMessage({
      fromUserId: user2.id,
      toUserId: user1.id,
      carId: car2.id,
      content: "I saw your Honda Civic listing. What's the fuel economy like? And does it have Apple CarPlay?"
    });
    
    await createTestMessage({
      fromUserId: user1.id,
      toUserId: user2.id,
      carId: car3.id,
      content: "I noticed your VW Golf listing. Would you consider a trade for my Honda Civic plus some cash difference?"
    });
    
    console.log('Test data setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}

async function createTestUser(userData: Partial<InsertUser>) {
  // Hash the password
  const hashedPassword = await hashPassword(userData.password!);
  
  // Create the user with hashed password
  const user = await storage.createUser({
    ...userData,
    password: hashedPassword,
  } as InsertUser);
  
  return user;
}

async function createTestCar(carData: Partial<InsertCar>, userId: number) {
  const car = await storage.createCar(carData as InsertCar, userId);
  return car;
}

async function createTestMessage(messageData: InsertMessage) {
  const message = await storage.createMessage(messageData);
  console.log(`Created message from user ${messageData.fromUserId} to user ${messageData.toUserId} about car ${messageData.carId}`);
  return message;
}

// Run the setup
setupTestData();