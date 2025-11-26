# SkillMuse 2.0 Setup Guide

## Prerequisites

1. **Supabase Account** - You need a Supabase project
2. **Node.js** - For running the development server
3. **OpenAI API Key** - For AI lesson generation

## Step 1: Database Setup

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251116000000_skillmuse_2.0_schema.sql`
4. Paste and run the SQL in the SQL Editor
5. This will create all necessary tables:
   - `skills`
   - `skill_content`
   - `skill_lessons`
   - `groups`
   - `group_members`
   - `user_progress`
   - `trainer_spaces`
   - `trainer_space_skills`
   - `trainer_space_trainees`

### Option B: Using Supabase CLI

```bash
cd skillmuse-main
supabase db reset
# or
supabase migration up
```

## Step 2: Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings under **API**.

## Step 3: Configure Edge Functions (⚠️ REQUIRED FOR AI)

### ⚠️ CRITICAL: Set OpenAI API Key

**If you see "AI is not connected" errors, this step is missing!**

1. **Get OpenAI API Key**:
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign in and click **"Create new secret key"**
   - Copy the key (starts with `sk-`, you won't see it again!)

2. **Add to Supabase**:
   - Go to your Supabase project dashboard
   - Navigate to **Project Settings** → **Edge Functions** (or **Edge Functions** → **Settings**)
   - Find **Environment Variables** or **Secrets** section
   - Click **"Add new secret"** or **"Add environment variable"**
   - Enter:
     - **Name**: `OPENAI_API_KEY` (exact name, all caps, no spaces)
     - **Value**: Your OpenAI API key (paste the key you copied)
   - Click **Save**

3. **Verify**:
   - The variable should appear in the list
   - Make sure there are no extra spaces or quotes around the value

**📖 See `AI_SETUP_INSTRUCTIONS.md` for detailed troubleshooting if AI still doesn't work.**

### Deploy Edge Functions (if using Supabase CLI)

**⚠️ IMPORTANT: Deploy the lesson generation function first!**

```bash
# Required for lesson generation from content
supabase functions deploy skills-generate-lesson-from-content

# Other skill-related functions
supabase functions deploy skills-create
supabase functions deploy skills-list
supabase functions deploy skills-get
supabase functions deploy skills-add-content
supabase functions deploy skills-generate-lesson

# Group and progress functions
supabase functions deploy groups-create
supabase functions deploy groups-list
supabase functions deploy groups-add-member
supabase functions deploy progress-update
```

**Or deploy all at once:**
```bash
supabase functions deploy
```

**Note:** If you see "Failed to send a request to the Edge Function" error, the Edge Function is not deployed. Deploy it using the command above.

## Step 4: Install Dependencies

```bash
cd skillmuse-main
npm install
# or
yarn install
# or
pnpm install
```

## Step 5: Run the Application

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The app should now be running at `http://localhost:5173` (or the port shown in terminal).

## Step 6: Test the Flow

1. **Sign Up/Sign In** - Create an account or sign in
2. **Create a Skill** - Go to Dashboard → Create Skill
3. **Add Content** - On the skill detail page, add a URL or notes
4. **Generate Lesson** - Click "Generate Lesson" to create an AI-powered lesson

## Troubleshooting

### "Skills table does not exist"
- Run the database migration (Step 1)

### "OpenAI API key is not configured" or "AI is not connected"
- **This is the most common issue!**
- Set the `OPENAI_API_KEY` environment variable in Supabase Edge Functions settings
- See Step 3 above for detailed instructions
- Make sure the variable name is exactly `OPENAI_API_KEY` (all caps)
- Verify it's saved in Supabase dashboard
- See `AI_SETUP_INSTRUCTIONS.md` for step-by-step guide

### "User not authenticated"
- Make sure you're signed in
- Check that authentication is working in Supabase

### "Permission denied"
- Check Row Level Security (RLS) policies in your database
- The migration includes RLS policies, but verify they're applied

### Edge Functions not working
- Make sure Edge Functions are deployed
- Check Edge Functions logs in Supabase dashboard
- Verify environment variables are set

## Current Implementation Status

✅ **Working:**
- Skill creation (direct database insert)
- Skill listing (direct database query)
- Skill detail view
- Content addition
- Dashboard with Skills and Groups tabs

⚠️ **Requires Edge Functions:**
- Lesson generation (needs OpenAI API key)
- Group creation (can work with direct DB, but Edge Function recommended)

## Architecture Notes

The app now uses **direct database queries** for most operations, which is:
- Faster (no Edge Function overhead)
- More reliable (fewer points of failure)
- Easier to debug

Edge Functions are still used for:
- AI lesson generation (requires OpenAI API)
- Complex operations that need server-side processing

## Next Steps

Once the basic flow works:
1. Test lesson generation with a real URL
2. Create groups and test group learning
3. Set up trainer spaces (if needed)
4. Customize the UI and add more features

