// Simple script to create test messages in the database
const fetch = require('node-fetch');
const fs = require('fs');

// Change these values as needed
const baseUrl = 'http://localhost:3000';
const username = 'testuser';
const password = 'password123';
const receiverUsername = 'anotheruser'; // Change to another user in your system
const carId = 1; // Change to a valid car ID in your system

async function createTestMessages() {
  try {
    // Step 1: Login to get authentication
    console.log('Logging in...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }
    
    const user = await loginResponse.json();
    console.log(`Logged in as ${user.username} (ID: ${user.id})`);
    
    // Step 2: Get receiver user ID
    console.log(`Getting receiver user details for ${receiverUsername}...`);
    // This requires an API endpoint to get user by username. You might need to add this.
    
    // For testing purposes, we'll just use ID 2 (assuming you have at least 2 users)
    const receiverId = 2;
    
    // Step 3: Create a test message
    console.log('Creating test message...');
    const messageResponse = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carId: carId,
        toUserId: receiverId,
        content: `Test message ${new Date().toISOString()}`
      }),
      credentials: 'include'
    });
    
    if (!messageResponse.ok) {
      throw new Error(`Failed to create message: ${messageResponse.statusText}`);
    }
    
    const message = await messageResponse.json();
    console.log('Message created successfully:', message);
    
    // Step 4: Check unread message count
    console.log('Checking unread message count...');
    const countResponse = await fetch(`${baseUrl}/api/user/messages/unread/count`, {
      credentials: 'include'
    });
    
    if (!countResponse.ok) {
      throw new Error(`Failed to get unread count: ${countResponse.statusText}`);
    }
    
    const count = await countResponse.json();
    console.log(`Unread message count: ${count}`);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestMessages();