# TODO List

## ASAP ##
## 
## Use the "Report" button for concerning content. Set it up
## Optimize Admin pannel.
## Add database backup/restore functionality to admin panel

## Addon's  
- I want to have an event's calendar
- on users profile showing there events they have joined.
- When users click the button to join the event I want the
- calerdar updated on users page that clcik the join.
- On the profile evets calendar of event creator. I want

## Addon's  
- I want to have an event's calendar
- on users profile showing there events they have joined.
- When users click the button to join the event I want the
- calerdar updated on users page that clcik the join.
- On the profile evets calendar of event creator. I want
- a button that will create an event room when button clikced. 



## 1. Phone-Based Authentication with Email Verification

**Description:** Switch from username-based to phone-based authentication system similar to Telegram.

**Features:**
- Phone Number Authentication - Users log in with phone number instead of username
- Phone numbers are unique, required, and PRIVATE (not visible to other users)
- Email Verification - Collect email during registration, send verification codes via Gmail SMTP
- Native Phone/Video Calls - Phone and video buttons in chat use `tel:` links

**Requirements:** Gmail account for SMTP, App password from Google account

**Status:** Not started - Requires Gmail account for SMTP setup

---

## 2. Site-Wide Notification System

**Description:** Add real-time and dashboard notifications for users.

**Features:**
- Real-time notifications (appear as popups while using the site)
- Dashboard notifications (notification bell icon in header)
- Notification types:
  - New messages in chat
  - New friend/connection requests
  - Admin announcements
  - Event reminders
  - New Events
 
**Implementation:**
- Backend: Create notifications table, API endpoints
- Frontend: Add notification bell icon, real-time toast notifications
- Socket: Emit notification events to users

**Status:** Not started

---

## 3. DM Exit/Quit Feature

**Description:** Add ability to exit or quit a DM conversation.

**Features:**
- Menu option in DM chat to "Leave Chat" or "Delete Chat"
- Backend endpoint to handle DM deletion
- Remove DM from user's conversation list

**Status:** Not started

---

## 4. Events Functionality (Completed)

**Description:** Complete Events system with calendar integration and room creation.

**Features:**
- UserEvent model for many-to-many relationship between users and events
- User events endpoints for calendar functionality
- Event room creation and management
- User events tracking and status management
- Integration with existing Event model

**Status:** Completed ✅

---
*Created: 2026-02-14*
*Last Updated: 2026-02-14*
