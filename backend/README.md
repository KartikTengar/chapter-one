# CHAPTER ONE API

Koa-based backend service for CHAPTER ONE — Premium College Fresher Platform.

## Features

- RESTful API for events management
- Supabase integration with service role privileges
- JWT authentication middleware
- Comprehensive middleware stack:
  - Request ID tracking
  - Structured logging (Pino)
  - CORS
  - Security headers (Helmet)
  - Body parsing
  - Rate limiting
  - Error handling
- Input validation with Zod
- TypeScript support
- Docker-ready
- Deployable to Render, Vercel, or any Node.js host

## Architecture

```
Vercel (Next.js Frontend) 
        ↓ HTTPS
Render (Koa Backend) 
        ↓ HTTPS (service role)
Supabase (Auth/Database/Storage)
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Development:
   ```bash
   npm run dev
   ```

4. Production build:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Events

- `GET /api/v1/events/health` - Health check
- `GET /api/v1/events` - List events with filtering, search, pagination
- `GET /api/v1/events/featured` - Get featured upcoming events
- `GET /api/v1/events/:id` - Get single event by ID
- `POST /api/v1/events` - Create new event (Admin only)
- `PUT /api/v1/events/:id` - Update event (Admin only)
- `DELETE /api/v1/events/:id` - Delete event (Admin only)

### Query Parameters (GET /events)

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `category`: Filter by category
- `q`: Search term (searches title, description, category, location)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `SUPABASE_JWT_SECRET` | JWT secret for token verification | Yes |
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `LOG_LEVEL` | Log level (debug/info/warn/error) | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms (default: 60000) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window (default: 100) | No |
| `REDIS_URL` | Redis URL for distributed rate limiting | No |
| `ADMIN_EMAIL` | Admin email for authorization | No |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | No |

## Middleware

All middleware is applied in this order:

1. **Request ID** - Adds unique `X-Request-ID` header
2. **Logger** - Structured request/response logging
3. **CORS** - Configurable cross-origin resource sharing
4. **Helmet** - Security headers
5. **Body Parser** - JSON, form, and text parsing
6. **Rate Limit** - IP-based rate limiting
7. **Routes** - API endpoints
8. **Error Handler** - Centralized error handling

## Authentication

The API expects a Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <supabase_jwt_token>
```

The `requireUser()` middleware validates the token and attaches the user to `ctx.state.user`.

The `requireAdmin()` middleware additionally checks for admin role or matching admin email.

## Database Schema

The API expects the following Supabase tables (see `database/migration.sql` in frontend):

- `events` - Core events table
- `event_registrations` - User event registrations
- `profiles` - User profiles

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Deployment

### Render.com

1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables from `.env`
6. Enable auto-deploy

### Docker

```bash
docker build -t chapter-one-api .
docker run -p 3001:3001 --env-file .env chapter-one-api
```

## Development Notes

- Uses `type: module` (ESM) imports
- Strict TypeScript configuration
- Pino logger with pretty-print in development
- Zod for request/response validation
- Jose for JWT verification
- Graceful shutdown handling