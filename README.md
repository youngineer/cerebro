# Cerebro - AI Research Agent

An AI-powered research agent that accepts topics from users, runs automated research workflows, and returns structured results with summaries and key insights.

## Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS + DaisyUI
- **Backend**: Node.js + Express + TypeScript + Prisma + BullMQ
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis with BullMQ for background job processing
- **AI**: OpenRouter API for content analysis
- **News**: NewsAPI for article data

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Redis instance

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your actual values (see .env.example section below).

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the backend server:
```bash
npm run dev
```

6. Run the worker process (in a separate terminal):
```bash
npm run worker:dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run the frontend:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Deployment Instructions

### Frontend Deployment

1. Build the production bundle:
```bash
cd frontend
npm run build
```

2. Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)

3. Update environment variables in your hosting platform:
   - `VITE_BACKEND_URL`: Your deployed backend URL

### Backend Deployment

1. Build the application:
```bash
cd backend
npm run build
```

2. Deploy to your hosting service (Railway, Heroku, AWS, etc.)

3. Set up environment variables in your hosting platform (see .env.example)

4. Run database migrations:
```bash
npx prisma db push
```

5. Start both the main server and worker process:
```bash
npm start &
npm run worker
```

## Environment Variables

### Backend (.env.example)

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/cerebro_db

# Server
BACKEND_PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here

# APIs
OPENROUTER_APIKEY=sk-or-v1-your-openrouter-api-key
NEWSAPI_APIKEY=your-newsapi-key

# Redis (for background jobs)
UPSTASH_REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### Frontend (.env.example)

```env
VITE_BACKEND_URL=http://localhost:3000
```

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: cerebro_user
      POSTGRES_PASSWORD: cerebro_password
      POSTGRES_DB: cerebro_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://cerebro_user:cerebro_password@postgres:5432/cerebro_db
      - UPSTASH_REDIS_URL=redis://redis:6379
      - NODE_ENV=development
      - BACKEND_PORT=3000
      - FRONTEND_URL=http://localhost:5173
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: npm run worker
    environment:
      - DATABASE_URL=postgresql://cerebro_user:cerebro_password@postgres:5432/cerebro_db
      - UPSTASH_REDIS_URL=redis://redis:6379
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
      - backend
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_BACKEND_URL=http://localhost:3000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
```

### Running with Docker

1. Start all services:
```bash
docker-compose up -d
```

2. Initialize the database:
```bash
docker-compose exec backend npx prisma db push
```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

4. Stop all services:
```bash
docker-compose down
```

## API Documentation

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/logout` - User logout

### Research
- `POST /research` - Submit a new research topic
- `GET /research` - Get all research topics
- `GET /research/:id` - Get specific research details
- `GET /user/:id` - Get user's research topics

### Job Monitoring
- `GET /jobs/stats` - Get queue statistics
- `GET /jobs/:jobId` - Get job status
- `GET /jobs` - Get all jobs

## Development Workflow

1. Start the database and Redis (via Docker or local installation)
2. Run backend server: `npm run dev` (in backend directory)
3. Run worker process: `npm run worker:dev` (in backend directory)
4. Run frontend: `npm run dev` (in frontend directory)

The system will automatically:
- Queue research jobs when topics are submitted
- Process articles and generate AI summaries in the background
- Update the database with results
- Provide real-time status updates

## Key Features

- User authentication with JWT
- Background job processing for research workflows
- AI-powered content analysis and summarization
- Real-time job status monitoring
- Responsive UI with modern design
- RESTful API architecture
- Type-safe development with TypeScript