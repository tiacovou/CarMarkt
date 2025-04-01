import { storage } from './server/storage.js';

async function addTestData() {
  try {
    // First, let's create two users if they don't exist
    let user1 = await storage.getUserByUsername('user1');
    let user2 = await storage.getUserByUsername('user2');
    
    if (!user1) {
      user1 = await storage.createUser({
        username: 'user1',
        password: 'password123',
        name: 'User One',
        email: 'user1@example.com',
        phone: '+35799123456'
      });
      console.log('Created user1:', user1.id);
    } else {
      console.log('User1 already exists with ID:', user1.id);
    }
    
    if (!user2) {
      user2 = await storage.createUser({
        username: 'user2',
        password: 'password123',
        name: 'User Two',
        email: 'user2@example.com',
        phone: '+35799789012'
      });
      console.log('Created user2:', user2.id);
    } else {
      console.log('User2 already exists with ID:', user2.id);
    }
    
    // Create a test car if it doesn't exist
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
      console.log('Created test car:', car.id);
    } else {
      car = cars[0];
      console.log('Using existing car:', car.id);
    }
    
    // Create messages between the users
    // From user1 to user2
    const message1 = await storage.createMessage({
      fromUserId: user1.id,
      toUserId: user2.id,
      carId: car.id,
      content: 'Hi, I\'m interested in your car!'
    });
    console.log('Created message from user1 to user2:', message1.id);
    
    // Reply from user2 to user1
    const message2 = await storage.createMessage({
      fromUserId: user2.id,
      toUserId: user1.id,
      carId: car.id,
      content: 'Great! When would you like to see it?'
    });
    console.log('Created message from user2 to user1:', message2.id);
    
    // Another message from user1 to user2 (will be unread)
    const message3 = await storage.createMessage({
      fromUserId: user1.id,
      toUserId: user2.id,
      carId: car.id,
      content: 'How about tomorrow at 2pm?'
    });
    console.log('Created message from user1 to user2:', message3.id);
    
    // Mark message1 as read
    await storage.markMessageAsRead(message1.id);
    console.log('Marked message1 as read');
    
    // Check messages for user2
    const messagesUser2 = await storage.getMessages(user2.id);
    console.log('Messages for user2:', messagesUser2);
    
    // Check unread count for user2
    const unreadCount = messagesUser2.filter(m => !m.isRead && m.toUserId === user2.id).length;
    console.log('Unread count for user2:', unreadCount);
    
    console.log('Done adding test data!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

addTestData();