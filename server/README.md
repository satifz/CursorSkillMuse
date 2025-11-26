# API Server for Lesson Generation

This Express server provides Next.js-style API routes for lesson generation, replacing Supabase Edge Functions.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (optional - will use mock data if missing)
OPENAI_API_KEY=your_openai_api_key

# API Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:8080
```

3. Run the API server:
```bash
npm run dev:api
```

Or run both frontend and API server together:
```bash
npm run dev:all
```

## API Endpoints

### POST /api/skills/:id/content

Generate a lesson from content (URL or text) for a specific skill.

**Request:**
```json
{
  "sourceType": "url" | "text",
  "sourceValue": "string"
}
```

**Response:**
Returns the created lesson object with all lesson data.

**Error Response:**
```json
{
  "error": "GENERATION_FAILED",
  "message": "Lesson generation failed",
  "details": "error details"
}
```

## Notes

- The server uses Supabase Service Role Key for database operations
- If OpenAI API key is not set, the server will return mock lesson data
- The server includes CORS support for the frontend running on port 8080

