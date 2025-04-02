#!/bin/bash
# This script is run after deployment to seed the database only if needed
if [ "$REPLIT_DEPLOYMENT" != "1" ]; then
  echo "Running seed in development environment"
  node server/seedDatabase.js
else
  echo "Skipping seed in production environment to preserve data"
fi

