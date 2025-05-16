# ggFINDER

ggFINDER is a minimalist, web-based advertisement platform designed to help users create, search, and view adverts for events, services, or activities such as gaming groups and sports meetups. Inspired by the simplicity of google.com, ggFINDER prioritizes a clean, intuitive, and user-friendly interface.

## Overview

ggFINDER consists of a frontend built with ReactJS and a backend implemented using Express.js. The architecture is designed to ensure a seamless experience across devices with responsive and minimalist design principles.

### Frontend

- **Framework**: ReactJS with Vite as the dev server
- **Component Library**: shadcn-ui with Tailwind CSS for styling
- **Routing**: `react-router-dom` for client-side routing
- **Folder Structure**: 
  - `client/src/pages/` for page components
  - `client/src/components/` for reusable components
- **Port**: Runs on port 5173

### Backend

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose for data management with potential deployment configuration for Supabase
- **Authentication**: Token-based with JWT (using bearer access and refresh tokens)
- **Folder Structure**: 
  - `server/` folder containing all backend logic and API implementations
- **Port**: Runs on port 3000

**Concurrent Execution**: Both frontend and backend are run together using Concurrently with a single command (`npm run start`).

## Features

1. **User Authentication**:
   - Users can sign up and log in through Google, Apple, or email/password.
   - Guest access to view adverts without signing in.

2. **Advert Creation**:
   - Includes title and description with optional image, location, custom fields, and tags.
   - Users can save or publish adverts.
   - Free-tier limitations: 1 image, 5 custom fields, 5 tags.

3. **Search Functionality**:
   - Search bar for keyword search, tag filtering, and optional location-based filtering.
   - Results sorted by relevance or date, displaying active adverts with details.

4. **Advert Display**:
   - Detailed advert view with title, description, image, tags, location, and custom fields.

5. **Multi-Language Support**:
   - Language selector for multiple languages including English, Spanish, and French.

6. **User Profiles**:
   - View and manage created adverts.
   - Track "Good Karma" based on total upvotes received on adverts.

7. **Karma System**:
   - Upvote system where registered users can upvote adverts.
   - Ability to undo upvotes and retain karma points even if an advert is deleted.

8. **Donations and Subscriptions**:
   - Option for users to make donations and plan for a subscription model to post more than three adverts.

9. **Error Reporting and Resolution**:
   - Real-time error reporting and logging for backend using tools like Sentry.

10. **Deployment**:
    - Structured to be deployed on pythagora.ai, adhering to specific requirements.

## Getting started

### Requirements

- **Node.js** (version 14.x or later)
- **npm** (version 6.x or later)
- **MongoDB** for backend data management (if not deploying to Supabase)
- **Supabase account** (if using Supabase instead of MongoDB)

### Quickstart

1. **Clone the repository**:
   ```sh
   git clone https://github.com/your-repo/ggFINDER.git
   cd ggFINDER
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the `server/` directory with the following variables:
     ```sh
     MONGODB_URI=<your-mongodb-uri>
     JWT_SECRET=<your-jwt-secret>
     SUPABASE_URL=<your-supabase-url>
     SUPABASE_ANON_KEY=<your-supabase-anon-key>
     ```

4. **Run the application**:
   ```sh
   npm run start
   ```

5. **Access the application**:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000/api](http://localhost:3000/api)

### License

The project is proprietary. Copyright (c) 2024.