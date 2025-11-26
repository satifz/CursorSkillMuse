import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchPageContent(url: string, signal?: AbortSignal): Promise<string> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }
    const html = await response.text();
    
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text.substring(0, 10000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch page: ${errorMessage}`);
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

    const { skill_id, content_type, source_value, extracted_text } = await req.json();

    if (!skill_id) {
      return new Response(
        JSON.stringify({ error: 'Skill ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!content_type || !source_value) {
      return new Response(
        JSON.stringify({ error: 'Content type and source value are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify skill exists and user has access
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, created_by_user_id')
      .eq('id', skill_id)
      .single();

    if (skillError || !skill) {
      return new Response(
        JSON.stringify({ error: 'Skill not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let finalExtractedText = extracted_text;

    // If content type is URL and no extracted text provided, fetch it
    if ((content_type === 'url' || content_type === 'article') && !finalExtractedText) {
      try {
        const urlObj = new URL(source_value);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          throw new Error('Only HTTP/HTTPS URLs allowed');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        try {
          finalExtractedText = await fetchPageContent(source_value, controller.signal);
        } finally {
          clearTimeout(timeout);
        }
      } catch (fetchError) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch content: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If content type is notes/text, use source_value as extracted_text
    if (content_type === 'notes' && !finalExtractedText) {
      finalExtractedText = source_value;
    }

    const { data: content, error: dbError } = await supabase
      .from('skill_content')
      .insert({
        skill_id,
        content_type,
        source_value: source_value.trim(),
        extracted_text: finalExtractedText?.trim() || null,
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error adding content:', dbError);
      return new Response(
        JSON.stringify({ error: 'Unable to add content. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(content),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error adding content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `An error occurred: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

