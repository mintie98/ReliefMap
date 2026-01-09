# Backend Development Plan

## 1. Setup & Configuration (Completed)
- [x] Install dependencies (`npm install`)
- [x] Create `.env.example`
- [ ] Configure `.env` with correct database credentials and `JWT_SECRET`
- [ ] Ensure MySQL database `reliefmap` is running and schema is imported

## 2. Authentication System (Completed Code, Needs Testing)
- [x] **Repository**: `UserRepository.js` (Basic CRUD + contribution logic)
- [x] **Service**: `UserService.js` (Hash password, Login, JWT Token generation)
- [x] **Controller**: `UserController.js` (Register, Login, Get Profile)
- [x] **Middleware**: `auth.js` (Protect routes using JWT)
- [x] **Routes**: `routes/users.js` (/register, /login, /profile)

### Testing Auth:
1. **Register**: POST `/api/users/register`
   ```json
   { "user_name": "test", "email": "test@example.com", "password": "password123" }
   ```
2. **Login**: POST `/api/users/login`
3. **Get Profile**: GET `/api/users/profile` (Header: `Authorization: Bearer <token>`)

## 3. Core Features - Locations (Next Step)
- [ ] Review `LocationService.js` logic for merging API & UGC data.
- [ ] Implement `POST /api/locations/ugc` for user contributions.
- [ ] Implement logic to fetching nearby locations using Haversine formula or MySQL spatial functions (if supported).

## 4. Core Features - Reviews
- [ ] Review `ReviewService.js`.
- [ ] Implement `POST /api/reviews` (Link to User ID from Auth token).
- [ ] Handle image uploads for reviews (Multer).

## 5. Admin & Moderation
- [ ] Add `role` check middleware (AdminAccess).
- [ ] Implement APIs for approving/rejecting UGC locations.
