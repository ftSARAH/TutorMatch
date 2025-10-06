# TutorMatch Frontend

A modern React application for the TutorMatch platform built with Vite, Tailwind CSS, and React Router.

## Features

- **Professional UI Design**: Modern, responsive interface with Tailwind CSS
- **Authentication System**: Login and registration with role-based access
- **Role-based Dashboards**: 
  - Admin: User management and system monitoring
  - Teacher: Course creation, student requests, session management
  - Student: Tutor search, course booking, session tracking
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern Components**: Reusable UI components with consistent styling

## Tech Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Icon library
- **Context API** - State management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout with header/footer
│   └── ProtectedRoute.jsx # Route protection component
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state management
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── Login.jsx       # Login page
│   ├── Register.jsx    # Registration page
│   ├── AdminDashboard.jsx    # Admin dashboard
│   ├── TeacherDashboard.jsx  # Teacher dashboard
│   └── StudentDashboard.jsx  # Student dashboard
├── App.jsx             # Main app component with routing
├── index.css           # Global styles with Tailwind
└── main.jsx            # App entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Authentication
- User registration with role selection (Student/Teacher/Admin)
- Login with email and password
- Protected routes based on user role
- Session management with localStorage

### Admin Dashboard
- User management (create, view, edit users)
- System statistics and monitoring
- User search and filtering
- Role-based user creation

### Teacher Dashboard
- Course creation and management
- Student request handling
- Session scheduling and confirmation
- Earnings and performance tracking

### Student Dashboard
- Tutor search and filtering
- Course browsing and booking
- Request management
- Session tracking and confirmation

## API Integration

The frontend integrates with the backend API at `http://localhost:5000/api`:

- `POST /api/admin/users` - Create new users
- `POST /api/auth/login` - User authentication
- Additional endpoints for courses, requests, sessions, etc.

## Styling

The application uses Tailwind CSS for styling with:
- Custom color palette (primary, secondary)
- Responsive design utilities
- Component-based styling approach
- Consistent spacing and typography

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details