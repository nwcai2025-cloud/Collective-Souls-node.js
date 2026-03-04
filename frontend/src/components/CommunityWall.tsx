import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, Sparkles } from 'lucide-react';
import PostCard from './PostCard';
import PostComposer from './PostComposer';
import { getPosts, Post as PostType } from '../services/postService';

const CommunityWall: React.FC = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      const response = await getPosts(pageNum, 10);

      if (response.success) {
        const newPosts = response.data.posts;
        
        if (append) {
          setPosts(prev => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }
        
        setHasMore(pageNum < response.data.totalPages);
      }
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchPosts(1);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPosts(nextPage, true);
  };

  const handlePostCreated = (newPost: PostType) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost: PostType) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  return (
    <div>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-violet-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-200" />
            <h2 className="text-lg font-semibold text-white">Community Square</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-purple-100 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Post Composer */}
        <PostComposer onPostCreated={handlePostCreated} />

        {/* Posts List - Scrollable Container */}
        <div className="posts-scroll-container">
          {loading && posts.length === 0 ? (
            <div className="bg-purple-50 rounded-lg p-8 text-center border border-purple-100">
              <Loader2 className="w-7 h-7 text-purple-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Loading posts...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-lg p-8 text-center border border-red-100">
              <p className="text-red-600 mb-4 font-medium">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-purple-50 rounded-lg p-8 text-center border border-purple-100">
              <span className="text-4xl mb-3 block">📝</span>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
              <p className="text-gray-600">Be the first to share something with the community!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  onPostUpdated={handlePostUpdated}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </span>
                    ) : (
                      'Load More Posts'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityWall;