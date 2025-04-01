// Script to create test users and cars
import { storage } from './server/storage.js';
import { hashPassword } from './server/auth.js';

async function setupTestData() {
  try {
    console.log('Setting up test data...');
    
    // Create test users
    const user1 = await createTestUser({
      username: 'seller1',
      password: 'password123',
      name: 'John Seller',
      email: 'john@example.com',
      phone: '+35799112233'
    });
    
    // Manually verify the phone number
    await storage.verifyPhone(user1.id, "1234");
    
    const user2 = await createTestUser({
      username: 'buyer1',
      password: 'password123',
      name: 'Maria Buyer',
      email: 'maria@example.com',
      phone: '+35799445566'
    });
    
    // Manually verify the phone number
    await storage.verifyPhone(user2.id, "1234");
    
    console.log(`Created users: ${user1.username} (ID: ${user1.id}) and ${user2.username} (ID: ${user2.id})`);
    
    // Create cars for user1 (seller)
    const car1 = await createTestCar({
      userId: user1.id,
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
    });
    
    const car2 = await createTestCar({
      userId: user1.id,
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
    });
    
    // Create cars for user2 (buyer)
    const car3 = await createTestCar({
      userId: user2.id,
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
    });
    
    const car4 = await createTestCar({
      userId: user2.id,
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
    });
    
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

async function createTestUser(userData) {
  // Hash the password
  const hashedPassword = await hashPassword(userData.password);
  
  // Create the user with hashed password
  const user = await storage.createUser({
    ...userData,
    password: hashedPassword,
  });
  
  return user;
}

async function createTestCar(carData) {
  const car = await storage.createCar(carData, carData.userId);
  return car;
}

async function createTestMessage(messageData) {
  const message = await storage.createMessage(messageData);
  console.log(`Created message from user ${messageData.fromUserId} to user ${messageData.toUserId} about car ${messageData.carId}`);
  return message;
}

// Run the setup
setupTestData();