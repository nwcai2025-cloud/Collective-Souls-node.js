import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MoreHorizontal, 
  Heart, 
  MessageCircle, 
  Edit, 
  Trash2, 
  Flag, 
  UserX, 
  VolumeX,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Post, Comment } from '../services/postService';
import { 
  addReaction, 
  removeReaction, 
  deletePost, 
  addComment, 
  getComments,
  blockUser,
  muteUser,
  reportPost,
  reportUser
} from '../services/postService';
import ReportButton from './ReportButton';

interface PostCardProps {
  post: Post;
  onPostDeleted: (postId: number) => void;
  onPostUpdated: (post: Post) => void;
}

const reactionEmojis: Record<string, { emoji: string; label: string; color: string }> = {
  heart: { emoji: '❤️', label: 'Love', color: 'bg-rose-100 text-rose-600' },
  pray: { emoji: '🙏', label: 'Gratitude', color: 'bg-amber-100 text-amber-600' },
  sparkle: { emoji: '✨', label: 'Inspiration', color: 'bg-violet-100 text-violet-600' },
  lightbulb: { emoji: '💡', label: 'Insight', color: 'bg-yellow-100 text-yellow-600' },
  peace: { emoji: '☮️', label: 'Peace', color: 'bg-cyan-100 text-cyan-600' }
};

