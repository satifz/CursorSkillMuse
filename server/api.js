// Simple Express API server for lesson generation
// This replaces Supabase Edge Functions for AI lesson generation

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple text extraction from HTML
async function extractTextFromUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Simple HTML stripping
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text.substring(0, 10000); // Limit to 10k chars
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch content from URL: ${errorMessage}`);
  }
}

// Generate lesson from text using OpenAI
async function generateLessonFromText(text, skillName) {
  const AI_PROMPT = `You are an AI learning designer for a product called SkillMuse.
Your job is to read learning content and convert it into a structured skill-based visual learning lesson.

Follow these rules:
- Create a skill_name that is clear and descriptive.
- Create a short_description (1–2 sentences).
- Generate 2–4 learning_outcomes that describe what the learner will achieve (e.g., "Understand HVAC safety basics", "Explain three core AI concepts").
- Identify 5–8 main_points in the summary.
- Create 5–7 slides. Each slide must have:
    - title (max 7 words)
    - body (1–2 sentences)
    - bullets (max 3 bullet points)
- Create 3–5 multiple-choice quiz questions.
- Each question must have:
    - question (the question text)
    - options (array of 4 strings)
    - correct_index (0–3)
    - explanation (one short sentence)
- All output must be valid JSON ONLY. No commentary.

Return JSON in this exact format:

{
  "skill_name": "string",
  "short_description": "string",
  "learning_outcomes": ["string"],
  "summary": {
    "main_points": ["string"]
  },
  "visual": {
    "slides": [
      {
        "title": "string",
        "body": "string",
        "bullets": ["string"]
      }
    ]
  },
  "quiz": {
    "questions": [
      {
        "question": "string",
        "options": ["string","string","string","string"],
        "correct_index": 0,
        "explanation": "string"
      }
    ]
  }
}`;

  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[generateLessonFromText] OPENAI_API_KEY not set, using mock data');
      return getMockLessonPayload(skillName);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: AI_PROMPT
        },
        {
          role: 'user',
          content: `Skill: ${skillName}\n\nContent:\n${text.substring(0, 8000)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const lessonData = JSON.parse(responseText);
    
    // Convert snake_case to camelCase for frontend
    return {
      skillName: lessonData.skill_name || skillName,
      shortDescription: lessonData.short_description || '',
      learningOutcomes: lessonData.learning_outcomes || [],
      summary: {
        mainPoints: lessonData.summary?.main_points || []
      },
      visual: {
        slides: lessonData.visual?.slides || []
      },
      quiz: {
        questions: (lessonData.quiz?.questions || []).map(q => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correct_index,
          explanation: q.explanation
        }))
      }
    };
  } catch (error) {
    console.error('[generateLessonFromText] OpenAI error:', error);
    
    // If OpenAI fails, return mock data
    if (error.message?.includes('API key') || error.message?.includes('OPENAI')) {
      console.warn('[generateLessonFromText] Using mock data due to OpenAI configuration issue');
      return getMockLessonPayload(skillName);
    }
    
    throw error;
  }
}

// Mock lesson payload for when OpenAI is unavailable
function getMockLessonPayload(skillName) {
  return {
    skillName: skillName || "Sample Skill",
    shortDescription: "This is a sample lesson generated in mock mode. OpenAI API key is missing or the API call failed.",
    learningOutcomes: [
      "Understand the sample flow",
      "Learn basic concepts",
      "Apply knowledge in practice"
    ],
    summary: {
      mainPoints: [
        "Point 1: This is a demonstration point",
        "Point 2: Another key concept to understand",
        "Point 3: Practical application of the skill",
        "Point 4: Best practices and tips",
        "Point 5: Common mistakes to avoid"
      ]
    },
    visual: {
      slides: [
        {
          title: "Introduction to Sample Skill",
          body: "This is a demo slide body explaining the basics of the skill.",
          bullets: [
            "Bullet A: Key concept one",
            "Bullet B: Key concept two",
            "Bullet C: Key concept three"
          ]
        },
        {
          title: "Advanced Concepts",
          body: "This slide covers more advanced topics and techniques.",
          bullets: [
            "Advanced technique A",
            "Advanced technique B"
          ]
        }
      ]
    },
    quiz: {
      questions: [
        {
          question: "What is the main purpose of this sample lesson?",
          options: [
            "To demonstrate the flow",
            "To test the system",
            "To provide real content",
            "To show errors"
          ],
          correctIndex: 0,
          explanation: "This is a mock lesson to verify the system works end-to-end."
        }
      ]
    }
  };
}

