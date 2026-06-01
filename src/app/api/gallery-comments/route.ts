import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const galleryItemId = searchParams.get('galleryItemId');
    const parentCommentId = searchParams.get('parentCommentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!galleryItemId) {
      return NextResponse.json(
        { error: 'galleryItemId is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('gallery_comments')
      .select(
        'id, gallery_item_id, user_id, display_name, content, parent_comment_id, is_flagged, created_at, updated_at',
        { count: 'exact' }
      )
      .eq('gallery_item_id', galleryItemId)
      .eq('is_deleted', false);

    // Filter by parent comment if specified (for threaded replies)
    if (parentCommentId) {
      query = query.eq('parent_comment_id', parentCommentId);
    } else {
      // Only get top-level comments if parentCommentId not specified
      query = query.is('parent_comment_id', null);
    }

    // Sort: top-level comments newest first, replies oldest first
    const sortOrder = parentCommentId ? { ascending: true } : { ascending: false };
    
    const { data, error, count } = await query
      .order('created_at', sortOrder)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    console.log('\n📋 [GET] Raw data from database (first 2 comments):');
    (data || []).slice(0, 2).forEach((c: any, idx: number) => {
      console.log(`  [${idx}] id=${c.id}, user_id=${c.user_id}, display_name=${c.display_name}`);
    });

    // Calculate reply counts and love counts separately
    let commentsWithReplies = data || [];
    
    // Add love counts and user avatar to all comments (both top-level and replies)
    commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        // Get love count
        const { count: loveCount } = await supabase
          .from('gallery_comment_reactions')
          .select('id', { count: 'exact', head: true })
          .eq('comment_id', comment.id)
          .eq('reaction_type', 'love');

        // Get user avatar if comment has a user_id
        let avatarUrl: string | null = null;
        if (comment.user_id) {
          console.log(`\n🔍 Fetching avatar for user: ${comment.user_id}`);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', comment.user_id)
            .single();
          
          if (profileError) {
            console.log(`  ❌ Profile error:`, profileError.message || profileError);
          } else {
            console.log(`  ✓ Full profile data keys:`, Object.keys(profileData || {}));
            console.log(`  ✓ Profile avatar_url field:`, profileData?.avatar_url);
          }
          
          if (profileData?.avatar_url) {
            avatarUrl = profileData.avatar_url;
            console.log(`  ✓ Avatar found: ${avatarUrl}`);
          } else {
            console.log(`  ⚠️  No avatar_url in profile`);
          }
        } else {
          console.log(`  - Comment is anonymous (no user_id)`);
        }

        let commentWithCounts: any = {
          ...comment,
          love_count: loveCount || 0,
          avatar_url: avatarUrl,
        };

        // Only fetch reply counts for top-level comments (no parent)
        if (!parentCommentId && !comment.parent_comment_id) {
          const { count: replyCount } = await supabase
            .from('gallery_comments')
            .select('id', { count: 'exact', head: true })
            .eq('parent_comment_id', comment.id)
            .eq('is_deleted', false);

          // Only set reply_count if there are actual replies
          if (replyCount && replyCount > 0) {
            commentWithCounts.reply_count = replyCount;
          }
        }

        return commentWithCounts;
      })
    );

    console.log(`\n📤 Returning ${commentsWithReplies.length} comments with avatars`);
    commentsWithReplies.slice(0, 2).forEach((c: any) => {
      console.log(`  - ${c.display_name}: avatar_url = ${c.avatar_url || 'null'}`);
    });

    return NextResponse.json(
      {
        comments: commentsWithReplies,
        total: count || 0,
        hasMore: count ? offset + limit < count : false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      galleryItemId,
      content,
      parentCommentId = null,
      displayName = null,
      userName = null,
    } = body;

    if (!galleryItemId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'galleryItemId and content are required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be 1000 characters or less' },
        { status: 400 }
      );
    }

    const auth = await getAuth(request);
    let userId = auth?.user?.id || null;
    let authDisplayName = null;
    let sessionId = null;

    console.log('\n📝 [POST] Creating comment:');
    console.log('  - userId:', userId);
    console.log('  - AuthContext user id:', auth?.user?.id);
    console.log('  - Auth object keys:', Object.keys(auth || {}));

    // Get authenticated user's display name
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      authDisplayName = profile?.full_name || 'Anonymous';
    } else {
      // Generate session ID for anonymous users
      sessionId = generateSessionId();
    }

    const finalDisplayName = authDisplayName || displayName || 'Anonymous';

    // Use explicit UTC timestamp instead of relying on Supabase's default
    const utcNow = new Date().toISOString();

    const { data, error } = await supabase
      .from('gallery_comments')
      .insert([
        {
          gallery_item_id: galleryItemId,
          user_id: userId,
          display_name: finalDisplayName,
          anonymous_session_id: sessionId,
          content: content.trim(),
          parent_comment_id: parentCommentId,
          created_at: utcNow,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log('  ✅ Comment inserted:');
    console.log('    - id:', data?.id);
    console.log('    - user_id:', data?.user_id);
    console.log('    - display_name:', data?.display_name);

    // Fetch avatar_url if comment is from authenticated user
    let avatarUrl: string | null = null;
    if (data?.user_id) {
      console.log(`\n🔍 Fetching avatar for newly posted comment by user: ${data.user_id}`);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user_id)
        .single();
      
      if (profileError) {
        console.log(`  ❌ Profile error:`, profileError.message || profileError);
      } else {
        console.log(`  ✓ Full profile data keys:`, Object.keys(profileData || {}));
        console.log(`  ✓ Profile avatar_url field:`, profileData?.avatar_url);
      }
      
      if (profileData?.avatar_url) {
        avatarUrl = profileData.avatar_url;
        console.log(`  ✓ Avatar found: ${avatarUrl}`);
      }
    }

    // Include avatar_url in response
    const commentWithAvatar = {
      ...data,
      avatar_url: avatarUrl,
    };

    // If new session, return it to client for localStorage
    console.log('Comment created:', {
      id: data?.id,
      created_at: data?.created_at,
      avatar_url: avatarUrl,
      server_time_now: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        comment: commentWithAvatar,
        sessionId: sessionId, // Only set if new anonymous user
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, action, reason = null, sessionId = null } = body;

    if (!commentId || !action) {
      return NextResponse.json(
        { error: 'commentId and action are required' },
        { status: 400 }
      );
    }

    const auth = await getAuth(request);

    if (action === 'delete') {
      // Soft delete - only comment owner can do this
      const { data: comment } = await supabase
        .from('gallery_comments')
        .select('user_id, anonymous_session_id')
        .eq('id', commentId)
        .single();

      if (!comment) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      // Check authorization
      if (
        !(comment.user_id === auth?.user?.id) &&
        !(comment.anonymous_session_id && sessionId === comment.anonymous_session_id)
      ) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      const { error } = await supabase
        .from('gallery_comments')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: auth?.user?.id || null,
        })
        .eq('id', commentId);

      if (error) throw error;

      return NextResponse.json(
        { success: true, message: 'Comment deleted' },
        { status: 200 }
      );
    } else if (action === 'flag') {
      // Flag for moderation
      const { error } = await supabase
        .from('gallery_comments')
        .update({
          is_flagged: true,
          flag_reason: reason,
        })
        .eq('id', commentId);

      if (error) throw error;

      return NextResponse.json(
        { success: true, message: 'Comment flagged for review' },
        { status: 200 }
      );
    } else if (action === 'love') {
      // Toggle love reaction
      const userId = auth?.user?.id || null;
      const anonSessionId = sessionId || null;

      if (!userId && !anonSessionId) {
        return NextResponse.json(
          { error: 'User identification required' },
          { status: 401 }
        );
      }

      // Check if already liked
      let query = supabase
        .from('gallery_comment_reactions')
        .select('id')
        .eq('comment_id', commentId)
        .eq('reaction_type', 'love');

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('anonymous_session_id', anonSessionId);
      }

      const { data: existingReaction } = await query.maybeSingle();

      if (existingReaction) {
        // Unlike
        const { error } = await supabase
          .from('gallery_comment_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('gallery_comment_reactions')
          .insert([
            {
              comment_id: commentId,
              user_id: userId,
              anonymous_session_id: anonSessionId,
              reaction_type: 'love',
            },
          ]);

        if (error) throw error;
      }

      return NextResponse.json(
        { success: true, message: 'Love reaction toggled' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 }
      );
    }

    const auth = await getAuth(request);

    // Only admins can hard delete
    if (!auth?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete comments' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('gallery_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Comment permanently deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

// Helper function to generate session ID for anonymous users
function generateSessionId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
