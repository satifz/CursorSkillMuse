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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log('Fetching skillmuse lessons for user:', user.id);

    // Get total count
    const { count, error: countError } = await supabaseClient
      .from('skillmuse_lessons')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Count error:', countError);
      return new Response(
        JSON.stringify({ error: 'Unable to load lessons. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get paginated lessons
    const { data: lessons, error: lessonsError } = await supabaseClient
      .from('skillmuse_lessons')
      .select('id, url, title, one_line_summary, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (lessonsError) {
      console.error('Lessons error:', lessonsError);
      return new Response(
        JSON.stringify({ error: 'Unable to load lessons. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map to camelCase for frontend
    const mappedLessons = (lessons || []).map(lesson => ({
      id: lesson.id,
      url: lesson.url,
      title: lesson.title,
      oneLineSummary: lesson.one_line_summary,
      createdAt: lesson.created_at,
    }));

    return new Response(
      JSON.stringify({
        lessons: mappedLessons,
        page,
        total: count || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in skillmuse-lessons-list:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
