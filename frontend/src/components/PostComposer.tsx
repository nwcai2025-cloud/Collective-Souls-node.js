import React, { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../services/postService';
import { Post } from '../services/postService';

interface PostComposerProps {
  onPostCreated: (post: Post) => void;
}

const postTypes = [
  { value: 'reflection', label: 'Reflection', emoji: '💭', description: 'Share your thoughts', color: 'from-violet-600 to-purple-700', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', textColor: 'text-violet-700' },
  { value: 'gratitude', label: 'Gratitude', emoji: '🙏', description: 'Express thankfulness', color: 'from-amber-600 to-orange-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
  { value: 'question', label: 'Question', emoji: '❓', description: 'Ask the community', color: 'from-cyan-600 to-blue-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', textColor: 'text-cyan-700' },
  { value: 'inspiration', label: 'Inspiration', emoji: '💡', description: 'Share inspiration', color: 'from-emerald-600 to-teal-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-700' },
  { value: 'announcement', label: 'Announcement', emoji: '📢', description: 'Make an announcement', color: 'from-rose-600 to-pink-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', textColor: 'text-rose-700' }
];

const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('reflection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please write something to post.');
      return;
    }

    if (content.length > 5000) {
      setError('Post must be 5000 characters or less.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createPost({
        content: content.trim(),
        post_type: postType
      });

      if (response.success) {
        onPostCreated(response.data);
        setContent('');
        setPostType('reflection');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = postTypes.find(t => t.value === postType);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with Gradient */}
      <div className={`p-3 bg-gradient-to-r ${selectedType?.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-white" />
            <h3 className="font-semibold text-white drop-shadow-sm">Share Your Reflection</h3>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowTypeSelector(!showTypeSelector)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/90 hover:bg-white rounded-full transition-colors text-sm shadow-sm"
            >
              <span>{selectedType?.emoji}</span>
              <span className="text-gray-900 font-medium">{selectedType?.label}</span>
            </button>
            
            {showTypeSelector && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[200px] overflow-hidden">
                {postTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setPostType(type.value);
                      setShowTypeSelector(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 transition-colors ${
                      postType === type.value ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center text-white text-sm`}>
                      {type.emoji}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{type.label}</p>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="p-3">
        <div className="flex space-x-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {user?.profile_image ? (
              <div className="p-0.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500">
                <img 
                  src={user.profile_image}
                  alt={user.username}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white"
                />
              </div>
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Text Area */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind? Share a ${selectedType?.label.toLowerCase()}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all text-gray-700 placeholder-gray-400 text-sm"
              rows={3}
              maxLength={5000}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${content.length > 4500 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {content.length}/5000
                </span>
                {error && (
                  <span className="text-xs text-red-500">{error}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          className={`flex items-center space-x-2 px-5 py-2 bg-gradient-to-r ${selectedType?.color} text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all text-sm`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Share Post</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PostComposer;