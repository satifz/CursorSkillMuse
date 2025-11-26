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
- Create a title that is short and clear.
- Create a shortDescription (1–2 sentences).
- Generate 2–4 learning_outcomes that describe what the learner will achieve (e.g., "Understand HVAC safety basics", "Explain three core AI concepts").
- Identify 5–8 mainPoints in the summary.
- Create 5–7 slides. Each slide must have:
    - title (max 7 words)
    - body (1–2 sentences)
    - bullets (max 3 bullet points)
- Create 3–5 multiple-choice quiz questions.
- Each question must have:
    - question (the question text)
    - options (array of 4 strings)
    - correctIndex (0–3)
    - explanation (one short sentence)
- All output must be valid JSON ONLY. No commentary.

Return JSON in this exact format:

{
  "title": "...",
  "shortDescription": "...",
  "learning_outcomes": ["string", "string", "string"],
  "summary": { "mainPoints": [] },
  "visual": { "slides": [] },
  "quiz": { "questions": [] }
}`;

async function generateLessonFromText(cleanText: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  console.log('Calling OpenAI API...');
  
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
          { role: 'user', content: `Article text:\n\n${cleanText.substring(0, 8000)}` }
        ],
        max_completion_tokens: 2000,
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
      if (!lessonData.title || !lessonData.shortDescription || !lessonData.learning_outcomes || !lessonData.summary || !lessonData.visual || !lessonData.quiz) {
        throw new Error('Invalid lesson structure from AI');
      }
      
      return {
        title: lessonData.title,
        description: lessonData.shortDescription,
        learning_outcomes: lessonData.learning_outcomes || [],
        mainPoints: lessonData.summary.mainPoints,
        slides: lessonData.visual.slides,
        quiz: lessonData.quiz.questions
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      
      // Retry once with explicit instruction
      console.log('Retrying with fix instruction...');
      const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: AI_PROMPT },
            { role: 'user', content: `Article text:\n\n${cleanText.substring(0, 8000)}` },
            { role: 'assistant', content: content },
            { role: 'user', content: 'Fix your JSON. Output valid JSON only.' }
          ],
          max_completion_tokens: 2000,
          response_format: { type: "json_object" }
        }),
      });

      if (!retryResponse.ok) {
        throw new Error('AI failed to generate valid lesson structure');
      }

      const retryData = await retryResponse.json();
      const retryContent = retryData.choices[0].message.content;
      const retryLessonData = JSON.parse(retryContent);
      
      return {
        title: retryLessonData.title,
        description: retryLessonData.shortDescription,
        learning_outcomes: retryLessonData.learning_outcomes || [],
        mainPoints: retryLessonData.summary.mainPoints,
        slides: retryLessonData.visual.slides,
        quiz: retryLessonData.quiz.questions
      };
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`AI generation failed: ${errorMessage}`);
  }
}

async function fetchPageContent(url: string, signal?: AbortSignal): Promise<string> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }
    const html = await response.text();
    
    // Simple text extraction (remove HTML tags)
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text.substring(0, 5000);
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

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    let urlObj;
    try {
      urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP/HTTPS URLs allowed');
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Block private IP ranges (SSRF protection)
    const hostname = urlObj.hostname;
    const blockedPatterns = [
      /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^192\.168\./,
      /^169\.254\./, /^::1$/, /^fc00:/, /^localhost$/i
    ];
    
    if (blockedPatterns.some(pattern => pattern.test(hostname))) {
      return new Response(
        JSON.stringify({ error: 'Private IP addresses are not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching content from: ${url} for user: ${user.id}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    let pageContent;
    try {
      pageContent = await fetchPageContent(url, controller.signal);
    } finally {
      clearTimeout(timeout);
    }

    console.log('Generating lesson with AI...');
    let lessonData;
    try {
      lessonData = await generateLessonFromText(pageContent);
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : 'AI generation failed';
      
      // Return specific error messages for common issues
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
    const { data: lesson, error: dbError } = await supabase
      .from('lessons')
      .insert({
        user_id: user.id,
        title: lessonData.title,
        short_description: lessonData.description,
        source_type: 'url',
        source_value: url,
        summary_json: { mainPoints: lessonData.mainPoints },
        visual_json: { slides: lessonData.slides },
        quiz_json: { questions: lessonData.quiz }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error saving lesson:', dbError);
      return new Response(
        JSON.stringify({ error: 'Unable to save lesson. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(lesson),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error on server
    console.error('Error processing lesson:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return more specific error message
    return new Response(
      JSON.stringify({ error: `An error occurred: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
