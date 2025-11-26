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

    const { skill_id } = await req.json();

    if (!skill_id) {
      return new Response(
        JSON.stringify({ error: 'skill_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get skill with related data
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

    // Get content for this skill
    const { data: content, error: contentError } = await supabase
      .from('skill_content')
      .select('*')
      .eq('skill_id', skill_id)
      .order('created_at', { ascending: false });

    // Get lessons for this skill
    const { data: lessons, error: lessonsError } = await supabase
      .from('skill_lessons')
      .select('*')
      .eq('skill_id', skill_id)
      .order('created_at', { ascending: false });

    return new Response(
      JSON.stringify({
        skill,
        content: content || [],
        lessons: lessons || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in skill-detail:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

