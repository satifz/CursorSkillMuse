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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { skill_name, description, difficulty_level } = await req.json();

    if (!skill_name || skill_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'skill_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate difficulty_level if provided
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    const finalDifficulty = difficulty_level && validDifficulties.includes(difficulty_level.toLowerCase())
      ? difficulty_level.toLowerCase()
      : 'beginner';

    const { data: skill, error: dbError } = await supabase
      .from('skills')
      .insert({
        skill_name: skill_name.trim(),
        description: description?.trim() || null,
        difficulty_level: finalDifficulty,
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating skill:', dbError);
      return new Response(
        JSON.stringify({ error: 'Unable to create skill. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(skill),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating skill:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

