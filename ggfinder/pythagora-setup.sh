#!/bin/bash
# This script prepares the application for deployment on Pythagora

# Install dependencies for the root project, client, and server
echo "Installing dependencies..."
npm install
cd client && npm install
cd ../server && npm install
cd ..

echo "Setup complete!"