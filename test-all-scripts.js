import { exec } from 'child_process';

// This script sequentially runs all the test scripts in the project

console.log("Starting all test scripts...");

// First, create test users and data
exec('tsx setup-test-data.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error setting up test data: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Setup test data stderr: ${stderr}`);
  }
  console.log(`Setup test data output:\n${stdout}`);
  
  // Then, test the expired listing functionality
  exec('node test-expired-listing.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running expired listing test: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Expired listing test stderr: ${stderr}`);
    }
    console.log(`Expired listing test output:\n${stdout}`);
    
    // Finally, test messages
    exec('node test-message.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running message test: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Message test stderr: ${stderr}`);
      }
      console.log(`Message test output:\n${stdout}`);
      
      console.log("All test scripts completed!");
    });
  });
});