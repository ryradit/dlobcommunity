import { NextRequest, NextResponse } from 'next/server';
import { supabase, isDemoMode } from '@/lib/supabase';
import supabaseAdmin from '@/lib/supabase-admin';

// Mock members for demo mode
const mockMembers = [
  { id: '1', name: 'Ryan Ahmad', email: 'ryan@dlob.com', role: 'admin', membership_type: 'premium' },
  { id: '2', name: 'Budi Santoso', email: 'budi@example.com', role: 'member', membership_type: 'regular' },
  { id: '3', name: 'Siti Nurhaliza', email: 'siti@example.com', role: 'member', membership_type: 'premium' },
  { id: '4', name: 'Ahmad Fauzi', email: 'ahmad@example.com', role: 'member', membership_type: 'regular' },
  { id: '5', name: 'Linda Sari', email: 'linda@example.com', role: 'member', membership_type: 'regular' },
  { id: '6', name: 'Teguh Wijaya', email: 'teguh@example.com', role: 'member', membership_type: 'premium' },
  { id: '7', name: 'Maya Putri', email: 'maya@example.com', role: 'member', membership_type: 'regular' },
  { id: '8', name: 'Andi Rahman', email: 'andi@example.com', role: 'member', membership_type: 'premium' },
  { id: '9', name: 'Dewi Sartika', email: 'dewi@example.com', role: 'member', membership_type: 'regular' },
  { id: '10', name: 'Riko Pratama', email: 'riko@example.com', role: 'member', membership_type: 'regular' }
];

