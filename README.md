# Trello Clone

A full-stack Trello-like task board application with modern UI, drag-and-drop functionality, and smart recommendations.

## Features

### Core Features
- **Authentication**: JWT-based register, login, logout with secure password hashing
- **Boards**: Create, update, delete boards with custom colors
- **Lists**: Create columns (To Do, In Progress, Done, etc.) with drag-and-drop reordering
- **Cards**: Create tasks with title, description, due dates, labels, and assignees
- **Drag & Drop**: Smooth drag-and-drop for reordering lists and moving cards between lists

### Collaboration
- Invite members to boards by email
- Shared access for viewing and editing boards
- Permission-based access control

### Smart Recommendations
- **Due Date Suggestions**: Automatic suggestions based on keywords (urgent, asap, later, etc.)
- **List Movement Suggestions**: Suggests moving cards based on description (started → In Progress, completed → Done)
- **Related Cards**: Groups cards with similar keywords for better organization

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- dnd-kit for drag-and-drop
- React Router for navigation
- Axios for API calls

## Database Schema

The application uses MongoDB with Mongoose to store data. Here's a simple explanation of how the data is organized:

### User Collection
Stores user account information:
- **name**: User's full name
- **email**: Unique email address for login
- **password**: Securely hashed password (never stored in plain text)
- **avatar**: Optional profile picture URL
- **createdAt**: When the account was created

### Board Collection
Represents project boards (like Trello boards):
- **title**: Board name (e.g., "Website Redesign")
- **description**: Optional description of the project
- **owner**: Reference to the user who created the board
- **members**: Array of users who can access the board (with roles: owner/member)
- **backgroundColor**: Hex color for board background
- **isArchived**: Whether the board is hidden (soft delete)

### List Collection
Represents columns on a board (like "To Do", "In Progress", "Done"):
- **title**: Column name
- **board**: Which board this column belongs to
- **position**: Order of columns (0, 1, 2, etc.)
- **isArchived**: Whether the column is hidden

### Card Collection
Represents individual tasks/cards:
- **title**: Task name
- **description**: Detailed task information
- **list**: Which column the card is in
- **board**: Which board the card belongs to
- **position**: Order within the column
- **dueDate**: Optional deadline
- **labels**: Colored tags (like "urgent", "bug", "feature")
- **assignee**: Which user is responsible for this task
- **isCompleted**: Whether the task is done
- **isArchived**: Whether the card is hidden
- **createdBy**: Who created the card
- **createdAt/updatedAt**: Timestamps

### Invitation Collection
Handles board invitations:
- **board**: Which board the invitation is for
- **inviter**: Who sent the invitation
- **invitee**: Who received the invitation
- **status**: pending/accepted/declined/cancelled
- **message**: Optional personal message
- **expiresAt**: When the invitation expires (7 days)
- **acceptedAt/declinedAt**: When action was taken

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (recommendations)
│   │   └── server.js       # Entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/trello-clone
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Boards
- `GET /api/boards` - Get all boards for user
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board with lists and cards
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:id/members` - Add member by email
- `DELETE /api/boards/:id/members/:userId` - Remove member
- `GET /api/boards/:id/recommendations` - Get smart recommendations

### Lists
- `POST /api/lists` - Create list
- `PUT /api/lists/:id` - Update list
- `PUT /api/lists/reorder` - Reorder lists
- `DELETE /api/lists/:id` - Delete list

### Cards
- `POST /api/cards` - Create card
- `PUT /api/cards/:id` - Update card
- `PUT /api/cards/:id/move` - Move card to different list
- `PUT /api/cards/reorder` - Reorder cards in list
- `DELETE /api/cards/:id` - Delete card

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Board**: Click "Create Board" and give it a name and color
3. **Add Lists**: Click "Add another list" to create columns
4. **Add Cards**: Click "Add a card" in any list to create tasks
5. **Drag & Drop**: Drag cards between lists or reorder lists horizontally
6. **Card Details**: Click on a card to edit title, description, due date, labels, and assignee
7. **Invite Members**: Click "Invite" to add collaborators by email
8. **Recommendations**: Click "Recommendations" to see smart suggestions

## Recommendations Logic

The recommendation system analyzes card content to provide suggestions:

### Due Date Keywords
- **Urgent** (tomorrow): urgent, asap, immediately, critical, emergency, today, now
- **Soon** (1 week): soon, this week, important, priority
- **Later** (1 month): later, low priority, someday, maybe, future

### List Movement Keywords
- **In Progress**: started, working on, in progress, doing, currently, wip
- **Done**: completed, done, finished, resolved, closed, tested, deployed
- **Blocked**: blocked, waiting, stuck, issue, problem

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License
