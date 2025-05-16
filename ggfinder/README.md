# ggFINDER

**ggFINDER** is a web application that serves as an advertisement platform where users can create, search, and view adverts for events, services, or activities such as gaming groups and sports meetups. Inspired by the clean, intuitive design of google.com, ggFINDER aims to provide simplicity and ease of use.

## Overview

ggFINDER consists of two main parts:
1. **Frontend**: A ReactJS-based frontend located in the `client/` folder using the Vite build tool and development server, integrated with the Shadcn-UI component library and Tailwind CSS framework. Client-side routing is managed by `react-router-dom`, with components and pages organized under `client/src/components/` and `client/src/pages/` respectively.

2. **Backend**: An Express-based server that provides REST API endpoints, located in the `server/` folder. The server handles user authentication with JWT tokens, advert management, and interacts with both MongoDB and Supabase for data storage.

Both parts are configured to work concurrently using the `concurrently` NPM package, allowing simultaneous execution with a single startup command (`npm run start`). The application supports deployments on the Pythagora.ai hosting environment.

### Project Structure

#### Frontend:
- **ReactJS with Vite**: For a fast and optimized development experience.
- **Shadcn-UI and Tailwind CSS**: For a consistent, minimalist user interface design.
- **React Router**: For managing application routing.
- **Component and Page Segregation**: Provides easy scalability and code management.

#### Backend:
- **Express.js**: For handling RESTful API endpoints.
- **MongoDB with Mongoose**: For flexible, scalable data storage.
- **Supabase**: As an alternative backend option and for specific use-cases like health checks.
- **JWT Authentication**: For secure user sessions.
- **Pino Logging**: For effective logging and error tracking.

## Features

- **User Authentication**: Users can sign up/sign in via Google, Apple, or email/password. User authentication features including registration, login, and token management are enabled.
- **Guest Access**: View adverts without signing in.
- **Advert Creation**: Users can create adverts with required (title, description) and optional fields (image, location, custom fields, tags).
- **Search Functionality**: A search bar similar to Google's enables keyword search, tag filtering, and location-based filtering.
- **Advert Display**: Adverts display title, description, image, tags, location, and custom fields.
- **User Profile**: Basic profile page to view and edit created adverts.
- **Donations and Subscriptions**: Support operation and growth of the project through donations and planned subscription models.
- **Multi-Language Support**: Interface available in multiple languages.

## Getting Started

### Requirements

To run the ggFINDER project, you need the following:
- Node.js (v14.x or later)
- npm (v6.x or later)
- MongoDB (local instance or cloud service)
- Supabase account for backend services

### Quickstart

1. **Clone the repository:**
   ```sh
   git clone [REPOSITORY_URL]
   cd ggFINDER
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Environment Setup:**
   - Rename `server/.env.example` to `.env` and update it with your MongoDB and Supabase credentials.

4. **Start the application:**
   ```sh
   npm run start
   ```
   
   This command starts both the frontend on port 5173 and the backend on port 3000 concurrently.

5. **Access the application:**
   - Open your browser and navigate to `http://localhost:5173` to interact with the ggFINDER frontend interface.

### License

```
Copyright (c) 2024.
```

ggFINDER is proprietary software and is not open source. All rights reserved.