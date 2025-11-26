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

    if (!group_id) {
      return new Response(
        JSON.stringify({ error: 'group_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUserId = user_id || user.id; // Allow adding self or others
    const memberRole = role || 'member';

    // Verify group exists
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*, group_members(*)')
      .eq('id', group_id)
      .single();

    if (groupError || !group) {
      return new Response(
        JSON.stringify({ error: 'Group not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or creator (if adding someone else)
    if (targetUserId !== user.id) {
      const isAdmin = group.group_members?.some(
        (m: any) => m.user_id === user.id && m.role === 'admin'
      ) || group.created_by_user_id === user.id;

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Only group admins can add members' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('user_id', targetUserId)
      .single();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'User is already a member of this group' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add member
    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group_id,
        user_id: targetUserId,
        role: memberRole
      })
      .select()
      .single();

    if (memberError) {
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
    console.error('Error adding group member:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

