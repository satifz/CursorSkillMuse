# AI Setup Instructions for SkillMuse

## Problem: "AI is not connected" or "No results after creating skill"

This means the OpenAI API key is not configured in your Supabase Edge Functions.

## Quick Fix: Set OpenAI API Key

### Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (you won't see it again!)

### Step 2: Add API Key to Supabase

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Settings** (or **Project Settings** → **Edge Functions**)
3. Find **Environment Variables** or **Secrets** section
4. Click **"Add new secret"** or **"Add environment variable"**
5. Enter:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (paste the key you copied)
6. Click **Save**

#### Option B: Using Supabase CLI

```bash
cd skillmuse-main
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

### Step 3: Deploy Edge Functions (if not already deployed)

If you're using Supabase CLI:

```bash
supabase functions deploy skills-generate-lesson
```

Or deploy all functions:

```bash
supabase functions deploy
```

### Step 4: Verify It Works

1. Go back to your SkillMuse app
2. Create a skill or add content to an existing skill
3. Try generating a lesson
4. You should see "Lesson Generated!" message

## Troubleshooting

### Error: "OpenAI API key is not configured"
- **Solution**: Make sure you added `OPENAI_API_KEY` (exact name, all caps) in Supabase Edge Functions settings

### Error: "Function not found" or "404"
- **Solution**: Deploy the Edge Functions:
  ```bash
  supabase functions deploy skills-generate-lesson
  ```

### Error: "OpenAI API error: 401"
- **Solution**: Your API key is invalid. Generate a new one from OpenAI platform

### Error: "OpenAI API error: 429"
- **Solution**: You've hit rate limits. Wait a moment and try again, or upgrade your OpenAI plan

### Error: "OpenAI API error: 500"
- **Solution**: OpenAI service issue. Try again later

## Cost Information

- OpenAI API charges per token used
- `gpt-4o` model is used (cost-effective)
- Each lesson generation uses approximately 2000-3000 tokens
- Check [OpenAI Pricing](https://openai.com/pricing) for current rates
- You can set usage limits in OpenAI dashboard

## Alternative: Test Without OpenAI

If you want to test the app without OpenAI:

1. The skill creation and content addition will still work
2. Only lesson generation requires OpenAI
3. You can manually create lesson structure in the database for testing

## Still Having Issues?

1. Check Supabase Edge Functions logs:
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for error messages

2. Check browser console (F12):
   - Look for error messages
   - Check Network tab for failed requests

3. Verify environment variable:
   - In Supabase Dashboard, check that `OPENAI_API_KEY` exists
   - Make sure there are no extra spaces or quotes

4. Test API key directly:
   - You can test your OpenAI API key using curl:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

## Summary

**The issue**: OpenAI API key is not set in Supabase Edge Functions.

**The fix**: 
1. Get OpenAI API key from platform.openai.com
2. Add it to Supabase Edge Functions settings as `OPENAI_API_KEY`
3. Deploy Edge Functions (if using CLI)
4. Try generating a lesson again

Once configured, AI lesson generation will work automatically!

