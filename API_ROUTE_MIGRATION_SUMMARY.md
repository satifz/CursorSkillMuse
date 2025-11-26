# API Route Migration Summary

## Overview
Migrated from external Express API server to Vite server middleware, so all API routes run in the same process as the frontend (same origin).

## Changes Made

### 1. Files That Previously Referred to External API Server

#### `src/lib/api.ts`
- **Removed**: `apiBaseUrl` variable pointing to `http://localhost:3001`
- **Removed**: `VITE_API_URL` environment variable usage
- **Changed**: Now calls relative URL `/api/skills/${skill_id}/content` (same origin)
- **Removed**: Error message about "API server running on port 3001"
- **Lines Changed**: 256-310

#### `src/components/AddContentForm.tsx`
- **Removed**: Error message "Could not connect to lesson generation service. Please ensure the API server is running. Run: npm run dev:api"
- **Changed**: Now shows generic "Lesson generation failed. Please try again." for network errors
- **Lines Changed**: 90-95

### 2. New API Route Implementation

#### `server/api-middleware.js`
- **Type**: Vite server middleware (runs in same process as Vite dev server)
- **Endpoint**: `POST /api/skills/:id/content`
- **Features**:
  - Handles `/api/*` routes in Vite dev server
  - Extracts text from URLs or uses raw text
  - Calls OpenAI API for lesson generation (with mock fallback)
  - Saves content to `skill_content` table
  - Saves lesson to `skill_lessons` table
  - Returns lesson object
  - Error handling with `{ error: "GENERATION_FAILED", message, details }`

#### `vite.config.ts`
- **Added**: Vite plugin that registers the API middleware
- **Result**: API routes are handled by Vite dev server, no separate process needed

### 3. Removed Files/Dependencies

- **Removed**: `server/api.js` (Express server - no longer needed)
- **Removed**: `server/README.md` (outdated instructions)
- **Removed**: `npm run dev:api` script dependency
- **Removed**: `npm run dev:all` script (no longer needed)
- **Kept**: `express`, `cors`, `openai` dependencies (still used by middleware)

## API Route Details

### Endpoint
```
POST /api/skills/:id/content
```

### Request
```json
{
  "sourceType": "url" | "text",
  "sourceValue": "string"
}
```

### Success Response (200)
Returns the lesson object from `skill_lessons` table.

### Error Response (400/500)
```json
{
  "error": "GENERATION_FAILED",
  "message": "Lesson generation failed",
  "details": "error details"
}
```

## How to See Server-Side Logs

When lesson generation fails, check the **Vite dev server terminal** (where you ran `npm run dev`) for logs:

1. **Request received**:
   ```
   [API Middleware] POST /api/skills/:id/content { skillId: '...', sourceType: 'text' }
   ```

2. **Text extraction**:
   ```
   [API Middleware] Using raw text input
   [API Middleware] Text extracted, length: 1234
   ```

3. **AI generation**:
   ```
   [API Middleware] Calling generateLessonFromText...
   [API Middleware] Lesson data received
   ```

4. **Database operations**:
   ```
   [API Middleware] Saving content to database...
   [API Middleware] Saving lesson to database...
   [API Middleware] Lesson saved successfully: lesson-id-123
   ```

5. **Errors** (if any):
   ```
   [API Middleware] SERVER ERROR: Error message here
   [API Middleware] Error saving lesson: Database error details
   ```

## Environment Variables

The middleware uses these environment variables (same as before):

```env
# Required
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional (uses mock if missing)
OPENAI_API_KEY=your_openai_api_key
```

## Running the App

**Single command** (no separate API server needed):
```bash
npm run dev
```

The Vite dev server will:
- Serve the frontend on `http://localhost:8080`
- Handle API routes at `/api/*` in the same process
- Log all API requests and errors to the same terminal

## Verification Checklist

✅ No more "Could not connect to lesson generation service / npm run dev:api" error  
✅ Frontend calls `/api/skills/:id/content` (relative URL, same origin)  
✅ API route handled by Vite middleware (check Vite terminal logs)  
✅ Content saved to `skill_content` table  
✅ Lesson saved to `skill_lessons` table  
✅ Content and Lessons tabs show new items  
✅ Lesson can be opened and displays outcomes, summary, slides, quiz  

## Notes

- The API middleware runs in the same Node.js process as Vite
- No CORS issues since it's same-origin
- All logs appear in the Vite dev server terminal
- The middleware only handles `/api/*` routes; other routes pass through to Vite's normal handling

