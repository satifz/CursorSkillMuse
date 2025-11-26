// Requires OPENAI_API_KEY environment variable
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Please enter a valid URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SSRF protection
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
    ];

    if (blockedPatterns.some(pattern => pattern.test(hostname))) {
      return new Response(JSON.stringify({ error: 'Invalid URL: private IP ranges not allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching content from:', url);

    // Fetch page content with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let htmlContent: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SkillMuse/1.0)',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      htmlContent = await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', error);
      return new Response(JSON.stringify({ error: 'Unable to fetch URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Extract main content
    const cleanText = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000);

    console.log('Generating lesson with AI...');

    // Use Lovable AI Gateway (pre-configured)
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are SkillMuse, an AI learning designer that transforms web articles into interactive visual lessons.

Given the article content and URL, produce a strictly valid JSON object with the following TypeScript shape:

{
  "title": string,
  "oneLineSummary": string,
  "keyPoints": string[],
  "sections": { "heading": string, "summary": string, "bullets": string[] }[],
  "flowNodes": { "id": string, "label": string, "description": string, "order": number }[],
  "quizQuestions": {
    "id": string,
    "question": string,
    "options": string[],
    "correctIndex": number,
    "explanation": string
  }[],
  "flashcards": {
    "id": string,
    "front": string,
    "back": string
  }[]
}

Rules:
- oneLineSummary must be max 160 characters.
- keyPoints should be 3–7 concise bullets.
- sections should cover the major logical parts of the article (3–6 sections).
- flowNodes should represent the conceptual progression of the idea in 4–10 steps, ordered by the "order" field.
- quizQuestions should contain 3–5 multiple choice questions (4 options each).
- flashcards should contain 5–10 "front/back" pairs for revision.
- Do NOT include any markdown or commentary. Return ONLY JSON.

URL: ${url}

Content:
${cleanText}`;

    console.log('Calling Lovable AI Gateway...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are SkillMuse, an AI that creates visual learning lessons from web content. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exceeded. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI processing failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    console.log('Parsing AI response...');

    let lessonData;
    try {
      lessonData = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw AI response:', generatedText?.substring(0, 500));
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save to database
    const { data: savedLesson, error: dbError } = await supabaseClient
      .from('skillmuse_lessons')
      .insert({
        user_id: user.id,
        url: url,
        title: lessonData.title || 'Untitled Lesson',
        one_line_summary: lessonData.oneLineSummary || '',
        key_points: lessonData.keyPoints || [],
        sections: lessonData.sections || [],
        flow_nodes: lessonData.flowNodes || [],
        quiz_questions: lessonData.quizQuestions || [],
        flashcards: lessonData.flashcards || [],
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error saving lesson:', dbError);
      return new Response(JSON.stringify({ error: 'Unable to save lesson. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Lesson created successfully:', savedLesson.id);

    // Map to camelCase for frontend
    const mappedLesson = {
      id: savedLesson.id,
      url: savedLesson.url,
      title: savedLesson.title,
      createdAt: savedLesson.created_at,
      oneLineSummary: savedLesson.one_line_summary,
      keyPoints: savedLesson.key_points,
      sections: savedLesson.sections,
      flowNodes: savedLesson.flow_nodes,
      quizQuestions: savedLesson.quiz_questions,
      flashcards: savedLesson.flashcards,
    };

    return new Response(JSON.stringify({ lesson: mappedLesson }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in skillmuse-process-url:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ error: 'Something went wrong while generating your lesson. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
