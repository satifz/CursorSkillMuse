// Vite server middleware for API routes
// This handles /api/* routes in the same Vite dev server

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[API Middleware] Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

if (!openai) {
  console.warn('[API Middleware] OPENAI_API_KEY not set, will use mock data');
}

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

  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY || !openai) {
    console.warn("OPENAI_API_KEY is missing. Using mock lesson payload.");
    return getMockLessonPayload(skillName);
  }

  try {
    console.log('[generateLessonFromText] Calling OpenAI API...');
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

    console.log('[generateLessonFromText] OpenAI response received, parsing JSON...');
    let lessonData;
    try {
      lessonData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[generateLessonFromText] Failed to parse OpenAI JSON response:', parseError);
      console.error('[generateLessonFromText] Response text:', responseText.substring(0, 500));
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
    }

    // Validate the structure
    if (!lessonData.skill_name && !lessonData.short_description) {
      console.error('[generateLessonFromText] Invalid AI response structure:', lessonData);
      throw new Error('AI response missing required fields (skill_name or short_description)');
    }

    // Return in snake_case format (as expected from AI)
    // The API route will convert to camelCase for the frontend
    return {
      skill_name: lessonData.skill_name || skillName,
      short_description: lessonData.short_description || '',
      learning_outcomes: lessonData.learning_outcomes || [],
      summary: {
        main_points: lessonData.summary?.main_points || []
      },
      visual: {
        slides: lessonData.visual?.slides || []
      },
      quiz: {
        questions: (lessonData.quiz?.questions || []).map(q => ({
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation
        }))
      }
    };
  } catch (error) {
    console.error('[generateLessonFromText] OpenAI call failed, using mock lesson.', error);
    console.error('[generateLessonFromText] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      type: error?.constructor?.name
    });
    
    // Return mock data instead of throwing, so we can verify the rest of the flow
    return getMockLessonPayload(skillName);
  }
}

// Mock lesson payload for when OpenAI is unavailable
// Returns data in snake_case format (matching AI response format)
function getMockLessonPayload(skillName) {
  return {
    skill_name: skillName || "Mock Lesson: Basics of AI",
    short_description: "This is a mock lesson generated as a fallback for testing.",
    learning_outcomes: [
      "Understand that the SkillMuse flow works end-to-end",
      "See how a skill-based lesson looks"
    ],
    summary: {
      main_points: [
        "This is a mock summary point.",
        "Replace this with real AI output once configured."
      ]
    },
    visual: {
      slides: [
        {
          title: "What is AI?",
          body: "This is mock slide content used for debugging.",
          bullets: ["Bullet A", "Bullet B"]
        }
      ]
    },
    quiz: {
      questions: [
        {
          question: "Is this a mock lesson?",
          options: ["Yes", "No", "Not sure", "Maybe"],
          correct_index: 0,
          explanation: "For now, this is mock data so we can verify the pipeline."
        }
      ]
    }
  };
}

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { 
      body += chunk.toString(); 
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (e) {
        console.warn('[API Middleware] Failed to parse request body as JSON:', e.message);
        resolve({});
      }
    });
    req.on('error', (err) => {
      console.error('[API Middleware] Error reading request body:', err);
      reject(err);
    });
  });
}

