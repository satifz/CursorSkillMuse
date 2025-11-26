import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const AI_PROMPT = `You are an AI learning designer for SkillMuse, a skill-based learning platform.
Your job is to analyze learning content and convert it into a structured skill lesson.

IMPORTANT: Focus on SKILLS, not just articles. The content should be transformed into actionable learning outcomes.

Follow these rules:
1. If a skill name is provided, use it. Otherwise, infer the skill from the content.
2. Generate 2-4 learning outcomes (what the learner will be able to do after this lesson).
3. Create a title that is short and clear (skill-focused).
4. Create a shortDescription (1-2 sentences).
5. Identify 5-8 mainPoints that support the skill.
6. Create 5-7 visual slides. Each slide must have:
   - title (max 7 words)
   - body (1-2 sentences)
   - bullets (max 3 bullet points)
7. Create 3-5 multiple-choice quiz questions that test skill understanding.
   Each question must have:
   - question (string)
   - options (array of 4 strings)
   - correctIndex (0-3)
   - explanation (one short sentence)

All output must be valid JSON ONLY. No commentary.

Return JSON in this exact format:

{
  "skill_name": "inferred or provided skill name",
  "title": "...",
  "shortDescription": "...",
  "learning_outcomes": ["outcome 1", "outcome 2", "outcome 3"],
  "summary": { "mainPoints": ["point 1", "point 2", ...] },
  "visual": {
    "slides": [
      {
        "title": "...",
        "body": "...",
        "bullets": ["bullet 1", "bullet 2", "bullet 3"]
      }
    ]
  },
  "quiz": {
    "questions": [
      {
        "question": "...",
        "options": ["option 1", "option 2", "option 3", "option 4"],
        "correctIndex": 0,
        "explanation": "..."
      }
    ]
  }
}`;

async function generateSkillLessonFromText(cleanText: string, skillName?: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  console.log('Calling OpenAI API for skill lesson generation...');
  
  const userPrompt = skillName 
    ? `Skill: ${skillName}\n\nContent:\n\n${cleanText.substring(0, 8000)}`
    : `Content:\n\n${cleanText.substring(0, 8000)}\n\nInfer the skill from this content.`;
  
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
        max_completion_tokens: 3000,
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
      if (!lessonData.title || !lessonData.shortDescription || !lessonData.learning_outcomes || 
          !lessonData.summary || !lessonData.visual || !lessonData.quiz) {
        throw new Error('Invalid lesson structure from AI - missing required fields');
      }
      
      return {
        skill_name: lessonData.skill_name || skillName || 'General Skill',
        title: lessonData.title,
        shortDescription: lessonData.shortDescription,
        learning_outcomes: Array.isArray(lessonData.learning_outcomes) ? lessonData.learning_outcomes : [],
        mainPoints: lessonData.summary.mainPoints || [],
        slides: lessonData.visual.slides || [],
        quiz: lessonData.quiz.questions || []
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', content?.substring(0, 500));
      throw new Error('AI returned invalid JSON format');
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

    const { skill_id, content_id, content_type, source_value, skill_name } = await req.json();

    if (!skill_id) {
      return new Response(
        JSON.stringify({ error: 'Missing skill_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify skill exists and user has access
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skill_id)
      .single();

    if (skillError || !skill) {
      return new Response(
        JSON.stringify({ error: 'Skill not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedText = '';
    let finalContentId = content_id;

    // Extract text based on content type
    if (content_id) {
      // Use existing content
      const { data: content, error: contentError } = await supabase
        .from('skill_content')
        .select('*')
        .eq('id', content_id)
        .single();

      if (contentError || !content) {
        return new Response(
          JSON.stringify({ error: 'Content not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      extractedText = content.extracted_text || content.source_value;
    } else if (source_value && content_type) {
      // Extract from new content
      if (content_type === 'article' || content_type === 'url') {
        // Validate URL format
        let urlObj;
        try {
          urlObj = new URL(source_value);
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

        console.log(`Fetching content from: ${source_value} for user: ${user.id}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        try {
          extractedText = await fetchPageContent(source_value, controller.signal);
        } finally {
          clearTimeout(timeout);
        }

        // Save content to database
        const { data: newContent, error: contentSaveError } = await supabase
          .from('skill_content')
          .insert({
            skill_id: skill_id,
            content_type: content_type,
            source_value: source_value,
            extracted_text: extractedText,
            created_by_user_id: user.id
          })
          .select()
          .single();

        if (contentSaveError) {
          console.error('Error saving content:', contentSaveError);
        } else {
          finalContentId = newContent.id;
        }
      } else if (content_type === 'notes') {
        extractedText = source_value;
      } else if (content_type === 'youtube') {
        // TODO: Implement YouTube transcript extraction
        return new Response(
          JSON.stringify({ error: 'YouTube content extraction not yet implemented' }),
          { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (content_type === 'pdf') {
        // TODO: Implement PDF text extraction
        return new Response(
          JSON.stringify({ error: 'PDF content extraction not yet implemented' }),
          { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Either content_id or (source_value and content_type) must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text content extracted from source' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating skill lesson with AI...');
    let lessonData;
    try {
      lessonData = await generateSkillLessonFromText(extractedText, skill_name || skill.skill_name);
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : 'AI generation failed';
      
      if (errorMessage.includes('OPENAI_API_KEY')) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key is not configured. Please contact support.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Failed to generate lesson: ${errorMessage}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update skill with learning outcomes if not already set
    if (!skill.learning_outcomes || (Array.isArray(skill.learning_outcomes) && skill.learning_outcomes.length === 0)) {
      await supabase
        .from('skills')
        .update({ learning_outcomes: lessonData.learning_outcomes })
        .eq('id', skill_id);
    }

    console.log('Saving skill lesson to database...');
    const { data: lesson, error: dbError } = await supabase
      .from('skill_lessons')
      .insert({
        skill_id: skill_id,
        content_id: finalContentId,
        title: lessonData.title,
        short_description: lessonData.shortDescription,
        learning_outcomes: lessonData.learning_outcomes,
        lesson_json: {
          summary: { mainPoints: lessonData.mainPoints },
          visual: { slides: lessonData.slides },
          quiz: { questions: lessonData.quiz }
        }
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
    console.error('Error processing skill lesson:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: `An error occurred: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

