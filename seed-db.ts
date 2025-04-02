// This file is run directly to seed the database
import { seedDatabase } from './server/seedDatabase';

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('Database seeding completed, exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during database seeding:', error);
    process.exit(1);
  });