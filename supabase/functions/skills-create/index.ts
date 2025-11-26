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

    if (!skill_name || skill_name.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Skill name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: skill, error: dbError } = await supabase
      .from('skills')
      .insert({
        skill_name: skill_name.trim(),
        description: description?.trim() || null,
        difficulty_level: difficulty_level || 'beginner',
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating skill:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      console.error('Error details:', dbError.details);
      console.error('Error hint:', dbError.hint);
      
      // Provide more specific error messages
      let errorMessage = 'Unable to create skill. Please try again.';
      if (dbError.code === '42P01') {
        errorMessage = 'Skills table does not exist. Please run the database migration.';
      } else if (dbError.code === '42501') {
        errorMessage = 'Permission denied. Please check your database permissions.';
      } else if (dbError.message) {
        errorMessage = `Database error: ${dbError.message}`;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!skill) {
      console.error('Skill insert returned no data');
      return new Response(
        JSON.stringify({ error: 'Skill was not created. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!skill.id) {
      console.error('Skill created but missing ID:', skill);
      return new Response(
        JSON.stringify({ error: 'Skill created but ID is missing. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Skill created successfully:', skill.id);

    return new Response(
      JSON.stringify(skill),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating skill:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `An error occurred: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

