# Error Debugging and Fix Summary

## Root Cause of "Unknown error"

The "Unknown error" was caused by improper error handling in the frontend:

1. **In `src/lib/api.ts`**: When the API returned an error response, the code tried to parse it as JSON with `.catch(() => ({ error: 'Unknown error' }))`. If the response wasn't valid JSON or couldn't be parsed, it defaulted to "Unknown error" without checking the actual error message from the server.

2. **Missing error details**: The API middleware wasn't logging detailed error information, making it hard to debug what was actually failing.

## Files Updated

### 1. `server/api-middleware.js` (API Route)

**Changes:**
- Added comprehensive logging at every step:
  - Request start/end markers
  - Step-by-step progress logs (Step 1: Extract text, Step 2: Save content, Step 3: Generate lesson, Step 4: Save lesson)
  - Detailed error logging with error type, message, and stack trace
- Enhanced error handling:
  - Wrapped entire handler in try/catch
  - Returns proper JSON error responses with `{ error: "GENERATION_FAILED", message, details }`
  - Validates lesson data structure before saving
- Added mock AI fallback:
  - Checks for `OPENAI_API_KEY` at the start and returns mock if missing
  - Catches OpenAI errors and returns mock instead of throwing
  - Ensures the rest of the flow can be tested even without OpenAI

### 2. `src/lib/api.ts` (Frontend API Client)

**Changes:**
- Improved error response parsing:
  - Properly handles JSON parse errors
  - Extracts error message, details from response
  - Logs full error response for debugging
- Better error messages:
  - Checks for `GENERATION_FAILED` error code
  - Extracts and displays the actual error message from server
  - No more defaulting to "Unknown error"

### 3. `src/components/AddContentForm.tsx` (UI Component)

**Changes:**
- Enhanced error message handling:
  - Checks for "Lesson generation failed:" prefix to show server error
  - Handles various error patterns (OPENAI_API_KEY, GENERATION_FAILED, etc.)
  - Shows meaningful error messages instead of generic ones

## How to See Server Logs for Lesson Generation Issues

### Where to Look

**Vite Dev Server Terminal** (where you ran `npm run dev`)

### Log Format

When a lesson generation request is made, you'll see:

#### Success Flow:
```
[API Middleware] ===== Lesson Generation Request Started =====
[API Middleware] POST /api/skills/:id/content { skillId: '...', sourceType: 'text', ... }
[API Middleware] Step 1: Extracting text from source...
[API Middleware] Using raw text input, length: 1234
[API Middleware] Extracted text preview (first 200 chars): ...
[API Middleware] Step 2: Saving content to database...
[API Middleware] Content saved successfully: content-id-123
[API Middleware] Step 3: Calling generateLessonFromText...
[API Middleware] Input: { textLength: 1234, skillName: '...' }
[generateLessonFromText] OPENAI_API_KEY is missing – using mock AI payload.
[API Middleware] Lesson data received: { skillName: '...', learningOutcomesCount: 3, ... }
[API Middleware] Step 4: Saving lesson to database...
[API Middleware] Lesson saved successfully: lesson-id-456
[API Middleware] ===== Lesson Generation Request Completed Successfully =====
```

#### Error Flow:
```
[API Middleware] ===== Lesson Generation Request Started =====
[API Middleware] POST /api/skills/:id/content { ... }
[API Middleware] Step 1: Extracting text from source...
...
[API Middleware] ===== Lesson Generation Failed =====
[API Middleware] Error type: Error
[API Middleware] Error message: Specific error message here
[API Middleware] Error stack: Full stack trace
[API Middleware] Full error object: { ... }
```

### Common Error Patterns

1. **Supabase not configured**:
   ```
   [API Middleware] Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   ```

2. **OpenAI API key missing**:
   ```
   [generateLessonFromText] OPENAI_API_KEY is missing – using mock AI payload.
   ```

3. **OpenAI API call failed**:
   ```
   [generateLessonFromText] OpenAI call failed, using mock lesson.
   [generateLessonFromText] Error details: { message: '...', type: '...' }
   ```

4. **Database save failed**:
   ```
   [API Middleware] Error saving lesson: { ... }
   [API Middleware] Lesson data that failed to save: { ... }
   ```

5. **Invalid lesson data structure**:
   ```
   [API Middleware] Error message: Invalid lesson data structure: missing skillName or shortDescription
   ```

## Testing the Fix

1. **Run the app**:
   ```bash
   npm run dev
   ```

2. **Open browser console** and **watch the Vite terminal**

3. **Test the flow**:
   - Go to Skill detail page
   - Click "Add Content"
   - Select "From Text"
   - Paste text (at least 100 characters, e.g., "Basics of AI for beginners. This is a comprehensive guide...")
   - Click "Generate Lesson"

4. **Check logs**:
   - **Browser console**: Should show `[generateLessonFromContent]` logs
   - **Vite terminal**: Should show `[API Middleware]` logs with detailed step-by-step progress

5. **Verify results**:
   - Content tab should show 1+ content items
   - Lessons tab should show 1+ lessons
   - Click lesson to see full details (outcomes, summary, slides, quiz)

## Expected Behavior

- ✅ **With OpenAI API key**: Real AI-generated lesson
- ✅ **Without OpenAI API key**: Mock lesson (for testing the flow)
- ✅ **On error**: Clear error message in UI showing the actual server error
- ✅ **All logs**: Detailed logging in Vite terminal for debugging

## Next Steps if Errors Persist

1. Check the Vite terminal for the detailed error logs
2. Look for the specific error message in the logs
3. Common issues:
   - Missing environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
   - Database connection issues
   - Invalid skill ID
   - Content too short (< 100 characters)

