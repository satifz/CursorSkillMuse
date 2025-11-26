# SkillMuse Self-Learner MVP

A Next.js application for AI-powered skill learning. Transform any content (URL or text) into structured skill lessons with visual slides and quizzes.

## Features

- 📚 **Simple Dashboard** - Clean interface to create lessons
- 🤖 **AI-Powered Generation** - Uses OpenAI to create structured lessons
- 📊 **Visual Slides** - 5-7 slides with titles, bodies, and bullets
- ✅ **Learning Outcomes** - 2-4 clear goals per lesson
- 📝 **Key Points Summary** - 5-8 main points
- 🎯 **Interactive Quiz** - 3-5 multiple-choice questions with explanations
- 📖 **Lesson History** - View all previously generated lessons

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **OpenAI Node SDK**
- **In-Memory Storage** (for MVP, easily replaceable with database)

## Quick Start

### 1. Install Dependencies

```bash
cd nextjs-mvp
npm install
```

### 2. Set Environment Variables

Create a `.env.local` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Create a Lesson**:
   - Go to the dashboard
   - Optionally enter a skill goal (e.g., "Learn React Hooks")
   - Choose URL or Text input
   - Paste your content
   - Click "Generate Lesson"

2. **View Lesson**:
   - See learning outcomes
   - Review key points
   - Browse visual slides
   - Take the quiz

3. **View All Lessons**:
   - Click "View All Lessons" from dashboard
   - See list of all generated lessons

## Project Structure

```
nextjs-mvp/
├── app/
│   ├── api/
│   │   └── lessons/
│   │       ├── generate/route.ts    # Generate lesson endpoint
│   │       ├── route.ts             # List lessons endpoint
│   │       └── [id]/route.ts        # Get lesson by ID
│   ├── lessons/
│   │   ├── page.tsx                 # Lessons list page
│   │   └── [id]/page.tsx            # Lesson detail page
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Dashboard (home)
│   └── globals.css                  # Global styles
├── lib/
│   ├── openai.ts                    # OpenAI integration
│   ├── storage.ts                   # In-memory storage
│   └── text-extractor.ts            # URL text extraction
├── types/
│   └── lesson.ts                    # TypeScript types
└── package.json
```

## Data Model

```typescript
type SkillLesson = {
  id: string;
  userId: string;        // "demo-user-1"
  skillName: string;
  shortDescription: string;
  learningOutcomes: string[];
  summary: { mainPoints: string[] };
  visual: { slides: Array<{ title, body, bullets }> };
  quiz: { questions: Array<{ question, options, correctIndex, explanation }> };
  source: { type: "url" | "text", value: string };
  createdAt: string;
};
```

## API Endpoints

- `POST /api/lessons/generate` - Generate a new lesson
- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/[id]` - Get a specific lesson

## Storage

Currently uses in-memory storage. To persist data:

1. **Option 1: Add Prisma + SQLite**
   ```bash
   npm install prisma @prisma/client
   npx prisma init --datasource-provider sqlite
   ```

2. **Option 2: Use a database**
   - Replace `lib/storage.ts` with database queries
   - Update API routes to use database

## Environment Variables

- `OPENAI_API_KEY` - Required for AI lesson generation

## Troubleshooting

### "OpenAI API key is not configured"
- Make sure `.env.local` exists with `OPENAI_API_KEY`
- Restart the dev server after adding the key

### "Failed to fetch URL"
- Some websites block automated requests
- Try using the "Text" input instead and paste content manually

## Next Steps

- Add database persistence (Prisma + SQLite/PostgreSQL)
- Add user authentication
- Add lesson editing
- Add export functionality
- Add progress tracking

