# Backend-Frontend Connection Guide

This guide explains how the backend and frontend are connected and how to run the application.

## Project Structure

- `backend/` - FastAPI backend application
- `project/` - React frontend application

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure the database:
   - Update `backend/app/core/config.py` or create a `.env` file with your database URL
   - Default database URL: `postgresql://username:password@localhost/emolit_db`
   - Make sure PostgreSQL is running and the database exists

4. Run the backend server:
   ```bash
   python -m app.main
   ```
   Or using uvicorn directly:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be available at `http://localhost:8000`

## Frontend Setup

1. Navigate to the project directory:
   ```bash
   cd project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (optional, defaults to `http://localhost:8000`):
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Run the frontend development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173` (or another port if 5173 is busy)

## Authentication

The application now requires users to log in before accessing any features:

1. **Register**: New users can create an account at `/register`
2. **Login**: Existing users can log in at `/login`
3. **Profile**: Users can view their profile and logout from `/profile`
4. **Protected Routes**: All app pages (Home, Quiz, Journal, Progress) require authentication

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Journal
- `POST /api/journal/entries` - Create a journal entry
- `GET /api/journal/entries` - Get user's journal entries
- `POST /api/journal/analyze-voice` - Analyze voice journal entry

### Progress
- `GET /api/progress` - Get user progress statistics
- `GET /api/progress/stats` - Get user progress (alternative endpoint)
- `GET /api/progress/weekly-activity` - Get weekly activity data
- `GET /api/progress/achievements` - Get user achievements

### Emotions
- `GET /api/emotions/word-of-the-day` - Get word of the day
- `POST /api/emotions/analyze-text` - Analyze text emotions

### Quiz
- `GET /api/quiz/questions` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz answers

## Features Implemented

✅ Authentication system (login/register/logout)
✅ Protected routes (require login)
✅ Profile page with user information
✅ Logout button in header
✅ API service layer connecting frontend to backend
✅ All pages updated to use backend API
✅ User-specific data (journal entries, progress, etc.)

## Notes

- The backend uses JWT tokens for authentication
- Tokens are stored in localStorage on the frontend
- All API requests include the authentication token in the Authorization header
- The backend validates tokens and returns user-specific data
- CORS is configured to allow requests from `http://localhost:5173` and `http://localhost:3000`

## Troubleshooting

1. **CORS errors**: Make sure the backend CORS settings include your frontend URL
2. **Database errors**: Ensure PostgreSQL is running and the database exists
3. **Authentication errors**: Check that tokens are being sent in API requests
4. **API connection errors**: Verify the `VITE_API_BASE_URL` matches your backend URL

