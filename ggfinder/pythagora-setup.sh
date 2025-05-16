#!/bin/bash
# This script prepares the application for deployment on Pythagora

# Make script exit on any error
set -e

echo "Starting setup for Pythagora deployment..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

echo "Setup complete! All dependencies have been installed."