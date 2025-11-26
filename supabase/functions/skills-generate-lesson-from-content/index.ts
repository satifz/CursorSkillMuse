import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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

async function generateLessonFromText(cleanText: string, skillName?: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  console.log('Calling OpenAI API...');
  
  const userPrompt = skillName 
    ? `Skill: ${skillName}\n\nLearning content:\n\n${cleanText.substring(0, 8000)}`
    : `Learning content:\n\n${cleanText.substring(0, 8000)}`;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: AI_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI response received');
    
    // Parse the JSON response
    try {
      const lessonData = JSON.parse(content);
      
      // Validate required fields
      if (!lessonData.skill_name || !lessonData.short_description || !lessonData.learning_outcomes || 
          !lessonData.summary || !lessonData.visual || !lessonData.quiz) {
        console.error('Invalid lesson structure from AI:', lessonData);
        throw new Error('Invalid lesson structure from AI - missing required fields');
      }
      
      return {
        skill_name: lessonData.skill_name,
        short_description: lessonData.short_description,
        learning_outcomes: Array.isArray(lessonData.learning_outcomes) ? lessonData.learning_outcomes : [],
        summary: {
          main_points: Array.isArray(lessonData.summary?.main_points) ? lessonData.summary.main_points : []
        },
        visual: {
          slides: Array.isArray(lessonData.visual?.slides) ? lessonData.visual.slides : []
        },
        quiz: {
          questions: Array.isArray(lessonData.quiz?.questions) ? lessonData.quiz.questions : []
        }
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`AI generation failed: ${errorMessage}`);
  }
}

async function fetchPageContent(url: string, signal?: AbortSignal): Promise<string> {
  try {
    const response = await fetch(url, {
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Simple HTML stripping - remove script and style tags, then extract text
    let cleanText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length < 100) {
      throw new Error('Extracted text is too short');
    }

    return cleanText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch page: ${errorMessage}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { skill_id, sourceType, sourceValue } = await req.json();

    if (!skill_id) {
      return new Response(
        JSON.stringify({ error: 'Skill ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sourceType || !['url', 'text'].includes(sourceType)) {
      return new Response(
        JSON.stringify({ error: 'sourceType must be "url" or "text"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sourceValue || sourceValue.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'sourceValue is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get skill info
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, skill_name, description')
      .eq('id', skill_id)
      .single();

    if (skillError || !skill) {
      return new Response(
        JSON.stringify({ error: 'Skill not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text based on source type
    let contentText = '';
    
    if (sourceType === 'url') {
      console.log(`Fetching content from URL: ${sourceValue}`);
      
      // Validate URL
      try {
        const url = new URL(sourceValue);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return new Response(
            JSON.stringify({ error: 'Only HTTP/HTTPS URLs are allowed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch and extract text from URL
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        contentText = await fetchPageContent(sourceValue, controller.signal);
        clearTimeout(timeout);
        console.log(`Extracted ${contentText.length} characters from URL`);
      } catch (fetchError) {
        console.error('Error fetching URL:', fetchError);
        const errorMsg = fetchError instanceof Error ? fetchError.message : 'Failed to fetch URL';
        return new Response(
          JSON.stringify({ error: `Failed to fetch URL: ${errorMsg}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Use raw text directly
      contentText = sourceValue.trim();
      console.log(`Using provided text content (${contentText.length} characters)`);
    }

    if (!contentText || contentText.length < 100) {
      return new Response(
        JSON.stringify({ error: 'Content is too short. Please provide at least 100 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate lesson using AI
    console.log('Generating lesson with AI...');
    let lessonData;
    try {
      lessonData = await generateLessonFromText(contentText, skill.skill_name);
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : 'AI generation failed';
      
      if (errorMessage.includes('OPENAI_API_KEY')) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key is not configured. Please contact support.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (errorMessage.includes('API error')) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API error. Please try again later.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Failed to generate lesson: ${errorMessage}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Saving lesson to database...');
    
    // Save lesson to skill_lessons table
    // Use skill_name from AI or fallback to skill.skill_name
    const lessonSkillName = lessonData.skill_name || skill.skill_name;
    
    const { data: lesson, error: dbError } = await supabase
      .from('skill_lessons')
      .insert({
        skill_id: skill_id,
        title: lessonSkillName, // Use skill_name as title for compatibility
        short_description: lessonData.short_description,
        learning_outcomes: lessonData.learning_outcomes,
        lesson_data: {
          summary: lessonData.summary,
          visual: lessonData.visual,
          quiz: lessonData.quiz
        },
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (dbError || !lesson) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save lesson to database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lesson saved successfully:', lesson.id);

    return new Response(
      JSON.stringify(lesson),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `An unexpected error occurred: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

