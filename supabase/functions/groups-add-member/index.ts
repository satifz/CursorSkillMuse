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

    const { group_id, user_id, role } = await req.json();

    if (!group_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Group ID and User ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission (admin or creator)
    const { data: group } = await supabase
      .from('groups')
      .select('created_by_user_id')
      .eq('id', group_id)
      .single();

    if (!group) {
      return new Response(
        JSON.stringify({ error: 'Group not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isCreator = group.created_by_user_id === user.id;
    
    if (!isCreator) {
      // Check if user is admin
      const { data: member } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', group_id)
        .eq('user_id', user.id)
        .single();

      if (!member || member.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'You do not have permission to add members' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Add member
    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id,
        user_id,
        role: role || 'member'
      })
      .select()
      .single();

    if (memberError) {
      if (memberError.code === '23505') { // Unique constraint violation
        return new Response(
          JSON.stringify({ error: 'User is already a member of this group' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Database error adding member:', memberError);
      return new Response(
        JSON.stringify({ error: 'Unable to add member. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(member),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error adding member:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `An error occurred: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