// POST /api/skills/:id/content - Generate lesson from content
app.post('/api/skills/:id/content', async (req, res) => {
  console.log('[POST /api/skills/:id/content] Request received for skill:', req.params.id);
  
  try {
    const { sourceType, sourceValue } = req.body;
    const skillId = req.params.id;

    // Validate input
    if (!sourceValue || sourceValue.trim() === '') {
      return res.status(400).json({ error: 'Source value (URL or text) is required' });
    }

    if (!sourceType || !['url', 'text'].includes(sourceType)) {
      return res.status(400).json({ error: 'sourceType must be "url" or "text"' });
    }

    // Get user from auth header (if provided)
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch (authError) {
        console.warn('[POST /api/skills/:id/content] Auth error:', authError);
      }
    }

    // Verify skill exists
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, skill_name, description')
      .eq('id', skillId)
      .single();

    if (skillError || !skill) {
      console.error('[POST /api/skills/:id/content] Skill not found:', skillId);
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Extract text based on source type
    let extractedText = '';
    
    if (sourceType === 'url') {
      console.log('[POST /api/skills/:id/content] Processing URL:', sourceValue);
      try {
        const url = new URL(sourceValue);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
        }
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      extractedText = await extractTextFromUrl(sourceValue);
      console.log('[POST /api/skills/:id/content] Text extracted, length:', extractedText.length);
    } else {
      extractedText = sourceValue.trim();
      console.log('[POST /api/skills/:id/content] Using raw text input');
    }

    if (!extractedText || extractedText.length < 100) {
      return res.status(400).json({ 
        error: 'Content is too short. Please provide more content (at least 100 characters).' 
      });
    }

    // Save content to database
    console.log('[POST /api/skills/:id/content] Saving content to database...');
    const { data: content, error: contentError } = await supabase
      .from('skill_content')
      .insert({
        skill_id: skillId,
        content_type: sourceType,
        source_value: sourceValue.trim(),
        extracted_text: extractedText,
        created_by_user_id: userId
      })
      .select()
      .single();

    if (contentError) {
      console.error('[POST /api/skills/:id/content] Error saving content:', contentError);
      // Continue anyway - content save is not critical
    }

    // Generate lesson using OpenAI (or mock fallback)
    console.log('[POST /api/skills/:id/content] Calling generateLessonFromText...');
    const lessonData = await generateLessonFromText(extractedText, skill.skill_name);
    console.log('[POST /api/skills/:id/content] Lesson data received');

    // Save lesson to database
    console.log('[POST /api/skills/:id/content] Saving lesson to database...');
    const { data: lesson, error: lessonError } = await supabase
      .from('skill_lessons')
      .insert({
        skill_id: skillId,
        title: lessonData.skillName,
        short_description: lessonData.shortDescription,
        learning_outcomes: lessonData.learningOutcomes,
        lesson_data: {
          summary: lessonData.summary,
          visual: lessonData.visual,
          quiz: lessonData.quiz
        },
        created_by_user_id: userId
      })
      .select()
      .single();

    if (lessonError || !lesson) {
      console.error('[POST /api/skills/:id/content] Error saving lesson:', lessonError);
      return res.status(500).json({ 
        error: 'GENERATION_FAILED',
        message: 'Failed to save lesson to database',
        details: lessonError?.message 
      });
    }

    console.log('[POST /api/skills/:id/content] Lesson saved successfully:', lesson.id);
    return res.status(200).json(lesson);

  } catch (error) {
    console.error('[POST /api/skills/:id/content] SERVER ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return res.status(500).json({
      error: 'GENERATION_FAILED',
      message: 'Lesson generation failed',
      details: errorMessage
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[API Server] Listening on port ${PORT}`);
  console.log(`[API Server] Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
  console.log(`[API Server] OpenAI configured: ${!!process.env.OPENAI_API_KEY}`);
});

