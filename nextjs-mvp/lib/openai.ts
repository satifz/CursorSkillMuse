import OpenAI from 'openai';
import { SkillLesson } from '@/types/lesson';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_PROMPT = `You are an AI learning designer for a product called SkillMuse.
Your job is to read learning content and convert it into a structured skill-based visual learning lesson.

Follow these rules:
- If a skill name/goal is provided, use it. Otherwise, infer the skill from the content.
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

// Mock lesson payload for fallback when OpenAI fails
function getMockLessonPayload(skillGoal?: string) {
  return {
    skillName: skillGoal || "Sample Skill",
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
        },
        {
          title: "Practical Examples",
          body: "Real-world examples and use cases for this skill.",
          bullets: [
            "Example scenario 1",
            "Example scenario 2"
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
        },
        {
          question: "How many learning outcomes are in this mock lesson?",
          options: [
            "One",
            "Two",
            "Three",
            "Four"
          ],
          correctIndex: 2,
          explanation: "The mock lesson contains three learning outcomes."
        },
        {
          question: "What should you do if OpenAI API key is missing?",
          options: [
            "Crash the application",
            "Use mock data",
            "Show an error page",
            "Skip lesson generation"
          ],
          correctIndex: 1,
          explanation: "The system should fall back to mock data when OpenAI is unavailable."
        }
      ]
    }
  };
}

export async function generateLesson(
  content: string,
  skillGoal?: string
): Promise<Omit<SkillLesson, 'id' | 'skillId' | 'userId' | 'createdAt'>> {
  console.log('[generateLesson] Starting lesson generation...');
  console.log('[generateLesson] Content length:', content.length);
  console.log('[generateLesson] Skill goal:', skillGoal || 'none');
  console.log('[generateLesson] OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[generateLesson] OPENAI_API_KEY is missing, using mock AI payload.');
    return getMockLessonPayload(skillGoal);
  }

  const userPrompt = skillGoal
    ? `Skill Goal: ${skillGoal}\n\nLearning content:\n\n${content.substring(0, 8000)}`
    : `Learning content:\n\n${content.substring(0, 8000)}`;

  try {
    console.log('[generateLesson] Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: AI_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    console.log('[generateLesson] OpenAI API response received');

    const content_text = response.choices[0].message.content;
    if (!content_text) {
      console.error('[generateLesson] No content in OpenAI response, using mock');
      return getMockLessonPayload(skillGoal);
    }

    console.log('[generateLesson] Parsing JSON from OpenAI response...');
    let lessonData;
    try {
      lessonData = JSON.parse(content_text);
    } catch (parseError) {
      console.error('[generateLesson] JSON parse error:', parseError);
      console.log('[generateLesson] Using mock payload due to parse error');
      return getMockLessonPayload(skillGoal);
    }

    // Validate required fields (AI returns snake_case, we convert to camelCase)
    if (!lessonData.skill_name || !lessonData.short_description || !lessonData.learning_outcomes || 
        !lessonData.summary || !lessonData.visual || !lessonData.quiz) {
      console.error('[generateLesson] Invalid lesson structure from AI, using mock');
      return getMockLessonPayload(skillGoal);
    }

    console.log('[generateLesson] Successfully generated lesson from OpenAI');
    return {
      skillName: lessonData.skill_name || skillGoal || 'General Skill',
      shortDescription: lessonData.short_description,
      learningOutcomes: Array.isArray(lessonData.learning_outcomes) ? lessonData.learning_outcomes : [],
      summary: {
        mainPoints: lessonData.summary.main_points || []
      },
      visual: {
        slides: lessonData.visual.slides || []
      },
      quiz: {
        questions: lessonData.quiz.questions || []
      }
    };
  } catch (error) {
    console.error('[generateLesson] OpenAI API error:', error);
    if (error instanceof OpenAI.APIError) {
      console.error('[generateLesson] OpenAI APIError details:', error.message);
    }
    console.log('[generateLesson] Falling back to mock payload due to error');
    return getMockLessonPayload(skillGoal);
  }
}

