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
    
    try {
      const lessonData = JSON.parse(content);
      
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
            { role: 'user', content: userPrompt },
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

    const { skill_id, content_id } = await req.json();

    if (!skill_id) {
      return new Response(
        JSON.stringify({ error: 'Skill ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get skill info
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, skill_name')
      .eq('id', skill_id)
      .single();

    if (skillError || !skill) {
      return new Response(
        JSON.stringify({ error: 'Skill not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get skill details for metadata-based generation
    const { data: skillDetails } = await supabase
      .from('skills')
      .select('skill_name, description')
      .eq('id', skill_id)
      .single();

    // Get content - either specific content_id or all content for the skill
    let contentText = '';
    let selectedContentId = content_id;

    if (content_id) {
      const { data: content, error: contentError } = await supabase
        .from('skill_content')
        .select('id, extracted_text')
        .eq('id', content_id)
        .eq('skill_id', skill_id)
        .single();

      if (contentError || !content) {
        return new Response(
          JSON.stringify({ error: 'Content not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      contentText = content.extracted_text || '';
    } else {
      // Get all content for the skill and combine
      const { data: allContent, error: contentError } = await supabase
        .from('skill_content')
        .select('extracted_text')
        .eq('skill_id', skill_id)
        .not('extracted_text', 'is', null);

      if (contentError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch content' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!allContent || allContent.length === 0) {
        // If no content, generate from skill metadata
        if (skillDetails) {
          const skillMetadata = `Skill: ${skillDetails.skill_name}\n${skillDetails.description || ''}\n\nGenerate a comprehensive lesson about this skill covering the fundamentals, key concepts, practical applications, and best practices.`;
          contentText = skillMetadata;
          console.log('Generating lesson from skill metadata (no content available)');
        } else {
          return new Response(
            JSON.stringify({ error: 'No content found for this skill. Please add content first or ensure skill details are available.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        contentText = allContent.map(c => c.extracted_text).join('\n\n');
      }
    }

    if (!contentText || contentText.trim() === '') {
      // Fallback to skill metadata if content is empty
      if (skillDetails) {
        contentText = `Skill: ${skillDetails.skill_name}\n${skillDetails.description || ''}\n\nGenerate a comprehensive lesson about this skill.`;
        console.log('Using skill metadata as content source');
      } else {
        return new Response(
          JSON.stringify({ error: 'No extractable text found in content' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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

    // Build the full lesson JSON structure
    const lessonJson = {
      summary: { mainPoints: lessonData.mainPoints },
      visual: { slides: lessonData.slides },
      quiz: { questions: lessonData.quiz }
    };

    console.log('Saving lesson to database...');
    const { data: lesson, error: dbError } = await supabase
      .from('skill_lessons')
      .insert({
        skill_id,
        content_id: selectedContentId || null,
        title: lessonData.title,
        short_description: lessonData.description,
        learning_outcomes: lessonData.learning_outcomes,
        lesson_json: lessonJson
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

    // Update skill learning outcomes if not already set
    if (lessonData.learning_outcomes && lessonData.learning_outcomes.length > 0) {
      const { data: currentSkill } = await supabase
        .from('skills')
        .select('learning_outcomes')
        .eq('id', skill_id)
        .single();

      if (!currentSkill?.learning_outcomes || (Array.isArray(currentSkill.learning_outcomes) && currentSkill.learning_outcomes.length === 0)) {
        await supabase
          .from('skills')
          .update({ learning_outcomes: lessonData.learning_outcomes })
          .eq('id', skill_id);
      }
    }

    return new Response(
      JSON.stringify(lesson),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing lesson:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `An error occurred: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

