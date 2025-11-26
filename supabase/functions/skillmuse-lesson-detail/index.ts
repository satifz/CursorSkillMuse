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

    const url = new URL(req.url);
    const lessonId = url.searchParams.get('id');

    if (!lessonId) {
      return new Response(JSON.stringify({ error: 'Lesson ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching skillmuse lesson:', lessonId);

    const { data: lesson, error: lessonError } = await supabaseClient
      .from('skillmuse_lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .single();

    if (lessonError) {
      console.error('Lesson error:', lessonError);
      if (lessonError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Lesson not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({ error: 'Unable to load lesson. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map to camelCase for frontend
    const mappedLesson = {
      id: lesson.id,
      url: lesson.url,
      title: lesson.title,
      createdAt: lesson.created_at,
      oneLineSummary: lesson.one_line_summary,
      keyPoints: lesson.key_points,
      sections: lesson.sections,
      flowNodes: lesson.flow_nodes,
      quizQuestions: lesson.quiz_questions,
      flashcards: lesson.flashcards,
    };

    return new Response(
      JSON.stringify({ lesson: mappedLesson }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in skillmuse-lesson-detail:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
