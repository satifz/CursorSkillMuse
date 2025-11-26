# SkillMuse Self-Learner MVP - Setup Guide

## Quick Start (3 Steps)

### 1. Install Dependencies

```bash
cd nextjs-mvp
npm install
```

### 2. Set OpenAI API Key

Create a `.env.local` file in the `nextjs-mvp` directory:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Get your API key:**
- Go to https://platform.openai.com/api-keys
- Sign in and create a new secret key
- Copy and paste it into `.env.local`

### 3. Run the App

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## That's It! 🎉

The app is now running. You can:
1. Go to the dashboard
2. Enter a skill goal (optional)
3. Paste a URL or text
4. Click "Generate Lesson"
5. View your AI-generated lesson with slides and quiz!

## Project Structure

```
nextjs-mvp/
├── app/
│   ├── api/lessons/          # API routes
│   ├── lessons/              # Lesson pages
│   ├── page.tsx              # Dashboard (home)
│   └── layout.tsx           # Root layout
├── lib/                      # Utilities
├── types/                    # TypeScript types
└── package.json
```

## Features

✅ **Simple Dashboard** - Clean input form
✅ **AI Lesson Generation** - Uses OpenAI GPT-4o
✅ **Visual Slides** - 5-7 slides per lesson
✅ **Learning Outcomes** - 2-4 clear goals
✅ **Key Points** - 5-8 main points
✅ **Interactive Quiz** - 3-5 questions with explanations
✅ **Lesson History** - View all generated lessons

## No Database Required

Uses in-memory storage for MVP. Data persists during the session but resets on server restart.

To add persistence, see README.md for database options.

## Troubleshooting

**"OpenAI API key is not configured"**
- Make sure `.env.local` exists with `OPENAI_API_KEY`
- Restart the dev server: `npm run dev`

**"Failed to fetch URL"**
- Some websites block automated requests
- Use "Text" input instead and paste content manually

**Port already in use**
- Change port: `npm run dev -- -p 3001`

