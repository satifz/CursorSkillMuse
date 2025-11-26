import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    
    return text.substring(0, 5000);
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

    const { skill_id, content_type, source_value } = await req.json();

    if (!skill_id) {
      return new Response(
        JSON.stringify({ error: 'skill_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!content_type) {
      return new Response(
        JSON.stringify({ error: 'content_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!source_value || source_value.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'source_value is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify skill exists
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

    let extractedText = '';

    // Extract text based on content type
    if (content_type === 'article' || content_type === 'url') {
      // Validate URL format
      let urlObj;
      try {
        urlObj = new URL(source_value);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          throw new Error('Only HTTP/HTTPS URLs allowed');
        }
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Block private IP ranges (SSRF protection)
      const hostname = urlObj.hostname;
      const blockedPatterns = [
        /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^192\.168\./,
        /^169\.254\./, /^::1$/, /^fc00:/, /^localhost$/i
      ];
      
      if (blockedPatterns.some(pattern => pattern.test(hostname))) {
        return new Response(
          JSON.stringify({ error: 'Private IP addresses are not allowed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Fetching content from: ${source_value} for user: ${user.id}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      try {
        extractedText = await fetchPageContent(source_value, controller.signal);
      } finally {
        clearTimeout(timeout);
      }
    } else if (content_type === 'notes') {
      extractedText = source_value;
    } else if (content_type === 'youtube') {
      // TODO: Implement YouTube transcript extraction
      return new Response(
        JSON.stringify({ error: 'YouTube content extraction not yet implemented' }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (content_type === 'pdf') {
      // TODO: Implement PDF text extraction
      return new Response(
        JSON.stringify({ error: 'PDF content extraction not yet implemented' }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid content_type. Must be: article, url, notes, youtube, or pdf' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save content to database
    const { data: content, error: dbError } = await supabase
      .from('skill_content')
      .insert({
        skill_id: skill_id,
        content_type: content_type,
        source_value: source_value.trim(),
        extracted_text: extractedText,
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error saving content:', dbError);
      return new Response(
        JSON.stringify({ error: 'Unable to save content. Please try again.' }),
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