// Get all members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeAdmin = searchParams.get('exclude_admin') === 'true';

    // Handle demo mode
    if (isDemoMode) {
      console.log('🎭 Demo mode: Returning mock members');
      let members = mockMembers;
      
      if (excludeAdmin) {
        members = mockMembers.filter(member => member.role !== 'admin');
      }

      return NextResponse.json({
        success: true,
        data: members
      });
    }

    // Fetch real members from Supabase
    let query = supabase
      .from('members')
      .select('id, name, email, role, membership_type')
      .order('name', { ascending: true });

    // Exclude admin members if requested
    if (excludeAdmin) {
      query = query.neq('role', 'admin');
    }

    const { data: members, error } = await query;

    if (error) {
      // If members table doesn't exist, return empty array
      if (error.message.includes('relation "members" does not exist')) {
        console.log('⚠️ Members table not found, returning empty array');
        return NextResponse.json({
          success: true,
          data: [],
          warning: 'Members table not found - please add members first'
        });
      }
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    // Return whatever members were found (could be empty array)
    return NextResponse.json({
      success: true,
      data: members || []
    });

    return NextResponse.json({
      success: true,
      data: members
    });

  } catch (error: any) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Create new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      role = 'member', 
      membership_type = 'regular',
      createAuth = false,
      defaultPassword = 'password123'
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Try to create member in Supabase first, fallback to demo mode if it fails
    try {
      console.log('📝 Attempting to create member in Supabase:', { name, email, role, membership_type });
      
      // Use admin client if available (bypasses RLS), otherwise use regular client
      const client = supabaseAdmin || supabase;
      console.log('🔧 Using client:', supabaseAdmin ? 'Admin (bypasses RLS)' : 'Regular (subject to RLS)');
      
      const { data: member, error } = await client
        .from('members')
        .insert({
          name,
          email,
          role,
          membership_type
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase member creation error:', error);
        
        // Handle different types of errors
        if (error.message.includes('relation "members" does not exist')) {
          console.log('⚠️ Members table not found, creating demo member');
          const demoMember = {
            id: `demo-member-${Date.now()}`,
            name,
            email,
            role,
            membership_type,
            created_at: new Date().toISOString()
          };

          return NextResponse.json({
            success: true,
            data: {
              ...demoMember,
              authCreated: createAuth, // In demo mode, simulate auth creation
              authError: createAuth ? null : 'Auth not requested'
            },
            warning: 'Member created in demo mode - members table not found in database'
          });
        }
        
        // Handle RLS policy violations
        if (error.message.includes('row-level security policy')) {
          console.log('🔒 RLS policy violation - need to fix database permissions');
          const demoMember = {
            id: `demo-member-${Date.now()}`,
            name,
            email,
            role,
            membership_type,
            created_at: new Date().toISOString()
          };

          return NextResponse.json({
            success: true,
            data: {
              ...demoMember,
              authCreated: createAuth, // In demo mode, simulate auth creation
              authError: createAuth ? null : 'Auth not requested'
            },
            warning: 'Member created in demo mode - RLS policy prevents database insertion. Run the fix-member-rls.sql script in Supabase SQL editor.'
          });
        }
        
        throw new Error(`Failed to create member: ${error.message}`);
      }

      console.log('✅ Member created successfully in Supabase:', member);
      
      // Create authentication for the member if requested
      let authCreated = false;
      let authError = null;
      
      if (createAuth) {
        console.log('🔐 Attempting to create authentication for new member:', email);
        console.log('🔧 Admin client available:', !!supabaseAdmin);
        console.log('🔧 Service key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        if (supabaseAdmin) {
          try {
            console.log('🔐 Using admin client to create user account...');
            
            const { data: authUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
              email,
              password: defaultPassword,
              email_confirm: true, // Auto-confirm email for admin-created users
              user_metadata: {
                name,
                role,
                member_id: member.id
              }
            });

            if (signUpError) {
              console.error('❌ Admin auth creation error:', signUpError);
              authError = signUpError.message;
              
              // Try alternative method using regular client
              console.log('🔄 Trying alternative signup method...');
              try {
                const { data: altAuthUser, error: altSignUpError } = await supabase.auth.signUp({
                  email,
                  password: defaultPassword,
                  options: {
                    data: {
                      name,
                      role,
                      member_id: member.id
                    }
                  }
                });

                if (altSignUpError) {
                  console.error('❌ Alternative auth creation also failed:', altSignUpError);
                  authError = `Admin method failed: ${signUpError.message}. Alternative method failed: ${altSignUpError.message}`;
                } else {
                  console.log('✅ Authentication created via alternative method for:', email);
                  authCreated = true;
                  authError = 'Created via alternative method - user may need to verify email';
                }
              } catch (altError: any) {
                console.error('❌ Alternative auth method exception:', altError);
                authError = `Both admin and alternative methods failed: ${signUpError.message}`;
              }
            } else {
              console.log('✅ Authentication created successfully via admin for:', email);
              authCreated = true;
              
              // Update member record with auth_user_id if auth was successful
              try {
                await client
                  .from('members')
                  .update({ auth_user_id: authUser.user.id })
                  .eq('id', member.id);
                console.log('✅ Linked auth_user_id to member record');
              } catch (updateError) {
                console.warn('⚠️ Could not link auth_user_id to member - auth_user_id column may not exist');
              }
            }
          } catch (authCreateError: any) {
            console.error('❌ Auth creation exception:', authCreateError);
            authError = authCreateError.message;
          }
        } else {
          console.warn('⚠️ Admin client not available - missing SUPABASE_SERVICE_ROLE_KEY');
          authError = 'Admin client not available - missing service role key in environment variables';
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          ...member,
          authCreated,
          authError
        }
      });

    } catch (supabaseError: any) {
      console.error('❌ Supabase operation failed:', supabaseError);
      
      // Fallback to demo mode if Supabase is completely unavailable
      if (isDemoMode || supabaseError.message.includes('Invalid API key')) {
        console.log('🎭 Falling back to demo mode for member creation');
        const demoMember = {
          id: `demo-member-${Date.now()}`,
          name,
          email,
          role,
          membership_type,
          created_at: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          data: {
            ...demoMember,
            authCreated: createAuth, // In demo mode, simulate auth creation
            authError: createAuth ? null : 'Auth not requested'
          },
          warning: 'Member created in demo mode - Supabase not available'
        });
      }
      
      throw supabaseError;
    }

  } catch (error: any) {
    console.error('Create member error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}