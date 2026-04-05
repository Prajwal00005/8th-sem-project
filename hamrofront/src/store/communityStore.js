import { create } from 'zustand';
import axios from '../utils/axiosConfig';

export const useCommunityStore = create((set, get) => ({
    posts: [],
    allPosts: [],
    newPost: '',
    images: [],
    editingPost: null,
    editContent: '',
    editImages: [],
    newComment: {},
    replyVisibility: {},
    showCommentsForPost: {},
    loading: false,
    error: '',
    currentUsername: '',
    filter: 'all',

    // Actions
    setPosts: (posts) => set({ posts }),
    setAllPosts: (allPosts) => set({ allPosts }),
    setNewPost: (content) => set({ newPost: content }),
    setImages: (images) => set({ images }),
    setEditingPost: (postId) => set({ editingPost: postId }),
    setEditContent: (content) => set({ editContent: content }),
    setEditImages: (images) => set({ editImages: images }),
    setNewComment: (comment) => set((state) => ({ newComment: { ...state.newComment, ...comment } })),
    toggleReplyVisibility: (commentId) => set((state) => ({
        replyVisibility: { ...state.replyVisibility, [commentId]: !state.replyVisibility[commentId] }
    })),
    toggleComments: (postId) => set((state) => ({
        showCommentsForPost: { ...state.showCommentsForPost, [postId]: !state.showCommentsForPost[postId] }
    })),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setCurrentUsername: (username) => set({ currentUsername: username }),
    setFilter: (filter) => set({ filter }),

    fetchPosts: async () => {
        set({ loading: true });
        try {
            const response = await axios.get('/api/v1/posts/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            set({ allPosts: response.data, error: '' });
        } catch (error) {
            set({ error: 'Failed to fetch posts' });
        } finally {
            set({ loading: false });
        }
    },

    handleCreatePost: async (e) => {
        e.preventDefault();
        set({ loading: true, error: '' });
        const { newPost, images } = get();

        const formData = new FormData();
        formData.append('content', newPost);
        images.forEach((image) => formData.append('images', image));

        try {
            await axios.post('/api/v1/posts/create/', formData, {
                headers: {
                    Authorization: `Token ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            set({ newPost: '', images: [] });
            document.getElementById('create-post-image-input').value = '';
            get().fetchPosts();
        } catch (error) {
            set({ error: 'Failed to create post' });
        } finally {
            set({ loading: false });
        }
    },

    handleUpdatePost: async (postId) => {
        const { editContent, editImages } = get();
        try {
            const formData = new FormData();
            formData.append('content', editContent);
            
            if (editImages.length > 0) {
                formData.append('replace_images', 'true');
                editImages.forEach((image) => {
                    if (image instanceof File) {
                        formData.append('images', image);
                    }
                });
            }

            await axios.put(`/api/v1/posts/${postId}/update/`, formData, {
                headers: { 
                    Authorization: `Token ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            set({ editingPost: null, editContent: '', editImages: [] });
            if (document.getElementById('edit-post-image-input')) {
                document.getElementById('edit-post-image-input').value = '';
            }
            get().fetchPosts();
        } catch (error) {
            console.error("Update error:", error);
            set({ error: 'Failed to update post' });
        }
    },

    handleDeletePost: async (postId) => {
        try {
            await axios.delete(`/api/v1/posts/${postId}/delete/`, {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            get().fetchPosts();
        } catch (error) {
            set({ error: 'Failed to delete post' });
        }
    },

    handleVote: async (postId, voteType) => {
        try {
            await axios.post(`/api/v1/posts/${postId}/vote/`, { vote_type: voteType }, {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            get().fetchPosts();
        } catch (error) {
            set({ error: 'Failed to vote' });
        }
    },

    handleComment: async (postId) => {
        const { newComment } = get();
        try {
            await axios.post(`/api/v1/posts/${postId}/comment/`, { content: newComment[postId] || '' }, {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            set((state) => ({ newComment: { ...state.newComment, [postId]: '' } }));
            get().fetchPosts();
        } catch (error) {
            set({ error: 'Failed to add comment' });
        }
    },

    handleReply: async (postId, parentId) => {
        const { newComment } = get();
        try {
            await axios.post(`/api/v1/posts/${postId}/comment/`, {
                content: newComment[`${postId}-${parentId}`] || '',
                parent: parentId,
            }, {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            set((state) => ({ newComment: { ...state.newComment, [`${postId}-${parentId}`]: '' } }));
            get().fetchPosts();
        } catch (error) {
            set({ error: 'Failed to add reply' });
        }
    },
}));