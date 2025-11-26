# Edge Function Removal Summary

## Overview
Removed Supabase Edge Function dependency for lesson generation and replaced it with a Next.js-style API route using an Express server.

## Changes Made

### 1. Files with Edge Function Calls Removed

#### `src/lib/api.ts`
- **Function**: `generateLessonFromContent()`
- **Change**: Removed `supabase.functions.invoke('skills-generate-lesson-from-content')` call
- **Replacement**: Now calls `POST /api/skills/:id/content` on the Express API server
- **Lines Changed**: 244-315

#### `src/components/AddContentForm.tsx`
- **Change**: Updated error messages to reference API server instead of Edge Functions
- **Lines Changed**: 90-95

### 2. New API Route Created

#### `server/api.js`
- **Endpoint**: `POST /api/skills/:id/content`
- **Purpose**: Handles lesson generation from content (URL or text)
- **Features**:
  - Extracts text from URLs or uses raw text
  - Calls OpenAI API for lesson generation (with mock fallback)
  - Saves content to `skill_content` table
  - Saves lesson to `skill_lessons` table
  - Returns lesson object
- **Error Handling**: Returns `{ error: "GENERATION_FAILED", message, details }` on failure

### 3. Configuration Updates

#### `package.json`
- **Added Dependencies**:
  - `express`: ^4.18.2
  - `cors`: ^2.8.5
  - `openai`: ^4.20.1
  - `concurrently`: ^8.2.2
- **Added Scripts**:
  - `dev:api`: Run API server only
  - `dev:all`: Run both frontend and API server

### 4. Environment Variables Required

Create a `.env` file with:
```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (optional - uses mock if missing)
OPENAI_API_KEY=your_openai_api_key

# API Server
PORT=3001
FRONTEND_URL=http://localhost:8080

# Frontend (existing)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001  # Optional, defaults to localhost:3001
```

## How to Verify

### 1. Start the API Server
```bash
npm run dev:api
```

You should see:
```
[API Server] Listening on port 3001
[API Server] Frontend URL: http://localhost:8080
[API Server] OpenAI configured: true/false
```

### 2. Start the Frontend
```bash
npm run dev
```

Or run both together:
```bash
npm run dev:all
```

### 3. Test the Flow

1. Navigate to a skill detail page
2. Click "Add Content"
3. Select "From Text" or "From URL"
4. Enter content and click "Generate Lesson"
5. Check the browser console for logs:
   - `[generateLessonFromContent] Calling API route:`
   - `[generateLessonFromContent] API response status: 200`
   - `[generateLessonFromContent] Successfully generated lesson:`

6. Check the API server terminal for logs:
   - `[POST /api/skills/:id/content] Request received for skill:`
   - `[POST /api/skills/:id/content] Text extracted, length:`
   - `[POST /api/skills/:id/content] Lesson saved successfully:`

### 4. Verify Database

- Check `skill_content` table for new content entries
- Check `skill_lessons` table for new lesson entries
- Verify content and lessons appear in the UI

## API Route Details

### Request Format
```typescript
POST /api/skills/:id/content
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer <supabase_token>" // Optional
}
Body: {
  "sourceType": "url" | "text",
  "sourceValue": "string"
}
```

### Success Response (200)
Returns the lesson object from `skill_lessons` table with all fields.

### Error Response (400/500)
```json
{
  "error": "GENERATION_FAILED",
  "message": "Lesson generation failed",
  "details": "error details"
}
```

## Notes

- The "Failed to send a request to the Edge Function" error should never appear again
- If the API server is not running, you'll see: "Could not connect to lesson generation service"
- Mock lesson data is returned if OpenAI API key is not configured
- The API server uses Supabase Service Role Key for database operations (bypasses RLS)

## Remaining Edge Function Usage

The following functions still use Edge Functions (outside scope of this change):
- `generateSkillLesson()` - Used for generating lessons from existing content
- `createGroup()` - Group creation
- Other group and progress functions

These can be migrated later if needed.

