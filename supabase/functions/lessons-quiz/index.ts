import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { lessonId, answers } = await req.json();

    if (!lessonId || !answers || !Array.isArray(answers)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: lessonId and answers array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Grading quiz for lesson: ${lessonId}, user: ${user.id}`);
    
    // Verify lesson belongs to user
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('quiz_json, user_id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lesson.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate score
    const questions = lesson.quiz_json.questions || [];
    let correctCount = 0;

    answers.forEach((answerIndex: number, i: number) => {
      if (questions[i] && questions[i].correctIndex === answerIndex) {
        correctCount++;
      }
    });

    const total = questions.length;
    const score = Math.round((correctCount / total) * 100);

    // Save quiz result
    const { data: quizResult, error: resultError } = await supabase
      .from('quiz_results')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        score: score,
        answers_json: answers
      })
      .select()
      .single();

    if (resultError) {
      console.error('Failed to save quiz result:', resultError);
      return new Response(
        JSON.stringify({ error: 'Unable to save quiz result. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        score,
        correctCount,
        total,
        quizResultId: quizResult?.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lessons-quiz:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
