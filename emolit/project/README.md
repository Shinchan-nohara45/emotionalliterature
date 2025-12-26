# EmoLit - Emotional Intelligence Learning Platform

A modern web application for expanding emotional vocabulary and tracking emotional experiences.

## Features

- **Word of the Day**: Learn new emotion words daily
- **Interactive Quiz**: Test your knowledge of emotion vocabulary
- **Emotion Journal**: Track your daily emotional experiences
- **Progress Tracking**: Monitor your learning journey with streaks, levels, and XP
- **Voice Journal**: Record and analyze your emotions using voice (coming soon)

## Prerequisites

- Node.js 20.19+ or 22.12+ (Vite requirement)
- npm or yarn

## Frontend Setup

1. Navigate to the project directory:
```bash
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Backend Setup (Optional)

The frontend currently works with localStorage for data persistence. To connect to the backend API:

1. Navigate to the backend directory:
```bash
cd ../backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the backend directory with:
```
DATABASE_URL=postgresql://username:password@localhost/emolit_db
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key  # Optional
```

5. Run the backend server:
```bash
python -m uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

6. Update frontend to use API:
Set `VITE_API_URL=http://localhost:8000` in a `.env` file in the project directory.

## Project Structure

```
project/
├── src/
│   ├── components/      # React components
│   │   ├── home/        # Home page components
│   │   ├── journal/     # Journal components
│   │   ├── quiz/        # Quiz components
│   │   ├── shared/      # Shared components
│   │   └── ui/          # UI component library
│   ├── entities/        # Data models and API clients
│   ├── Layout/          # Layout components
│   ├── pages/           # Page components
│   └── utils/           # Utility functions
└── public/              # Static assets
```

## Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **date-fns** - Date utilities

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Notes

- The application uses localStorage for data persistence by default
- Entity modules can be easily switched to API calls by uncommenting the API code
- Voice recording feature uses mock analysis (backend integration needed for full functionality)
