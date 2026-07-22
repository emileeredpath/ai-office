# AI Office MVP - Getting Started

## Prerequisites

1. **Node.js 20+** - [Download](https://nodejs.org/)
2. **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
3. **Anthropic API Key** - [Get one](https://console.anthropic.com/account/keys)

## Quick Start (Option A: Docker - Recommended)

### 1. Setup Environment
```bash
# Copy .env.example to .env and add your API key
cp .env.example .env

# Edit .env and add your Anthropic API key
nano .env
# ANTHROPIC_API_KEY=sk-ant-xxxxx...
```

### 2. Start Everything
```bash
docker-compose up
```

This will:
- Create PostgreSQL database
- Run migrations (create tables)
- Seed initial data (Sandy, specialists, sample tasks)
- Start backend API on http://localhost:3001
- Start frontend on http://localhost:5173

### 3. Open in Browser
Visit **http://localhost:5173**

You should see the AI Office dashboard with:
- Sandy (AI Orchestrator) 
- Finance AI, Content AI, Marketing AI (specialists)
- John (Managing Director)
- Emilee & Sally (team members)
- Sample tasks and conversations

---

## Quick Start (Option B: Local Development)

### 1. Setup Backend
```bash
cd backend
npm install
```

### 2. Setup PostgreSQL
```bash
# Start PostgreSQL (Docker)
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_office \
  -p 5432:5432 \
  postgres:15-alpine

# Wait 10 seconds for PostgreSQL to start
sleep 10

# Run migrations
npm run migrate

# Seed data
npm run seed
```

### 3. Start Backend
```bash
npm run dev
# Server will run on http://localhost:3001
```

### 4. Setup Frontend (in new terminal)
```bash
npm install
npm run dev
# Frontend will run on http://localhost:5173
```

---

## Database Commands

### View Data
```bash
# Connect to database
docker exec -it postgres psql -U postgres -d ai_office

# List tables
\dt

# View employees
SELECT id, name, role, is_ai, status FROM ai_employees;

# View tasks
SELECT title, status, employee_id FROM tasks;

# Exit
\q
```

### Reset Database
```bash
cd backend

# Drop and recreate
npm run migrate

# Reseed
npm run seed
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 5432 (database)
lsof -ti:5432 | xargs kill -9
```

### API Connection Error
- Make sure backend is running on port 3001
- Check that `VITE_API_URL=http://localhost:3001` in `.env`
- Check browser console for errors

### Database Connection Error
- Make sure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists: `psql -U postgres -l | grep ai_office`

### Missing ANTHROPIC_API_KEY
- Get an API key from https://console.anthropic.com/account/keys
- Add it to `.env`: `ANTHROPIC_API_KEY=sk-ant-xxxxx...`
- Restart backend

---

## What's in the Database?

### Team Members
- **Sandy** - AI Orchestrator (🤖)
- **Finance AI** - Handles invoice approvals (💰)
- **Content AI** - Content specialist (✍️)
- **Marketing AI** - Marketing analyst (📊)
- **John** - Managing Director (👨‍💼)
- **Emilee** - Marketing Director (👩‍💼)
- **Sally** - Content Manager (👩‍💻)

### Sample Project
- **Q3 Marketing Campaign** with 3 tasks:
  - "Write blog post on AI marketing trends" (Sally, In Progress)
  - "Review campaign budget allocation" (Emilee, Awaiting Brief)
  - "Update email templates" (Sally, Backlog)

---

## Architecture

```
Frontend (React)
     ↓ HTTP
Backend (Express) → PostgreSQL
     ↓ (via Anthropic API)
Claude Models (Sandy AI)
```

### Key Files
- **Frontend**: `/src/components/dashboard/` - React components
- **Backend**: `/backend/src/routes/` - API endpoints
- **Database**: `/backend/src/db/schema.sql` - Database schema
- **Seed Data**: `/backend/src/db/seed.ts` - Initial data

---

## Next Steps

1. **Chat with Sandy** - Go to Sandy tab and ask for help
2. **View Tasks** - See all team tasks and update status
3. **Check Team** - View each person's workload
4. **Integrate Data** - Connect to real systems (Acumatica, GA4, etc.)

---

## Environment Variables

```
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_office

# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx...

# Server
PORT=3001
NODE_ENV=development

# URLs
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

---

## Support

- Check logs: `docker-compose logs backend`
- Reset everything: `docker-compose down -v && docker-compose up`
- View database: `docker-compose exec postgres psql -U postgres -d ai_office`
