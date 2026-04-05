import React, { useEffect, useState } from 'react';
import { useCommunityStore } from '../../store/communityStore';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';
import axios from '../../utils/axiosConfig';

const CommunityHub = () => {
  const {
    posts,
    allPosts,
    newPost,
    editingPost,
    editContent,
    newComment,
    replyVisibility,
    showCommentsForPost,
    loading,
    error,
    currentUsername,
    filter,
    setPosts,
    setNewPost,
    setImages,
    setEditingPost,
    setEditContent,
    setEditImages,
    setNewComment,
    toggleReplyVisibility,
    toggleComments,
    setCurrentUsername,
    setFilter,
    fetchPosts,
    handleCreatePost,
    handleUpdatePost,
    handleDeletePost,
    handleVote,
    handleComment,
    handleReply,
  } = useCommunityStore();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [followStatus, setFollowStatus] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfileError, setUserProfileError] = useState(null);
  const [activeTooltipKey, setActiveTooltipKey] = useState(null);

  useEffect(() => {
    const username = localStorage.getItem('username');
    setCurrentUsername(username);
    fetchPosts();
  }, [setCurrentUsername, fetchPosts]);

  useEffect(() => {
    if (filter === 'myPosts') {
      setPosts(allPosts.filter((post) => post.user === currentUsername));
    } else {
      setPosts(allPosts);
    }
  }, [filter, allPosts, currentUsername, setPosts]);

  const fetchFollowStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/followstatus/${userId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setFollowStatus((prev) => ({ ...prev, [userId]: response.data.is_following }));
    } catch (err) {
      console.error('Failed to fetch follow status:', err);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/v1/follow/',
        { followed_id: userId },
        { headers: { Authorization: `Token ${token}` } }
      );
      setFollowStatus((prev) => ({ ...prev, [userId]: true }));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev) => ({ ...prev, followers_count: prev.followers_count + 1 }));
      }
    } catch (err) {
      console.error('Failed to follow:', err);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/v1/unfollow/',
        { followed_id: userId },
        { headers: { Authorization: `Token ${token}` } }
      );
      setFollowStatus((prev) => ({ ...prev, [userId]: false }));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev) => ({ ...prev, followers_count: prev.followers_count - 1 }));
      }
    } catch (err) {
      console.error('Failed to unfollow:', err);
    }
  };

  const fetchUserProfile = (userId, refKey) => {
    if (activeTooltipKey === refKey) {
      setSelectedUser(null);
      setActiveTooltipKey(null);
      setUserProfileError(null);
    } else {
      axios
        .get(`/api/v1/profile/${userId}/`, {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        })
        .then((response) => {
          setSelectedUser(response.data);
          setUserProfileError(null);
          setActiveTooltipKey(refKey);
        })
        .catch((err) => {
          setUserProfileError(err.response?.data?.error || 'Failed to load user profile');
          setSelectedUser(null);
          setActiveTooltipKey(refKey);
        });
    }
  };

  useEffect(() => {
    posts.forEach((post) => {
      if (post.user !== currentUsername && post.user_id) {
        fetchFollowStatus(post.user_id);
      }
    });
  }, [posts, currentUsername]);

  const isPostAuthor = (post) => post.user === currentUsername;

  const handleFileChange = (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    if (isEdit) {
      setEditImages(files);
    } else {
      setImages(files);
    }
    setSelectedFiles(files.map((file) => file.name));
  };

  const toggleReplyField = (postId, commentId) => {
    const key = `${postId}-${commentId}`;
    if (newComment[key] !== undefined) {
      setNewComment({ ...newComment, [key]: undefined });
    } else {
      setNewComment({ ...newComment, [key]: '' });
    }
  };

  const validateAndComment = (postId) => {
    const content = newComment[postId]?.trim();
    if (!content) return;
    handleComment(postId);
  };

  const validateAndReply = (postId, commentId) => {
    const key = `${postId}-${commentId}`;
    const content = newComment[key]?.trim();
    if (!content) return;
    handleReply(postId, commentId);
  };

  const renderTooltip = () => {
    if (!selectedUser && !userProfileError) return null;

    return (
      <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-md border border-[#E8EFEA] p-4 w-80 z-10 animate-fadeIn">
        <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-[#E8EFEA]" />
        {userProfileError ? (
          <p className="text-red-700 text-sm">{userProfileError}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#5C7361]">Full Name</p>
                <p className="text-sm text-[#2C3B2A] font-medium">
                  {(selectedUser.first_name || selectedUser.last_name
                    ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()
                    : 'N/A')}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5C7361]">Gender</p>
                <p className="text-sm text-[#2C3B2A]">{selectedUser.gender || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#5C7361]">Address</p>
                <p className="text-sm text-[#2C3B2A] break-words">{selectedUser.address || 'N/A'}</p>
              </div>
              {selectedUser.role === 'resident' && (
                <div className="space-y-1">
                  <p className="text-xs text-[#5C7361]">
                    <span className="font-medium text-[#2C3B2A]">
                      {selectedUser.followers_count}
                    </span>{' '}
                    Followers
                  </p>
                  <p className="text-xs text-[#5C7361]">
                    <span className="font-medium text-[#2C3B2A]">
                      {selectedUser.following_count}
                    </span>{' '}
                    Following
                  </p>
                </div>
              )}
              {selectedUser.role === 'resident' && selectedUser.username !== currentUsername && (
                <button
                  onClick={() =>
                    followStatus[selectedUser.id]
                      ? handleUnfollow(selectedUser.id)
                      : handleFollow(selectedUser.id)
                  }
                  className={`w-full py-1.5 px-3 rounded-lg text-sm font-medium ${
                    followStatus[selectedUser.id]
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-[#395917] text-white hover:bg-[#2C3B2A]'
                  } transition-colors`}
                >
                  {followStatus[selectedUser.id] ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderComments = (comments, postId, level = 0) => {
    return comments.map((comment) => (
      <div
        key={comment.id}
        className={`mt-4 ${level > 0 ? 'ml-6 border-l-2 border-[#E8EFEA] pl-4' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <button
              onClick={() => fetchUserProfile(comment.user_id, `comment-${comment.id}-avatar`)}
              className="relative"
            >
              <img
                src={
                  comment.profileImage
                    ? `http://localhost:8000/api/v1${comment.profileImage}`
                    : 'http://localhost:8000/api/v1/media/profileImages/default.png'
                }
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover bg-[#395917]"
                onError={(e) => {
                  e.target.src = 'http://localhost:8000/api/v1/media/profileImages/default.png';
                }}
              />
              {activeTooltipKey === `comment-${comment.id}-avatar` && renderTooltip()}
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 relative">
              <button
                onClick={() => fetchUserProfile(comment.user_id, `comment-${comment.id}-username`)}
                className="font-semibold text-sm text-[#2C3B2A] hover:underline"
              >
                {comment.user}
              </button>
              <p className="text-xs text-[#5C7361]">
                {new Date(comment.created_at || Date.now()).toLocaleDateString()}
              </p>
              {activeTooltipKey === `comment-${comment.id}-username` && renderTooltip()}
            </div>
            <p className="text-[#5C7361] text-sm mt-1">{comment.content}</p>
            <button
              onClick={() => toggleReplyField(postId, comment.id)}
              className="text-[#395917] text-sm hover:underline mt-1"
            >
              Reply
            </button>
            {newComment[`${postId}-${comment.id}`] !== undefined && (
              <div className="mt-3 flex gap-2">
                <input
                  value={newComment[`${postId}-${comment.id}`] || ''}
                  onChange={(e) =>
                    setNewComment({
                      ...newComment,
                      [`${postId}-${comment.id}`]: e.target.value,
                    })
                  }
                  placeholder="Write a reply..."
                  className="flex-1 text-sm py-2 px-4 border border-[#E8EFEA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-all"
                />
                <button
                  onClick={() => validateAndReply(postId, comment.id)}
                  className="p-2 bg-[#395917] text-white rounded-lg hover:bg-[#2C3B2A] transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => toggleReplyVisibility(comment.id)}
              className="flex items-center text-sm text-[#395917] hover:underline"
            >
              {replyVisibility[comment.id] ? (
                <>
                  <ChevronUp size={16} className="mr-1" />
                  Hide {comment.replies.length}{' '}
                  {comment.replies.length === 1 ? 'reply' : 'replies'}
                </>
              ) : (
                <>
                  <ChevronDown size={16} className="mr-1" />
                  Show {comment.replies.length}{' '}
                  {comment.replies.length === 1 ? 'reply' : 'replies'}
                </>
              )}
            </button>
            {replyVisibility[comment.id] && (
              <div className="mt-2">{renderComments(comment.replies, postId, level + 1)}</div>
            )}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-8 bg-[#F5F8F6]">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-[#2C3B2A]">Community Hub</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-40 text-base py-2 px-4 border border-[#E8EFEA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-all"
          >
            <option value="all">All Posts</option>
            <option value="myPosts">My Posts</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Create Post */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreatePost(e);
              setSelectedFiles([]);
            }}
            className="space-y-6"
          >
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              required
              className="w-full text-base py-4 px-4 border border-[#8baf9c] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-all"
              rows={2}
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 bg-[#E8EFEA] text-[#5C7361] py-2 px-4 rounded-lg cursor-pointer hover:bg-[#DDE5E0] transition-colors">
                <span>Choose Files</span>
                <input
                  id="create-post-image-input"
                  type="file"
                  multiple
                  onChange={(e) => handleFileChange(e)}
                  className="hidden"
                />
              </label>
              {selectedFiles.length > 0 && (
                <span className="text-sm text-[#5C7361] truncate max-w-xs">
                  {selectedFiles.join(', ')}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-6 bg-[#395917] text-white rounded-lg hover:bg-[#2C3B2A] transition-colors disabled:bg-[#395917]/50"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>

        {/* Posts Feed */}
        {loading && !posts.length ? (
          <div className="text-center p-8 text-[#5C7361] text-lg">Loading posts...</div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button
                        onClick={() => fetchUserProfile(post.user_id, `post-${post.id}-avatar`)}
                        className="relative"
                      >
                        <img
                          src={
                            post.profileImage
                              ? `http://localhost:8000/api/v1${post.profileImage}`
                              : 'http://localhost:8000/api/v1/media/profileImages/default.png'
                          }
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover bg-[#395917]"
                          onError={(e) => {
                            e.target.src = 'http://localhost:8000/api/v1/media/profileImages/default.png';
                          }}
                        />
                        {activeTooltipKey === `post-${post.id}-avatar` && renderTooltip()}
                      </button>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => fetchUserProfile(post.user_id, `post-${post.id}-username`)}
                        className="font-semibold text-[#2C3B2A] hover:underline"
                      >
                        {post.user}
                      </button>
                      <p className="text-sm text-[#5C7361]">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                      {activeTooltipKey === `post-${post.id}-username` && renderTooltip()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!isPostAuthor(post) && post.user_id && post.role === 'resident' && (
                      <button
                        onClick={() =>
                          followStatus[post.user_id]
                            ? handleUnfollow(post.user_id)
                            : handleFollow(post.user_id)
                        }
                        className={`py-1 px-3 rounded-lg text-sm ${
                          followStatus[post.user_id]
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            : 'bg-[#395917] text-white hover:bg-[#2C3B2A]'
                        } transition-colors`}
                      >
                        {followStatus[post.user_id] ? 'Following' : 'Follow'}
                      </button>
                    )}
                    {isPostAuthor(post) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (editingPost === post.id) {
                              setEditingPost(null);
                              setEditImages([]);
                              setSelectedFiles([]);
                            } else {
                              setEditingPost(post.id);
                              setEditContent(post.content);
                              setEditImages([]);
                              setSelectedFiles([]);
                            }
                          }}
                          className="p-2 text-[#5C7361] hover:bg-[#E8EFEA] rounded-lg"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                              handleDeletePost(post.id);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingPost === post.id ? (
                  <div className="animate-fadeIn">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdatePost(post.id);
                        setEditingPost(null);
                        setSelectedFiles([]);
                      }}
                      className="space-y-6"
                    >
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="What's on your mind?"
                        required
                        className="w-full text-base py-4 px-4 border border-[#8baf9c] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-all"
                        rows={2}
                      />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 bg-[#E8EFEA] text-[#5C7361] py-2 px-4 rounded-lg cursor-pointer hover:bg-[#DDE5E0] transition-colors">
                          <span>Choose Files</span>
                          <input
                            id={`edit-post-image-input-${post.id}`}
                            type="file"
                            multiple
                            onChange={(e) => handleFileChange(e, true)}
                            className="hidden"
                          />
                        </label>
                        {selectedFiles.length > 0 && (
                          <span className="text-sm text-[#5C7361] truncate max-w-xs">
                            {selectedFiles.join(', ')}
                          </span>
                        )}
                      </div>
                      {post.images.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-[#2C3B2A] mb-2">Current Images</p>
                          <div className="grid grid-cols-2 gap-4">
                            {post.images.map((image) => (
                              <img
                                key={image.id}
                                src={`http://localhost:8000/api/v1${image.image}`}
                                alt="Current"
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPost(null);
                            setEditImages([]);
                            setSelectedFiles([]);
                          }}
                          className="py-2 px-6 text-[#5C7361] border border-[#E8EFEA] rounded-lg hover:bg-[#E8EFEA] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="py-2 px-6 bg-[#395917] text-white rounded-lg hover:bg-[#2C3B2A] transition-colors disabled:bg-[#395917]/50"
                        >
                          {loading ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    <p className="text-[#2C3B2A] text-base mb-4">{post.content}</p>
                    {post.images.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        {post.images.map((image) => (
                          <img
                            key={image.id}
                            src={`http://localhost:8000/api/v1${image.image}`}
                            alt="Post"
                            className="w-full md:w-[75%] h-auto object-cover rounded-lg"
                            onError={(e) => console.log('Image failed to load:', e)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center gap-6 mb-4">
                  <button
                    onClick={() => handleVote(post.id, 'upvote')}
                    className={`flex items-center gap-2 text-sm ${
                      post.user_vote === 'upvote' ? 'text-[#509606]' : 'text-[#5C7361]'
                    } hover:text-[#509606] transition-colors`}
                  >
                    <ThumbsUp size={18} />
                    {post.upvotes}
                  </button>
                  <button
                    onClick={() => handleVote(post.id, 'downvote')}
                    className={`flex items-center gap-2 text-sm ${
                      post.user_vote === 'downvote' ? 'text-red-500' : 'text-[#5C7361]'
                    } hover:text-red-500 transition-colors`}
                  >
                    <ThumbsDown size={18} />
                    {post.downvotes}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-2 text-sm ${
                      showCommentsForPost[post.id] ? 'text-[#1E90FF]' : 'text-[#5C7361]'
                    } hover:text-[#1E90FF] transition-colors`}
                  >
                    <MessageSquare size={18} />
                    {post.comments.length}
                  </button>
                </div>

                {!showCommentsForPost[post.id] && post.comments.length > 0 && (
                  <div className="border-t border-[#E8EFEA] pt-3">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <button
                          onClick={() =>
                            fetchUserProfile(post.comments[0].user_id, `comment-${post.comments[0].id}-avatar`)
                          }
                          className="relative"
                        >
                          <img
                            src={
                              post.comments[0].profileImage
                                ? `http://localhost:8000/api/v1${post.comments[0].profileImage}`
                                : 'http://localhost:8000/api/v1/media/profileImages/default.png'
                            }
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover bg-[#395917]"
                            onError={(e) => {
                              e.target.src = 'http://localhost:8000/api/v1/media/profileImages/default.png';
                            }}
                          />
                          {activeTooltipKey === `comment-${post.comments[0].id}-avatar` && renderTooltip()}
                        </button>
                      </div>
                      <div className="flex-1 relative">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              fetchUserProfile(post.comments[0].user_id, `comment-${post.comments[0].id}-username`)
                            }
                            className="font-semibold text-sm text-[#2C3B2A] hover:underline"
                          >
                            {post.comments[0].user}
                          </button>
                          <p className="text-xs text-[#5C7361]">
                            {new Date(post.comments[0].created_at || Date.now()).toLocaleDateString()}
                          </p>
                          {activeTooltipKey === `comment-${post.comments[0].id}-username` && renderTooltip()}
                        </div>
                        <p className="text-[#5C7361] text-sm">{post.comments[0].content}</p>
                      </div>
                    </div>
                    {post.comments.length > 1 && (
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="text-[#395917] text-sm hover:underline mt-2"
                      >
                        View all {post.comments.length} comments
                      </button>
                    )}
                  </div>
                )}

                {showCommentsForPost[post.id] && (
                  <div className="mt-4">
                    <div className="flex gap-2 mb-4">
                      <input
                        value={newComment[post.id] || ''}
                        onChange={(e) =>
                          setNewComment({ ...newComment, [post.id]: e.target.value })
                        }
                        placeholder="Write a comment..."
                        className="flex-1 text-sm py-2 px-4 border border-[#E8EFEA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#395917] transition-all"
                      />
                      <button
                        onClick={() => validateAndComment(post.id)}
                        className="p-2 bg-[#395917] text-white rounded-lg hover:bg-[#2C3B2A] transition-colors"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                    {post.comments.length > 0 ? (
                      renderComments(post.comments, post.id)
                    ) : (
                      <p className="text-sm text-[#5C7361]">No comments yet</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!loading && posts.length === 0 && (
              <div className="text-center p-8 text-[#5C7361] text-lg">
                {filter === 'myPosts' ? "You haven't posted anything yet" : 'No posts found'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHub;