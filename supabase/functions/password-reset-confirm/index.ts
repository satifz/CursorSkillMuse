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
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Token and new password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'This password is not allowed. Please choose a stronger password.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Hash the token to find it in database
    const tokenHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(token)
    );
    const tokenHashHex = Array.from(new Uint8Array(tokenHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Find and validate token
    const { data: resetToken, error: tokenError } = await supabaseClient
      .from('password_reset_tokens')
      .select('*')
      .eq('token_hash', tokenHashHex)
      .single();

    if (tokenError || !resetToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired reset link' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Reset link has expired. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token has been used
    if (resetToken.used) {
      return new Response(
        JSON.stringify({ error: 'This reset link has already been used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      resetToken.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      
      // Sanitize password-related errors to prevent information leakage
      const errorMessage = updateError.message || '';
      if (errorMessage.toLowerCase().includes('password') ||
          errorMessage.toLowerCase().includes('weak') ||
          errorMessage.toLowerCase().includes('leaked') ||
          errorMessage.toLowerCase().includes('compromised')) {
        return new Response(
          JSON.stringify({ error: 'This password is not allowed. Please choose a stronger password.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Unable to update password. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as used
    await supabaseClient
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token_hash', tokenHashHex);

    console.log('Password updated successfully for user:', resetToken.user_id);

    return new Response(
      JSON.stringify({ message: 'Password updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in password-reset-confirm:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});