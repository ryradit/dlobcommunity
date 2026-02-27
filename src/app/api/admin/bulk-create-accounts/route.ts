import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client with service role key for user creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface MemberData {
  full_name: string;
  email: string;
  phone?: string;
  playing_level?: string;
  dominant_hand?: string;
  years_playing?: string;
  role?: string;
}

interface BulkCreateRequest {
  members: MemberData[];
  template_password: string;
  send_email?: boolean; // Whether to send confirmation emails
}

interface CreateResult {
  email: string;
  status: 'created' | 'exists' | 'error';
  user_id?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body: BulkCreateRequest = await request.json();
    const { members, template_password, send_email = false } = body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: 'Members array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!template_password || template_password.length < 6) {
      return NextResponse.json(
        { error: 'Template password is required (minimum 6 characters)' },
        { status: 400 }
      );
    }

    console.log(`[Bulk Create] Starting bulk account creation for ${members.length} members`);

    const results: CreateResult[] = [];

    for (const member of members) {
      try {
        // Validate email
        if (!member.email || !member.email.includes('@')) {
          results.push({
            email: member.email || 'invalid',
            status: 'error',
            error: 'Invalid email address'
          });
          continue;
        }

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUsers?.users.some(u => u.email === member.email);

        if (userExists) {
          console.log(`[Bulk Create] ⚠️ User already exists: ${member.email}`);
          results.push({
            email: member.email,
            status: 'exists',
            error: 'Account already exists'
          });
          continue;
        }

        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: member.email,
          password: template_password,
          email_confirm: !send_email, // Auto-confirm if not sending email
          user_metadata: {
            full_name: member.full_name,
            phone: member.phone,
            playing_level: member.playing_level,
            dominant_hand: member.dominant_hand,
            years_playing: member.years_playing
          }
        });

        if (createError) {
          console.error(`[Bulk Create] ❌ Error creating user ${member.email}:`, createError);
          results.push({
            email: member.email,
            status: 'error',
            error: createError.message
          });
          continue;
        }

        if (!newUser.user) {
          results.push({
            email: member.email,
            status: 'error',
            error: 'User creation failed - no user returned'
          });
          continue;
        }

        // Update or create profile (trigger should handle this, but we do it explicitly)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: newUser.user.id,
            full_name: member.full_name,
            email: member.email,
            phone: member.phone,
            playing_level: member.playing_level,
            dominant_hand: member.dominant_hand,
            years_playing: member.years_playing,
            role: member.role || 'member',
            is_active: true
          });

        if (profileError) {
          console.error(`[Bulk Create] ⚠️ Profile creation warning for ${member.email}:`, profileError);
          // Don't fail the whole operation for profile errors
        }

        console.log(`[Bulk Create] ✅ Created account: ${member.email}`);
        results.push({
          email: member.email,
          status: 'created',
          user_id: newUser.user.id
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (memberError) {
        console.error(`[Bulk Create] ❌ Exception for ${member.email}:`, memberError);
        results.push({
          email: member.email,
          status: 'error',
          error: memberError instanceof Error ? memberError.message : 'Unknown error'
        });
      }
    }

    // Summary
    const summary = {
      total: results.length,
      created: results.filter(r => r.status === 'created').length,
      exists: results.filter(r => r.status === 'exists').length,
      errors: results.filter(r => r.status === 'error').length
    };

    console.log(`[Bulk Create] 📊 Summary:`, summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
      template_password: template_password // Return for admin to share with members
    });

  } catch (error) {
    console.error('[Bulk Create] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - List all users (for admin verification)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get all users
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: 'Failed to list users' },
        { status: 500 }
      );
    }

    // Get profiles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      total_auth_users: authUsers?.users.length || 0,
      total_profiles: profiles?.length || 0,
      users: authUsers?.users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at,
        last_sign_in_at: u.last_sign_in_at
      }))
    });

  } catch (error) {
    console.error('[Bulk Create] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
