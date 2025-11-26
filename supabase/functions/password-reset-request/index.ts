import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Rate limiting: Check attempts in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: recentAttempts, error: attemptsError } = await supabaseClient
      .from('password_reset_attempts')
      .select('*')
      .eq('email', email.toLowerCase())
      .gte('attempted_at', fifteenMinutesAgo);

    if (attemptsError) {
      console.error('Error checking rate limit:', attemptsError);
    }

    // Allow max 3 attempts per 15 minutes per email
    if (recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ error: 'Too many password reset attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log attempt
    await supabaseClient
      .from('password_reset_attempts')
      .insert({
        email: email.toLowerCase(),
        ip_address: clientIp,
        success: false
      });

    // Check if user exists
    const { data: { users }, error: userError } = await supabaseClient.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      // Return success anyway to prevent email enumeration
      return new Response(
        JSON.stringify({ message: 'If an account exists with this email, you will receive a password reset link.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't reveal that user doesn't exist (prevent email enumeration)
      console.log('User not found for email:', email);
      return new Response(
        JSON.stringify({ message: 'If an account exists with this email, you will receive a password reset link.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure token
    const token = crypto.randomUUID();
    const tokenHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(token)
    );
    const tokenHashHex = Array.from(new Uint8Array(tokenHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Store token (expires in 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    const { error: tokenError } = await supabaseClient
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHashHex,
        expires_at: expiresAt,
        used: false
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Unable to process request. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email with reset link
    const resetUrl = `${Deno.env.get('SUPABASE_URL')?.replace('//', '//').split('/')[2].includes('lovable.app') 
      ? 'https://' + Deno.env.get('SUPABASE_URL')?.split('//')[1].split('.')[0].replace('ilczqqlrzwddmsmiimlg', '') + 'skillmuse.lovable.app'
      : 'http://localhost:5173'}/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: 'SkillMuse <onboarding@resend.dev>',
        to: [email],
        subject: 'Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Reset Your Password</h1>
            <p>You requested to reset your password. Click the link below to create a new password:</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });

      // Mark attempt as successful
      await supabaseClient
        .from('password_reset_attempts')
        .update({ success: true })
        .eq('email', email.toLowerCase())
        .gte('attempted_at', fifteenMinutesAgo)
        .order('attempted_at', { ascending: false })
        .limit(1);

      console.log('Password reset email sent to:', email);

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Unable to send reset email. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'If an account exists with this email, you will receive a password reset link.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in password-reset-request:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});