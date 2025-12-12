# ReliefMap - WC Location Finder

A web application to find WC (toilet) locations from Google API data and user-generated content (UGC).

## Architecture

### Backend (Node.js + Express.js)
- **Layered Architecture**:
  - **Controllers**: Handle HTTP requests/responses (`/backend/controllers/`)
  - **Services**: Business logic layer (`/backend/services/`)
  - **Repositories**: Data access layer (`/backend/repositories/`)
  - **Routes**: API route definitions (`/backend/routes/`)
  - **Config**: Database and configuration (`/backend/config/`)

### Frontend (Vue.js)
- **MVVM Pattern**:
  - **Models**: Data models (`/frontend/src/models/`)
  - **ViewModels**: Business logic and state management (`/frontend/src/viewmodels/`)
  - **Views**: UI components (`/frontend/src/views/`)
  - **Services**: API communication (`/frontend/src/services/`)

## Features

- 🔍 Search WC locations from Google Places API
- 📍 Display locations on interactive map
- ⭐ User reviews and ratings
- ➕ User-generated content (UGC) contributions
- ✅ Verification system with trust scores
- 🎯 Filter by verification status and source type
- 📱 Responsive design

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- Google Maps API key

## Installation

### 1. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE reliefmap;
USE reliefmap;

# Import schema
mysql -u root -p reliefmap < reliefmap.sql
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials and API keys
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=reliefmap
# GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env

# Edit .env file
# VITE_API_BASE_URL=http://localhost:3000/api
# VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3000`

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## API Endpoints

### Locations

- `GET /api/locations/search` - Search locations with filters
- `GET /api/locations/search-text?q=query` - Search by text
- `GET /api/locations/google-search?query=...` - Search Google Places API
- `GET /api/locations/:id` - Get location by ID
- `POST /api/locations/import-google` - Import location from Google API
- `POST /api/locations/ugc` - Create location from UGC
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Reviews

- `GET /api/reviews/location/:locationId` - Get reviews by location
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:reviewId/images` - Add image to review

### Amenities

- `GET /api/amenities/location/:locationId` - Get amenities by location
- `POST /api/amenities/location/:locationId` - Create amenities
- `PUT /api/amenities/location/:locationId` - Update amenities

## Project Structure

```
ReliefMap/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── LocationController.js
│   │   ├── ReviewController.js
│   │   └── AmenityController.js
│   ├── repositories/
│   │   ├── LocationRepository.js
│   │   ├── UserRepository.js
│   │   ├── ReviewRepository.js
│   │   └── AmenityRepository.js
│   ├── services/
│   │   ├── LocationService.js
│   │   ├── ReviewService.js
│   │   └── AmenityService.js
│   ├── routes/
│   │   ├── locations.js
│   │   ├── reviews.js
│   │   ├── amenities.js
│   │   └── users.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Location.js
│   │   │   └── Review.js
│   │   ├── viewmodels/
│   │   │   ├── LocationViewModel.js
│   │   │   └── ReviewViewModel.js
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   └── MapView.vue
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── LocationService.js
│   │   │   └── ReviewService.js
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── reliefmap.sql
└── README.md
```

## Technologies Used

### Backend
- Node.js
- Express.js
- MySQL2
- Axios (for Google API calls)
- dotenv

### Frontend
- Vue.js 3
- Vue Router
- Pinia (state management)
- Axios
- Google Maps JavaScript API
- Vite

## Security & API Keys

⚠️ **IMPORTANT**: Never commit `.env` files to Git!

### Protecting API Keys

1. **Backend**: File `.env` is already in `.gitignore`
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your actual API keys and credentials
   - The `.env` file will NOT be committed to Git

2. **Frontend**: File `.env` is already in `.gitignore`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Fill in your actual API keys
   - Note: Frontend `.env` variables are exposed to the browser (use environment-specific restrictions in Google Cloud Console)

### Before Pushing to GitHub

```bash
# Check if .env files are tracked (should return nothing)
git ls-files | grep .env

# If .env files appear, remove them from Git tracking:
git rm --cached backend/.env
git rm --cached frontend/.env

# Verify .env is in .gitignore
cat .gitignore | grep .env
```

### Google Maps API Key Security

1. **Restrict API Key** in Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Select your API key
   - Add HTTP referrer restrictions (for frontend)
   - Add IP restrictions (for backend)
   - Restrict to specific APIs only (Maps JavaScript API, Places API)

2. **Backend API Key**: Keep it server-side only
3. **Frontend API Key**: Use domain restrictions

## License

ISC

