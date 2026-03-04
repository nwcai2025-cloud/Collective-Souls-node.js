# Events Calendar Feature

## Overview
The Events Calendar feature allows users to create, manage, and join spiritual events. Event owners can create chat rooms for their events within 6 hours of the event start time.

## Features

### Event Management
- Create events with title, description, type, start/end time, and location
- Edit and delete events you own
- Join events created by others
- View events in calendar or list format

### Event Types
- Meditation
- Yoga
- Workshop
- Gathering
- Other

### Event Chat Rooms
- Event owners can create chat rooms within 6 hours of event start time
- Chat rooms are automatically created with `room_type: 'event'`
- Event chat rooms appear in the **Events tab** in Chat, not in the main Rooms list
- Clicking an event with a chat room in the Events tab opens the chat

## Technical Implementation

### Backend
- **Model**: `backend/models/Event.js` - Event model with chat_room_id foreign key
- **Model**: `backend/models/Chat.js` - ChatRoom model with `room_type: 'event'` validation
- **Routes**: `backend/routes/events.js` - Event CRUD operations
- **Routes**: `backend/routes/user-events.js` - User-event relationships and room creation

### Frontend
- **Calendar Component**: `frontend/src/components/CalendarView.tsx` - Calendar view with event display
- **Events Page**: `frontend/src/pages/Events.tsx` - Events listing and management
- **Profile Page**: `frontend/src/pages/Profile.tsx` - User's personal events calendar
- **Chat Page**: `frontend/src/pages/Chat.tsx` - Events tab for event chat rooms

### API Endpoints

#### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

#### User Events
- `GET /api/user-events` - Get user's events
- `GET /api/user-events/owners` - Get events user owns
- `GET /api/user-events/upcoming` - Get upcoming events
- `GET /api/user-events/past` - Get past events
- `GET /api/user-events/room-eligible` - Get events eligible for room creation
- `POST /api/user-events/:eventId/create-room` - Create chat room for event

### Room Creation Flow
1. User clicks "Create Room" on their event in the calendar
2. Frontend calls `POST /api/user-events/:eventId/create-room`
3. Backend validates:
   - User owns the event
   - Event is within 6 hours of start time
   - Room doesn't already exist
4. Backend creates:
   - ChatRoom with `room_type: 'event'`
   - RoomParticipant entry for owner (as admin)
   - System message announcing room creation
5. Backend updates Event with `chat_room_id` and `room_created: true`

### Database Schema

#### Events Table
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type ENUM('meditation', 'yoga', 'workshop', 'gathering', 'other'),
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  location VARCHAR(255) DEFAULT 'Online',
  is_private BOOLEAN DEFAULT 0,
  max_participants INTEGER DEFAULT 100,
  created_by INTEGER NOT NULL,
  room_url TEXT,
  room_type ENUM('chat', 'video', 'both'),
  room_created BOOLEAN DEFAULT 0,
  chat_room_id INTEGER,
  event_status ENUM('upcoming', 'active', 'completed', 'cancelled') DEFAULT 'upcoming',
  createdAt DATETIME,
  updatedAt DATETIME
);
```

#### User Events Table
```sql
CREATE TABLE user_events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status ENUM('owner', 'joined', 'interested') DEFAULT 'joined',
  event_status ENUM('upcoming', 'active', 'completed', 'cancelled') DEFAULT 'upcoming',
  room_created BOOLEAN DEFAULT 0,
  chat_room_id INTEGER,
  room_created_at DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

## UI/UX

### Chat Page Events Tab
- Events are displayed with a calendar icon
- Events with active chat rooms show a "Live Chat" badge
- Clicking an event with a chat room opens the chat
- Clicking an event without a room navigates to the Events page

### Calendar View
- Monthly calendar with event dots
- Click on a day to see events
- "Create Room" button appears for events within 6 hours
- Visual indicators for event status

## Recent Updates (February 2026)

### Event Chat Rooms Separation
- Event chat rooms (`room_type: 'event'`) are now filtered from the main Rooms tab
- Event rooms only appear in the Events tab in Chat
- This prevents cluttering the community rooms list with event-specific chats

### Foreign Key Constraint Fix
- Fixed SQLite foreign key constraint error when linking events to chat rooms
- Used `PRAGMA foreign_keys = OFF/ON` to bypass constraint during room creation
- Updated Event model to reference correct table (`chat_rooms_new`)

### Room Type Validation
- Added `'event'` to valid room types in ChatRoom model
- Room creation modal excludes 'event' type (only used for auto-created event rooms)