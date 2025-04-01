import fetch from 'node-fetch';

// This script creates a test expired car listing by calling the API endpoint
async function createExpiredListing() {
  try {
    // We need to login first to get a session cookie
    console.log("Logging in as admin...");
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'seller1',
        password: 'password123',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.statusText}`);
    }

    // Store the cookies for the subsequent request
    const cookies = loginRes.headers.get('set-cookie');
    console.log("Login successful!");

    // Make the request to create a test expired listing
    console.log("Creating test expired listing...");
    const createRes = await fetch('http://localhost:5000/api/create-test-expired-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create expired listing: ${createRes.statusText}`);
    }

    const result = await createRes.json();
    console.log("Test expired listing created successfully!");
    console.log(result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the function
createExpiredListing();