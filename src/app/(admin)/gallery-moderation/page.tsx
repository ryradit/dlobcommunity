'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, AlertCircle, Eye, Loader } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FlaggedComment {
  id: string;
  gallery_item_id: string;
  display_name: string;
  content: string;
  flag_reason: string;
  created_at: string;
  is_flagged: boolean;
}

export default function GalleryCommentsModerationPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<FlaggedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'flagged' | 'all'>('flagged');

  // Check authorization
  useEffect(() => {
    if (!authLoading && userRole !== 'admin') {
      // Redirect or show unauthorized
      window.location.href = '/';
    }
  }, [userRole, authLoading]);

  // Fetch flagged comments
  useEffect(() => {
    fetchComments();
  }, [filter]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('gallery_comments')
        .select('*');

      if (filter === 'flagged') {
        query = query.eq('is_flagged', true);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      alert('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Permanently delete this comment?')) return;

    try {
      setDeleting(commentId);
      const response = await fetch(
        `/api/gallery-comments?commentId=${commentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete');
      
      setComments(comments.filter(c => c.id !== commentId));
      alert('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setDeleting(null);
    }
  };

  const handleUnflagComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('gallery_comments')
        .update({ is_flagged: false })
        .eq('id', commentId);

      if (error) throw error;
      
      await fetchComments();
      alert('Comment flag removed');
    } catch (error) {
      console.error('Error unflagging comment:', error);
      alert('Failed to remove flag');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gallery Comment Moderation</h1>
          <p className="text-gray-600">Review and manage flagged comments from gallery</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('flagged')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'flagged'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Flagged ({comments.filter(c => c.is_flagged).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            All Comments ({comments.length})
          </button>
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'flagged' ? 'No flagged comments' : 'No comments'}
            </h3>
            <p className="text-gray-600">
              {filter === 'flagged'
                ? 'All comments are looking good!'
                : 'No comments to display'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                  comment.is_flagged
                    ? 'border-l-red-600 bg-red-50'
                    : 'border-l-gray-300'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{comment.display_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Gallery Item: {comment.gallery_item_id.substring(0, 20)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                  {comment.is_flagged && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                      Flagged
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                </div>

                {/* Flag Reason */}
                {comment.flag_reason && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs font-semibold text-yellow-900 mb-1">Reason for Flag:</p>
                    <p className="text-sm text-yellow-800">{comment.flag_reason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  {comment.is_flagged && (
                    <button
                      onClick={() => handleUnflagComment(comment.id)}
                      className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Remove Flag
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deleting === comment.id}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {deleting === comment.id ? (
                      <>
                        <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 inline mr-2" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