// Vite middleware function
export function apiMiddleware() {
  console.log('[API Middleware] ✅ Middleware initialized and ready to handle /api/* routes');
  console.log('[API Middleware] Configuration:', {
    hasSupabase: !!supabase,
    hasOpenAI: !!openai,
    supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
    openaiKey: process.env.OPENAI_API_KEY ? 'Set' : 'Missing'
  });
  
  return async (req, res, next) => {
    // Log ALL requests to see if middleware is being called
    console.log('[API Middleware] 📥 Request received:', { method: req.method, url: req.url, startsWithApi: req.url.startsWith('/api/') });
    
    try {
      // Only handle /api/* routes
      if (!req.url.startsWith('/api/')) {
        console.log('[API Middleware] ⏭️ Not an API route, passing to next middleware');
        return next();
      }

      console.log('[API Middleware] 🔵 Incoming API request:', { method: req.method, url: req.url });

    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    // Test endpoint to verify middleware is working
    if (req.url === '/api/test' && req.method === 'GET') {
      console.log('[API Middleware] ✅ Test endpoint hit - middleware is working!');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: true, 
        message: 'API middleware is working!',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Route: POST /api/skills/:id/content
    // Handle query strings by stripping them for matching
    const urlWithoutQuery = req.url.split('?')[0];
    // Try multiple patterns to catch variations
    const contentMatch1 = urlWithoutQuery.match(/^\/api\/skills\/([^/]+)\/content$/);
    const contentMatch2 = urlWithoutQuery.match(/^\/api\/skills\/(.+)\/content$/);
    const contentMatch = contentMatch1 || contentMatch2;
    
    console.log('[API Middleware] Route matching:', {
      originalUrl: req.url,
      urlWithoutQuery,
      method: req.method,
      pattern1Match: !!contentMatch1,
      pattern2Match: !!contentMatch2,
      finalMatch: !!contentMatch,
      skillId: contentMatch ? contentMatch[1] : null,
      regexTest: /^\/api\/skills\/([^/]+)\/content$/.test(urlWithoutQuery)
    });
    
    if (contentMatch && req.method === 'POST') {
      const skillId = contentMatch[1];
      console.log("✅ HIT lesson generation route", { skillId, method: req.method, url: req.url });
      // Helper function to send JSON error response
      const sendErrorResponse = (statusCode, error, message, details) => {
        try {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          const errorResponse = {
            error: error || 'GENERATION_FAILED',
            message: message || 'An error occurred',
            ...(details && { details })
          };
          res.end(JSON.stringify(errorResponse));
        } catch (sendError) {
          console.error('[API Middleware] Failed to send error response:', sendError);
          // Last resort: try to send a basic error
          try {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'GENERATION_FAILED', message: 'Internal server error' }));
          } catch {
            // If even this fails, the connection might be broken
            console.error('[API Middleware] Could not send any response');
          }
        }
      };

      // Helper function to send JSON success response
      const sendSuccessResponse = (data) => {
        try {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (sendError) {
          console.error('[API Middleware] Failed to send success response:', sendError);
          sendErrorResponse(500, 'GENERATION_FAILED', 'Failed to send response', sendError.message);
        }
      };

      try {
        console.log('[API Middleware] ===== Lesson Generation Request Started =====');
        console.log('[API Middleware] Request details:', {
          url: req.url,
          method: req.method,
          skillId: skillId,
          hasSupabase: !!supabase,
          hasOpenAI: !!openai
        });
        
        // Parse body
        const body = await parseBody(req);
        console.log('[API Middleware] Parsed body:', {
          hasSourceType: !!body.sourceType,
          hasSourceValue: !!body.sourceValue,
          sourceValueLength: body.sourceValue?.length || 0,
          bodyKeys: Object.keys(body)
        });
        
        const { sourceType, sourceValue } = body;
        
        // Validate input
        if (!sourceType || !sourceValue) {
          console.error('[API Middleware] Validation error: Missing sourceType or sourceValue');
          sendErrorResponse(400, 'VALIDATION_ERROR', 'Missing sourceType or sourceValue');
          return;
        }
        
        // Validate sourceType
        if (!['url', 'text'].includes(sourceType)) {
          sendErrorResponse(400, 'VALIDATION_ERROR', 'sourceType must be "url" or "text".');
          return;
        }

        // Validate sourceValue
        if (typeof sourceValue !== 'string' || sourceValue.trim() === '') {
          sendErrorResponse(400, 'VALIDATION_ERROR', 'sourceValue cannot be empty.');
          return;
        }
        
        // Extract clean text (simplified for now)
        const cleanText = sourceType === 'text' 
          ? String(sourceValue).trim()
          : `Content from URL: ${sourceValue}`;
        
        console.log('[API Middleware] Extracted text length:', cleanText.length);

        // Generate IDs helper
        const generateId = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        // Create mock lesson (no external services required)
        console.log('[API Middleware] Generating mock lesson...');
        const lesson = {
          id: generateId(),
          skillId: skillId,
          userId: 'demo-user-1',
          skillName: 'Mock Lesson',
          shortDescription: 'Mock lesson generated to test the SkillMuse flow.',
          learningOutcomes: [
            'See that the lesson generation pipeline works end-to-end',
            'Understand how SkillMuse renders skills, summary and quiz',
          ],
          summary: {
            mainPoints: [
              'This is mock summary point 1.',
              'Replace this with real AI later.',
            ],
          },
          visual: {
            slides: [
              {
                title: 'Mock Slide',
                body: 'This is mock slide content for debugging.',
                bullets: ['Bullet A', 'Bullet B'],
              },
            ],
          },
          quiz: {
            questions: [
              {
                question: 'Is this a mock lesson?',
                options: ['Yes', 'No', 'Not sure', 'Maybe'],
                correctIndex: 0,
                explanation: 'This is a mock question for testing.',
              },
            ],
          },
          createdAt: new Date().toISOString(),
        };

        // Create content record
        const content = {
          id: generateId(),
          skillId: skillId,
          sourceType: sourceType,
          sourceValue: sourceValue.trim(),
          extractedText: cleanText,
          createdAt: new Date().toISOString(),
        };

        console.log('[API Middleware] Mock lesson and content created:', {
          lessonId: lesson.id,
          contentId: content.id,
          skillId: skillId
        });

        // Try to save to Supabase if available, but don't fail if it's not
        let savedContent = content;
        let savedLesson = lesson;

        if (supabase) {
          try {
            // Try to save content
            const { data: dbContent, error: contentError } = await supabase
              .from('skill_content')
              .insert({
                skill_id: skillId,
                source_type: sourceType,
                source_value: sourceValue.trim(),
                extracted_text: cleanText
              })
              .select()
              .single();

            if (!contentError && dbContent) {
              savedContent = {
                id: dbContent.id,
                skillId: dbContent.skill_id,
                sourceType: dbContent.source_type,
                sourceValue: dbContent.source_value,
                extractedText: dbContent.extracted_text,
                createdAt: dbContent.created_at
              };
              console.log('[API Middleware] Content saved to database:', savedContent.id);
            } else {
              console.warn('[API Middleware] Could not save content to database, using in-memory:', contentError?.message);
            }
          } catch (dbError) {
            console.warn('[API Middleware] Database save failed, using in-memory data:', dbError);
          }

          try {
            // Try to save lesson
            const { data: dbLesson, error: lessonError } = await supabase
              .from('skill_lessons')
              .insert({
                skill_id: skillId,
                title: lesson.skillName,
                short_description: lesson.shortDescription,
                learning_outcomes: lesson.learningOutcomes,
                lesson_data: {
                  summary: lesson.summary,
                  visual: lesson.visual,
                  quiz: lesson.quiz
                },
                created_by_user_id: lesson.userId
              })
              .select()
              .single();

            if (!lessonError && dbLesson) {
              savedLesson = {
                id: dbLesson.id,
                skillId: dbLesson.skill_id,
                userId: dbLesson.created_by_user_id || lesson.userId,
                skillName: dbLesson.title,
                shortDescription: dbLesson.short_description,
                learningOutcomes: dbLesson.learning_outcomes,
                summary: dbLesson.lesson_data?.summary || lesson.summary,
                visual: dbLesson.lesson_data?.visual || lesson.visual,
                quiz: dbLesson.lesson_data?.quiz || lesson.quiz,
                createdAt: dbLesson.created_at
              };
              console.log('[API Middleware] Lesson saved to database:', savedLesson.id);
            } else {
              console.warn('[API Middleware] Could not save lesson to database, using in-memory:', lessonError?.message);
            }
          } catch (dbError) {
            console.warn('[API Middleware] Database save failed, using in-memory data:', dbError);
          }
        } else {
          console.log('[API Middleware] Supabase not configured, using in-memory storage');
        }

        console.log('[API Middleware] ===== Lesson Generation Request Completed Successfully =====');

        // Return both content and lesson
        const response = {
          content: savedContent,
          lesson: savedLesson
        };

        sendSuccessResponse(response);
        return;
      } catch (error) {
        console.error("SKILLMUSE LESSON GENERATION ERROR:", error);
        console.error('[API Middleware] ===== Lesson Generation Failed =====');
        console.error('[API Middleware] Error type:', error?.constructor?.name);
        console.error('[API Middleware] Error message:', error instanceof Error ? error.message : String(error));
        console.error('[API Middleware] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('[API Middleware] Full error object:', error);
        
        const message = error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : 'Unknown server error';
        
        sendErrorResponse(500, 'GENERATION_FAILED', message);
        return;
      }
    }
    
    // If we get here and it's an /api/* route but wasn't handled, return JSON 404
    if (req.url.startsWith('/api/')) {
      console.log('[API Middleware] ⚠️ API route not matched or not handled:', { 
        method: req.method, 
        url: req.url,
        urlWithoutQuery: req.url.split('?')[0],
        allRoutes: 'POST /api/skills/:id/content'
      });
      
      // CRITICAL: Always return JSON for /api/* routes, never let Vite handle it
      if (!res.headersSent) {
        try {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            error: 'NOT_FOUND', 
            message: `API route not found: ${req.method} ${req.url}`,
            details: 'The requested API endpoint does not exist. Available: POST /api/skills/:id/content'
          }));
          return;
        } catch (err) {
          console.error('[API Middleware] Failed to send 404 response:', err);
        }
      }
      return; // Don't call next() for /api/* routes
    } else {
      // Not an API route, pass to next middleware
      return next();
    }
    } catch (middlewareError) {
      console.error('[API Middleware] CRITICAL ERROR in middleware:', middlewareError);
      console.error('[API Middleware] Error stack:', middlewareError instanceof Error ? middlewareError.stack : 'No stack');
      try {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            error: 'GENERATION_FAILED', 
            message: 'Internal server error in middleware',
            details: middlewareError instanceof Error ? middlewareError.message : String(middlewareError)
          }));
        }
      } catch (sendError) {
        console.error('[API Middleware] Could not send error response:', sendError);
      }
    }
  };
}
