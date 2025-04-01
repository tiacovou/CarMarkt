import fetch from 'node-fetch';

// This script tests the expired listing cleanup functionality
async function testExpiredListingCleanup() {
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

    // Store the cookies for the subsequent requests
    const cookies = loginRes.headers.get('set-cookie');
    console.log("Login successful!");

    // First, create a test expired listing
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

    const createResult = await createRes.json();
    console.log("Test expired listing created successfully!");
    console.log(createResult);

    // Get the car ID from the created listing
    const carId = createResult.car.id;
    
    // Verify the listing exists by getting all user's cars
    console.log("Verifying the expired listing exists...");
    const carsRes = await fetch('http://localhost:5000/api/user/cars', {
      headers: {
        'Cookie': cookies,
      },
    });

    const carsResult = await carsRes.json();
    const expiredCar = carsResult.find(car => car.id === carId);
    
    if (!expiredCar) {
      throw new Error("Could not find the created expired listing in user's cars");
    }
    
    console.log("Confirmed: Expired listing exists in user's cars.");
    
    // Now run the cleanup process
    console.log("Running expired listings cleanup...");
    const cleanupRes = await fetch('http://localhost:5000/api/cleanup-expired-listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
    });

    if (!cleanupRes.ok) {
      throw new Error(`Failed to run cleanup: ${cleanupRes.statusText}`);
    }

    const cleanupResult = await cleanupRes.json();
    console.log("Cleanup completed:", cleanupResult.message);

    // Verify the listing has been deleted by getting all user's cars again
    console.log("Verifying the expired listing has been deleted...");
    const carsAfterRes = await fetch('http://localhost:5000/api/user/cars', {
      headers: {
        'Cookie': cookies,
      },
    });

    const carsAfterResult = await carsAfterRes.json();
    const carAfterCleanup = carsAfterResult.find(car => car.id === carId);

    if (carAfterCleanup) {
      console.error("FAILED: The expired listing still exists after cleanup!");
    } else {
      console.log("SUCCESS: The expired listing has been properly deleted during cleanup!");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the test function
testExpiredListingCleanup();