const postTypeStyles: Record<string, { color: string; bgColor: string; borderColor: string; gradient: string }> = {
  reflection: { color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', gradient: 'from-violet-600 to-purple-700' },
  gratitude: { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', gradient: 'from-amber-600 to-orange-700' },
  question: { color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', gradient: 'from-cyan-600 to-blue-700' },
  inspiration: { color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', gradient: 'from-emerald-600 to-teal-700' },
  announcement: { color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', gradient: 'from-rose-600 to-pink-700' }
};


const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showMuteConfirm, setShowMuteConfirm] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isOwnPost = user?.id === post.user_id;
  const typeStyle = postTypeStyles[post.post_type] || postTypeStyles.reflection;

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) return 'just now';
    if (diffInSeconds < 60) return 'less than a minute ago';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleReaction = async (reactionType: string) => {
    try {
      if (post.user_reaction === reactionType) {
        await removeReaction(post.id);
        onPostUpdated({
          ...post,
          user_reaction: null,
          reaction_counts: {
            ...post.reaction_counts,
            [reactionType]: post.reaction_counts[reactionType as keyof typeof post.reaction_counts] - 1
          },
          like_count: post.like_count - 1
        });
      } else {
        const oldReaction = post.user_reaction;
        await addReaction(post.id, reactionType);
        
        const newReactionCounts = { ...post.reaction_counts };
        if (oldReaction) {
          newReactionCounts[oldReaction as keyof typeof newReactionCounts]--;
        }
        newReactionCounts[reactionType as keyof typeof newReactionCounts]++;

        onPostUpdated({
          ...post,
          user_reaction: reactionType,
          reaction_counts: newReactionCounts,
          like_count: oldReaction ? post.like_count : post.like_count + 1
        });
      }
      setShowReactions(false);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deletePost(post.id);
      onPostDeleted(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleLoadComments = async () => {
    if (!showComments && comments.length === 0) {
      try {
        const response = await getComments(post.id);
        setComments(response.data.comments);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      const response = await addComment(post.id, newComment.trim());
      setComments([...comments, response.data]);
      setNewComment('');
      onPostUpdated({
        ...post,
        comment_count: post.comment_count + 1
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    try {
      await blockUser(post.user_id);
      setShowBlockConfirm(false);
      setShowMenu(false);
      setActionMessage({ type: 'success', text: 'User blocked successfully' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error('Error blocking user:', error);
      setActionMessage({ type: 'error', text: 'Failed to block user' });
    }
  };

  const handleMuteUser = async () => {
    try {
      await muteUser(post.user_id);
      setShowMuteConfirm(false);
      setShowMenu(false);
      setActionMessage({ type: 'success', text: 'User muted successfully' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error('Error muting user:', error);
      setActionMessage({ type: 'error', text: 'Failed to mute user' });
    }
  };


  return (
    <div className={`bg-white rounded-lg shadow border ${typeStyle.borderColor} overflow-hidden`}>
      {/* Header with Type Indicator */}
      <div className={`p-3 flex items-start justify-between`}>
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author.username}`} className="relative group">
            {post.author.profile_image ? (
              <div className="p-0.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500">
                <img 
                  src={post.author.profile_image} 
                  alt={post.author.username}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white"
                />
              </div>
            ) : (
              <div className={`w-9 h-9 bg-gradient-to-br ${typeStyle.gradient} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                {post.author.username.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Link 
                to={`/profile/${post.author.username}`}
                className="font-semibold text-gray-800 hover:text-purple-600 transition-colors text-sm"
              >
                {post.author.first_name 
                  ? `${post.author.first_name} ${post.author.last_name || ''}`.trim()
                  : post.author.username
                }
              </Link>
              <span className="text-base">{post.post_type_emoji}</span>
              <span className={`text-xs font-medium uppercase tracking-wide ${typeStyle.color} ${typeStyle.bgColor} px-2 py-0.5 rounded-full`}>
                {post.post_type}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              @{post.author.username} • {formatRelativeTime(post.created_at)}
              {post.is_edited && <span className="ml-1 italic">(edited)</span>}
            </p>
          </div>
        </div>
        
        {/* Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[150px] overflow-hidden">
              {isOwnPost ? (
                <>
                  <button 
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm transition-colors"
                    onClick={() => {/* TODO: Edit post */}}
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                    <span>Edit Post</span>
                  </button>
                  <button 
                    className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center space-x-2 text-sm text-red-600 transition-colors"
                    onClick={handleDeletePost}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="px-3 py-1">
                    <ReportButton 
                      contentType="post"
                      contentId={post.id}
                      contentPreview={post.content}
                      onReport={() => setShowMenu(false)}
                    />
                  </div>
                  <button 
                    className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center space-x-2 text-sm text-red-600 transition-colors"
                    onClick={() => {
                      setShowBlockConfirm(true);
                      setShowMenu(false);
                    }}
                  >
                    <UserX className="w-4 h-4" />
                    <span>Block User</span>
                  </button>
                  <button 
                    className="w-full px-3 py-2 text-left hover:bg-yellow-50 flex items-center space-x-2 text-sm transition-colors"
                    onClick={() => {
                      setShowMuteConfirm(true);
                      setShowMenu(false);
                    }}
                  >
                    <VolumeX className="w-4 h-4 text-yellow-600" />
                    <span>Mute User</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-2">
        <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed text-sm">{post.content}</p>
      </div>

      {/* Reactions Summary */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {Object.entries(post.reaction_counts).map(([type, count]) => 
              count > 0 && (
                <span key={type} className="inline-flex items-center space-x-1 bg-white px-2 py-0.5 rounded-full shadow-sm text-xs">
                  <span>{reactionEmojis[type].emoji}</span>
                  <span className="text-gray-600 font-medium">{count}</span>
                </span>
              )
            )}
          </div>
          {post.comment_count > 0 && (
            <span className="text-xs text-gray-500 flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span>{post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between bg-white">
        <div className="relative">
          <button 
            onClick={() => setShowReactions(!showReactions)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-medium text-sm ${
              post.user_reaction 
                ? reactionEmojis[post.user_reaction].color
                : 'hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {post.user_reaction ? (
              <>
                <span>{reactionEmojis[post.user_reaction].emoji}</span>
                <span>{reactionEmojis[post.user_reaction].label}</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                <span>React</span>
              </>
            )}
          </button>
          
          {showReactions && (
            <div className="absolute left-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1.5 flex space-x-1 z-10">
              {Object.entries(reactionEmojis).map(([type, { emoji, label }]) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:scale-110 transition-all ${
                    post.user_reaction === type ? 'bg-purple-100 ring-1 ring-purple-400' : 'hover:bg-gray-100'
                  }`}
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={handleLoadComments}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-medium text-sm ${
            showComments 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100 text-gray-600 border border-gray-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          {/* Existing Comments */}
          {comments.length > 0 && (
            <div className="space-y-2 mb-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-2">
                  <Link to={`/profile/${comment.author.username}`}>
                    {comment.author.profile_image ? (
                      <img 
                        src={comment.author.profile_image}
                        alt={comment.author.username}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {comment.author.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 bg-white rounded-lg p-2 border border-gray-100">
                    <Link 
                      to={`/profile/${comment.author.username}`}
                      className="font-semibold text-xs text-gray-800 hover:text-purple-600"
                    >
                      {comment.author.username}
                    </Link>
                    <p className="text-xs text-gray-700 mt-0.5">{comment.content}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(comment.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs transition-all"
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Action Message */}
      {actionMessage && (
        <div className={`px-3 py-2 text-xs font-medium ${
          actionMessage.type === 'success' ? 'bg-green-50 text-green-700 border-t border-green-100' : 'bg-red-50 text-red-700 border-t border-red-100'
        }`}>
          {actionMessage.text}
        </div>
      )}


      {/* Block Confirm Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserX className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Block User?</h3>
              <p className="text-sm text-gray-600 mb-5">
                You won't see their posts anymore, and they won't be able to see yours.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockUser}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mute Confirm Modal */}
      {showMuteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <VolumeX className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Mute User?</h3>
              <p className="text-sm text-gray-600 mb-5">
                You won't see their posts anymore, but they can still see yours.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMuteConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMuteUser}
                  className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm"
                >
                  Mute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;