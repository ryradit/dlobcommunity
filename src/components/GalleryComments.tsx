'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Flag, Trash2, Reply, SendHorizontal, Loader, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { censorText } from '@/lib/censorWords';

interface Comment {
  id: string;
  gallery_item_id: string;
  user_id: string | null;
  display_name: string;
  content: string;
  parent_comment_id: string | null;
  is_flagged: boolean;
  created_at: string;
  reply_count?: number;
  love_count?: number;
  user_liked?: boolean;
  avatar_url?: string | null;
}

interface GalleryCommentsProps {
  galleryItemId: string;
  title?: string;
}

export default function GalleryComments({ galleryItemId, title }: GalleryCommentsProps) {
  const { user, loading: authLoading, isAdmin, getSessionToken } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  
  // Modal state for reply
  const [replyModal, setReplyModal] = useState<{
    isOpen: boolean;
    commentId: string | null;  // The comment being replied to (may be 2nd layer)
    parentCommentId: string | null;  // The actual parent (1st layer) if replying to a reply
    displayName: string;  // Name of the user being replied to
    isMentioned: boolean;  // Whether we're mentioning a user
  }>({
    isOpen: false,
    commentId: null,
    parentCommentId: null,
    displayName: '',
    isMentioned: false,
  });
  const [replyContent, setReplyContent] = useState('');
  const [replyDisplayName, setReplyDisplayName] = useState('');

  // Init session for anonymous users - with retry logic
  useEffect(() => {
    // Only initialize if auth is done loading AND user is still not available
    if (!authLoading && !user) {
      // Add a small delay to ensure auth state is fully resolved
      const timer = setTimeout(() => {
        const stored = localStorage.getItem('gallery_session_id');
        if (!stored) {
          const newId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('gallery_session_id', newId);
          setSessionId(newId);
        } else {
          setSessionId(stored);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else if (user) {
      // Clear any stored session if user is now authenticated
      localStorage.removeItem('gallery_session_id');
      setSessionId(null);
    }
  }, [user, authLoading]);

  // Fetch user avatar if authenticated
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/get-user-avatar?userId=${user.id}`);
        const data = await response.json();

        if (data?.avatarUrl) {
          setUserAvatarUrl(data.avatarUrl);
          console.log('Avatar loaded:', data.avatarUrl);
        }
      } catch (err) {
        console.error('Failed to fetch user avatar:', err);
      }
    };

    fetchUserAvatar();
  }, [user?.id]);

  // Fetch comments
  const fetchComments = async (isTopLevel = true, parentCommentId?: string | null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        galleryItemId,
        limit: '100',
        offset: '0',
      });
      
      if (!isTopLevel && parentCommentId) {
        params.append('parentCommentId', parentCommentId);
        const response = await fetch(`/api/gallery-comments?${params}`, { method: 'GET' });
        if (!response.ok) throw new Error('Failed to fetch replies');
        const data = await response.json();
        const newReplies = data.comments || [];
        
        console.log('📥 Fetched REPLIES:', newReplies.slice(0, 2).map((c: Comment) => ({
          id: c.id,
          display_name: c.display_name,
          avatar_url: c.avatar_url || '❌ NULL',
          user_id: c.user_id || 'anon'
        })));
        
        setComments((prev) => {
          // Get existing reply IDs for this parent
          const existingReplyIds = new Set(
            prev
              .filter((c) => c.parent_comment_id === parentCommentId)
              .map((c) => c.id)
          );
          
          // Filter out duplicates - only add replies that don't already exist
          const nonDuplicateReplies = newReplies.filter(
            (reply: Comment) => !existingReplyIds.has(reply.id)
          );
          
          // Remove old replies for this parent and add new ones
          return [
            ...prev.filter((c) => c.parent_comment_id !== parentCommentId),
            ...nonDuplicateReplies,
          ];
        });
      } else {
        // Always fetch top-level comments
        const response = await fetch(`/api/gallery-comments?${params}`, { method: 'GET' });
        if (!response.ok) throw new Error('Failed to fetch comments');
        const data = await response.json();
        
        // Debug: Log ALL comments with avatars
        console.log('📥 Fetched TOP-LEVEL COMMENTS:', data.comments?.length || 0, 'comments');
        data.comments?.slice(0, 5).forEach((c: Comment, idx: number) => {
          console.log(`  [${idx}] ${c.display_name}: avatar_url = ${c.avatar_url || '❌ NULL'}, user_id = ${c.user_id || '❌ NULL'}`);
        });
        
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load comments on mount
  useEffect(() => {
    fetchComments(true);
  }, [galleryItemId]);

  // Submit comment (main comment only)
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);

      // Use user's name if authenticated, otherwise use display name
      const name = user?.user_metadata?.full_name || displayName || 'Anonymous';

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getSessionToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/gallery-comments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          galleryItemId,
          content: newComment,
          parentCommentId: null, // Always null for main form
          displayName: name,
          userName: user?.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post comment');
      }

      const data = await response.json();

      // Save session ID if new anonymous user
      if (data.sessionId) {
        localStorage.setItem('gallery_session_id', data.sessionId);
        setSessionId(data.sessionId);
      }

      // Debug: Log the newly created comment timestamp
      if (data.comment) {
        console.log('New comment posted:', {
          id: data.comment.id,
          created_at: data.comment.created_at,
          avatar_url: data.comment.avatar_url,
          parsed_date: new Date(data.comment.created_at).toISOString(),
          current_utc: new Date().toISOString(),
          timezone_offset_hours: new Date().getTimezoneOffset() / -60,
        });
      }

      // Refresh all top-level comments
      await fetchComments(true);

      setNewComment('');
      setDisplayName('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply (via modal)
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyModal.parentCommentId) return;

    try {
      setSubmitting(true);

      // Use user's name if authenticated, otherwise use display name
      const name = user?.user_metadata?.full_name || replyDisplayName || 'Anonymous';
      
      // If we're replying to a 2nd layer comment, prepend mention
      let finalContent = replyContent.trim();
      if (replyModal.isMentioned) {
        finalContent = `@${replyModal.displayName} ${finalContent}`;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getSessionToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/gallery-comments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          galleryItemId,
          content: finalContent,
          parentCommentId: replyModal.parentCommentId,  // Always the 1st layer parent
          displayName: name,
          userName: user?.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post reply');
      }

      const data = await response.json();

      // Debug: Log the newly created reply with avatar
      if (data.comment) {
        console.log('New reply posted:', {
          id: data.comment.id,
          created_at: data.comment.created_at,
          avatar_url: data.comment.avatar_url,
          parent_id: data.comment.parent_comment_id,
        });
      }

      // Save session ID if new anonymous user
      if (data.sessionId) {
        localStorage.setItem('gallery_session_id', data.sessionId);
        setSessionId(data.sessionId);
      }

      // Expand and load replies
      setExpandedReplies((prev) => new Set(prev).add(replyModal.parentCommentId!));
      await fetchComments(false, replyModal.parentCommentId);

      // Close modal and reset
      setReplyModal({ isOpen: false, commentId: null, parentCommentId: null, displayName: '', isMentioned: false });
      setReplyContent('');
      setReplyDisplayName('');
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getSessionToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/gallery-comments', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          commentId,
          action: 'delete',
          sessionId, // For anonymous users
        }),
      });

      if (!response.ok) throw new Error('Failed to delete comment');
      await fetchComments(true);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  // Love comment
  const handleLoveComment = async (commentId: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getSessionToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/gallery-comments', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          commentId,
          action: 'love',
          sessionId, // For anonymous users
        }),
      });

      if (!response.ok) throw new Error('Failed to like comment');
      // Refresh top-level comments
      await fetchComments(true);
    } catch (error) {
      console.error('Error loving comment:', error);
    }
  };

  // Flag comment
  const handleFlagComment = async (commentId: string) => {
    const reason = prompt('Why are you flagging this comment?');
    if (!reason) return;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getSessionToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/gallery-comments', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          commentId,
          action: 'flag',
          reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to flag comment');
      alert('Comment flagged. Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Error flagging comment:', error);
      alert('Failed to flag comment');
    }
  };

  // Load replies for a comment
  const handleLoadReplies = async (parentCommentId: string) => {
    const isExpanded = expandedReplies.has(parentCommentId);
    if (isExpanded) {
      expandedReplies.delete(parentCommentId);
      setExpandedReplies(new Set(expandedReplies));
    } else {
      expandedReplies.add(parentCommentId);
      setExpandedReplies(new Set(expandedReplies));
      // Fetch replies for this comment
      await fetchComments(false, parentCommentId);
    }
  };

  // Open reply modal
  const openReplyModal = (comment: Comment) => {
    // Check if the comment being replied to is already a reply (has parent)
    const isReplyToReply = comment.parent_comment_id !== null;
    
    let actualParentId: string = comment.id;  // Default: reply to this comment
    let isMentioning = false;
    
    if (isReplyToReply) {
      // If replying to a 2nd layer comment, reply to its parent instead
      actualParentId = comment.parent_comment_id!;  // Non-null assertion (already checked above)
      isMentioning = true;  // And mention the user
    }
    
    setReplyModal({
      isOpen: true,
      commentId: comment.id,  // The comment clicked on
      parentCommentId: actualParentId,  // The actual parent to reply to
      displayName: comment.display_name,
      isMentioned: isMentioning,
    });
    // Pre-fill name if authenticated
    if (user?.user_metadata?.full_name) {
      setReplyDisplayName(user.user_metadata.full_name);
    }
  };

  const replies = (parentId: string) =>
    comments.filter((c) => c.parent_comment_id === parentId);

  const formatDate = (dateString: string) => {
    try {
      // Parse the date string as UTC
      let d: Date;
      
      // If the string has 'Z' or timezone offset, parse as-is (it will be interpreted as UTC)
      // Otherwise, assume it's already UTC
      if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-00')) {
        d = new Date(dateString);
      } else {
        // If no timezone indicator, treat as ISO UTC string
        d = new Date(dateString + 'Z');
      }
      
      // If date is invalid, try alternative parsing
      if (isNaN(d.getTime())) {
        d = new Date(dateString.replace(' ', 'T'));
      }
      
      // If still invalid, return the original string
      if (isNaN(d.getTime())) {
        console.log('❌ Invalid date string:', dateString);
        return dateString;
      }
      
      // Get current time in UTC
      const now = new Date();
      
      // Get timestamps in milliseconds
      const serverTimeMs = d.getTime();
      const clientTimeMs = now.getTime();
      
      // Calculate the difference in milliseconds
      const diffMs = clientTimeMs - serverTimeMs;
      
      // DETAILED DEBUG LOG
      console.log('📅 Time calculation:', {
        input: dateString,
        utc_iso: d.toISOString(),
        now_utc_iso: now.toISOString(),
        diffMs,
        diffSeconds: Math.floor(diffMs / 1000),
        diffMinutes: (diffMs / 60000).toFixed(1),
        diffHours: (diffMs / 3600000).toFixed(2),
      });
      
      // Handle edge cases
      if (diffMs < -5000) { // Allow 5 second tolerance for clock skew (future dates)
        console.log('⏰ Future date detected (clock skew), showing "just now"');
        return 'just now';
      }
      
      if (diffMs < 5000) {
        console.log('✅ Recent (< 5s), showing "just now"');
        return 'just now';
      }

      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(seconds / 3600);
      const days = Math.floor(seconds / 86400);

      // Display logic: show "just now" only for < 60 seconds, then switch to minutes
      if (seconds < 60) {
        console.log(`✅ ${seconds}s ago → 'just now'`);
        return 'just now';
      }
      if (minutes < 60) {
        console.log(`⏱️ ${minutes}m ago`);
        return `${minutes}m ago`;
      }
      if (hours < 24) {
        console.log(`🕐 ${hours}h ago`);
        return `${hours}h ago`;
      }
      if (days < 7) {
        console.log(`📆 ${days}d ago`);
        return `${days}d ago`;
      }
      
      // For older dates, show formatted date with time
      const formatted = d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...(d.getFullYear() !== now.getFullYear() && { year: 'numeric' })
      });
      console.log(`📅 Older date: ${formatted}`);
      return formatted;
    } catch (error) {
      console.error('❌ Error formatting date:', error, dateString);
      return dateString;
    }
  };

  const AvatarDisplay = ({ avatarUrl, displayName, userId }: { avatarUrl?: string | null; displayName: string; userId?: string | null }) => {
    const [finalAvatarUrl, setFinalAvatarUrl] = useState<string | null>(avatarUrl || null);
    const [showFallback, setShowFallback] = useState(!avatarUrl);
    const [tried, setTried] = useState(false);

    console.log(`🖼️ [AvatarDisplay] RENDER: displayName="${displayName}", avatarUrl="${avatarUrl || 'null'}", userId="${userId || 'null'}", finalAvatarUrl="${finalAvatarUrl || 'null'}"`);

    React.useEffect(() => {
      const fetchAvatar = async () => {
        // If we don't have an avatar URL AND we have a userId, try to fetch it
        if (!finalAvatarUrl && userId && !tried) {
          console.log(`🔍 [AvatarDisplay] Fetching avatar for "${displayName}" (userId: ${userId})`);
          setTried(true);
          
          try {
            const response = await fetch(`/api/get-user-avatar?userId=${userId}`);
            const data = await response.json();
            
            if (data.avatarUrl) {
              console.log(`✅ [AvatarDisplay] Avatar fetched for "${displayName}": ${data.avatarUrl}`);
              setFinalAvatarUrl(data.avatarUrl);
              setShowFallback(false);
            } else {
              console.log(`⚠️  [AvatarDisplay] No avatar URL returned for "${displayName}"`);
              setShowFallback(true);
            }
          } catch (err) {
            console.error(`❌ [AvatarDisplay] Error fetching avatar for "${displayName}":`, err);
            setShowFallback(true);
          }
        }
      };

      fetchAvatar();
    }, [finalAvatarUrl, displayName, userId, tried]);

    return (
      <div className="w-10 h-10 rounded-full shrink-0 flex-none relative">
        {finalAvatarUrl && !showFallback && (
          <img
            src={finalAvatarUrl}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
            onError={() => {
              console.log(`❌ [AvatarDisplay] Image failed to load for "${displayName}": ${finalAvatarUrl}`);
              setShowFallback(true);
            }}
            onLoad={() => {
              console.log(`✅ [AvatarDisplay] Image loaded for "${displayName}"`);
            }}
          />
        )}
        {showFallback && (
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#3e6461] to-[#2d4a47] text-white flex items-center justify-center font-bold text-sm">
            {displayName[0]?.toUpperCase() || 'A'}
          </div>
        )}
      </div>
    );
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div key={comment.id} className={isReply ? "py-3 border-b border-gray-100 last:border-b-0" : "py-4 border-b border-gray-100 last:border-b-0"}>
      <div className="flex gap-3">
        {/* Avatar */}
        <AvatarDisplay avatarUrl={comment.avatar_url} displayName={comment.display_name} userId={comment.user_id} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with name and time */}
          <div className="flex items-baseline gap-2">
            <p className="font-semibold text-sm text-gray-900">{comment.display_name}</p>
            <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
            {comment.is_flagged && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                ⚠️ Flagged
              </span>
            )}
          </div>

          {/* Comment text */}
          <p className="text-sm text-gray-800 mt-1 leading-relaxed">{censorText(comment.content)}</p>

          {/* Actions - Reply, Love count, Dislike */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => openReplyModal(comment)}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Reply
            </button>

            <button
              onClick={() => handleLoveComment(comment.id)}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                comment.user_liked 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>❤️</span>
              <span>{comment.love_count || 0}</span>
            </button>

            <button
              onClick={() => handleFlagComment(comment.id)}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
              title="Tidak suka"
            >
              👎
            </button>

            {/* Menu for owner/admin - only auth users */}
            {user && (user.id === comment.user_id || isAdmin) && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs text-gray-600 hover:text-red-600 font-medium transition-colors ml-auto"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>

          {/* View replies - only show if there are replies */}
          {!isReply && comment.reply_count && comment.reply_count > 0 && (
            <div className="mt-2 pt-2">
              {expandedReplies.has(comment.id) ? (
                <div className="space-y-0">
                  {replies(comment.id).map((reply) => (
                    <CommentItem key={reply.id} comment={reply} isReply={true} />
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => handleLoadReplies(comment.id)}
                  className="text-xs text-gray-600 hover:text-gray-900 font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  View {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">
          {comments.filter((c) => !c.parent_comment_id).length.toLocaleString()} comments
        </h3>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 animate-spin mx-auto text-[#3e6461] mb-3" />
          <p className="text-gray-500 text-sm">Loading comments...</p>
        </div>
      ) : comments.filter((c) => !c.parent_comment_id).length === 0 ? (
        <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-gray-200">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">No comments yet</p>
          <p className="text-gray-500 text-xs mt-1">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {comments.filter((c) => !c.parent_comment_id).map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}

      {/* Comment Form - Bottom */}
      <form onSubmit={handleSubmitComment} className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-3 items-start">
          {/* Avatar */}
          {user && userAvatarUrl ? (
            // Show user's actual avatar if they have one
            <img
              src={userAvatarUrl}
              alt={user.user_metadata?.full_name || 'User'}
              className="w-10 h-10 rounded-full object-cover shrink-0 flex-none"
              onError={(e) => {
                // Fallback to colored avatar if image fails to load
                console.error('Failed to load user avatar:', userAvatarUrl);
                setUserAvatarUrl(null);
              }}
            />
          ) : (
            // Show colored avatar with initials
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#3e6461] to-[#2d4a47] text-white flex items-center justify-center font-bold text-sm shrink-0 flex-none">
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
          )}

          {/* Input and Actions */}
          <div className="flex-1 space-y-3">
            {/* Name input - only show if not authenticated */}
            {!user && (
              <input
                type="text"
                placeholder="Your name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3e6461]"
                maxLength={50}
              />
            )}

            {/* Text input */}
            <input
              type="text"
              placeholder="Add comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3e6461] placeholder-gray-400"
              maxLength={1000}
              required
            />

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-[#3e6461] text-white text-sm font-medium rounded-lg hover:bg-[#2d4a47] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Reply Modal */}
      {replyModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Reply to {replyModal.displayName}</h3>
              <button
                onClick={() => {
                  setReplyModal({ isOpen: false, commentId: null, parentCommentId: null, displayName: '', isMentioned: false });
                  setReplyContent('');
                  setReplyDisplayName('');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original Comment */}
            {replyModal.commentId && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Replying to:</p>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#3e6461] to-[#2d4a47] text-white flex items-center justify-center font-bold text-xs shrink-0 flex-none">
                    {replyModal.displayName[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{replyModal.displayName}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {censorText(comments.find((c) => c.id === replyModal.commentId)?.content || '')}
                  </p>
                </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reply Form */}
            <form onSubmit={handleSubmitReply} className="p-4 space-y-4">
              {/* Mention toggle - show when replying to a 2nd layer comment */}
              {replyModal.isMentioned !== undefined && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={replyModal.isMentioned}
                      onChange={(e) => setReplyModal({ ...replyModal, isMentioned: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[#3e6461] cursor-pointer"
                    />
                    <span className="text-xs text-blue-700 font-medium">
                      💬 Mention <span className="font-bold">@{replyModal.displayName}</span>
                    </span>
                  </label>
                </div>
              )}

              {/* Name input - only show if not authenticated */}
              {!user && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Your name (optional)</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={replyDisplayName}
                    onChange={(e) => setReplyDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3e6461]"
                    maxLength={50}
                  />
                </div>
              )}

              {/* Reply textarea */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Your reply</label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3e6461] resize-none"
                  rows={4}
                  maxLength={1000}
                  required
                />
                <div className="mt-2 flex justify-end">
                  <span className="text-xs text-gray-500 font-medium">{replyContent.length}/1000</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyModal({ isOpen: false, commentId: null, parentCommentId: null, displayName: '', isMentioned: false });
                    setReplyContent('');
                    setReplyDisplayName('');
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="flex-1 px-4 py-2 bg-[#3e6461] text-white rounded-lg hover:bg-[#2d4a47] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="w-4 h-4" />
                      Reply
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
