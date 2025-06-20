# Golf Scorecard Application

## Overview

This is a full-stack golf scorecard application built with React, Express.js, and PostgreSQL. The application allows users to create accounts, host or join golf games, track scores in real-time, and view game history. The frontend is built with React and ShadCN UI components, while the backend uses Express.js with Drizzle ORM for database operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: ShadCN UI (Radix UI primitives with Tailwind CSS)
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon Database)
- **Session Management**: In-memory storage (MemStorage class) with planned database persistence
- **API Structure**: RESTful API with `/api` prefix

## Key Components

### Frontend Components
- **AuthModal**: Handles user authentication (login/register)
- **GameLobby**: Manages game creation and player joining
- **LiveScorecard**: Real-time score tracking during gameplay
- **GameHistory**: Displays past game results and statistics
- **UI Components**: Comprehensive set of reusable components from ShadCN/UI

### Backend Components
- **Storage Interface**: Abstracted storage layer with IStorage interface
- **Routes**: Express route handlers (currently minimal, ready for expansion)
- **Schema**: Drizzle schema definitions for users and game data

### Database Schema
- **Users Table**: 
  - `id` (serial primary key)
  - `username` (unique text)
  - `password` (text)
- Validation handled by Zod schemas generated from Drizzle schema

## Data Flow

1. **Authentication**: Users register/login through AuthModal
2. **Game Creation**: Authenticated users can create games in GameLobby
3. **Game Joining**: Other users can join games using game codes
4. **Score Tracking**: Real-time score entry in LiveScorecard
5. **History**: Completed games stored and accessible in GameHistory

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Router)
- TanStack Query for server state management
- ShadCN UI components (Radix UI primitives)
- Tailwind CSS for styling
- Lucide React for icons
- Date-fns for date manipulation

### Backend Dependencies
- Express.js for server framework
- Drizzle ORM for database operations
- Neon Database serverless driver
- Zod for schema validation
- ESBuild for production builds

### Development Dependencies
- Vite for development server and building
- TypeScript for type safety
- TSX for running TypeScript in development
- Replit-specific plugins for development environment

## Deployment Strategy

### Development
- Uses Vite dev server with HMR (Hot Module Replacement)
- TypeScript compilation with strict settings
- Environment runs on Node.js 20 with PostgreSQL 16
- Port configuration: local 5000, external 80

### Production Build
- Frontend: Vite build to `dist/public`
- Backend: ESBuild bundling to `dist/index.js`
- Single deployment target with autoscaling
- Static file serving integrated with Express

### Environment Configuration
- Database URL required via environment variable
- Drizzle migrations stored in `./migrations`
- Public assets served from built frontend

## Changelog
- June 20, 2025: Initial setup and successful migration from Lovable to Replit
- June 20, 2025: Implemented comprehensive multiplayer golf scorecard application with:
  - Full authentication system with user registration and login
  - Real-time game creation and joining with 6-character game codes
  - Live multiplayer scorecard with automatic redirection when host starts game
  - 18-hole scoring system with handicap calculations
  - Live leaderboard with real-time updates
  - Game completion and result saving functionality
  - Comprehensive game history tracking
  - Responsive design optimized for mobile and desktop

## User Preferences

Preferred communication style: Simple, everyday language.