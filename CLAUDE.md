# Collective Souls - Project Instructions

## Project Overview
This is a Spiritial platform called "Collective Souls" built with:
- **Backend**: Node.js with Express, SQLite (dev) / MySQL (production), Socket.io for real-time chat
- **Frontend**: React with TypeScript, Vite, Tailwind CSS
- **Development**: Windows 11 (no WSL)
- **Deployment Target**: Ubuntu VPS with PM2, Nginx

## Important Notes
- The main GitHub repository is at: https://github.com/nwcai2025-cloud/Collective-Souls-node.js
- The project uses a unified authentication system for both user and admin
- Mobile-responsive design is a priority
- Deployment scripts are in the `deployment/` folder

## Database Migration Strategy
- **Current (Dev)**: SQLite database (`backend/database/collective_souls.sqlite`)
- **Target (Production)**: MySQL on Ubuntu VPS
- Write database queries that are compatible with MySQL (avoid SQLite-specific features)
- Consider using an ORM pattern to ease future migration

## Common Tasks

### Deploying Changes
When you want to push changes to GitHub:
1. Run `git add -A` to stage all changes
2. Run `git commit -m "description"` with a meaningful message
3. Run `git push origin main` to push to the main branch

### Starting the Platform (Windows 11)
- Backend: `cd backend && npm start`
- Frontend: `cd frontend && npm run dev`
- Backend with nodemon (auto-reload): `cd backend && npx nodemon server.js`

### Production Deployment (Ubuntu VPS)
When ready to deploy to VPS:
1. Push changes to GitHub main branch
2. On VPS: Pull from GitHub
3. Run migration scripts to convert SQLite to MySQL
4. Use PM2 to manage the Node.js processes
5. Configure Nginx as reverse proxy

## Key Files and Folders
- `backend/server.js` - Main server entry point
- `frontend/src/App.tsx` - Main React application
- `deployment/` - Deployment and server management scripts (Ubuntu-ready)
- `backend/database/collective_souls.sqlite` - SQLite database (dev only)

## Coding Preferences
- **IMPORTANT: UI Components use .jsx files, not .tsx** - The frontend has duplicate files (.jsx and .tsx) for some components. The `.jsx` files are the active UI code. Do NOT create or edit `.tsx` files for UI components unless explicitly asked.
- Use TypeScript (.ts/.tsx) for non-UI code (services, types, utilities)
- Follow existing patterns in the codebase
- Keep mobile compatibility in mind
- Write MySQL-compatible queries for future migration

## File Structure Notes
- `frontend/src/components/*.jsx` - Active UI components (use these)
- `frontend/src/components/*.tsx` - Legacy/duplicate files (do not use)
- `frontend/src/context/*.jsx` - Active React contexts (use these)
- `frontend/src/context/*.tsx` - Legacy/duplicate files (do not use)
- `frontend/src/pages/*.tsx` - Page components (these are active)
- `frontend/src/App.tsx` - Main app entry (this is active)

## GITHUB
- Repo address https://github.com/nwcai2025-cloud/Collective-Souls-node.js.git
  

## Design Rules
- **ALWAYS design for mobile first** - Start with mobile layout, then scale up to desktop
- **DO NOT CHANGE THE MAIN SITE DESIGN** - Unless directed to by the user
- The main site uses a spiritual theme with gradient backgrounds (mindful-purple → serene-blue → calm-green), glassmorphism effects, and yellow accents. Any redesigns should maintain this aesthetic.

## Things to Avoid
- Don't change ports. CHECK FOR SERVERS RUNNING
- Don't commit large binary files or node_modules
- Don't push directly to protected branches without review
- Avoid SQLite-specific SQL features that won't work in MySQL
- Don't modify the core design language without explicit permission
- DO NOT Do anything on the todo list until oked by me.