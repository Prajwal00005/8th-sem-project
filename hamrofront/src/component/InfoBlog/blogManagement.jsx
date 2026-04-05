import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { Alert, AlertDescription } from '../UI/alert';
import { Button } from '../UI/button';
import { Input } from '../UI/input';

export default function BlogManagement() {
  const [blogs, setBlogs] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null,
    is_published: false
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await api.get('/api/v1/blogs/manage/');
      setBlogs(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load blogs');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      if (formData.image) {
        data.append('image', formData.image);
      }
      data.append('is_published', formData.is_published);

      if (editingId) {
        await api.put(`/api/v1/blogs/${editingId}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/api/v1/blogs/manage/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchBlogs();
      setFormData({ title: '', content: '', image: null, is_published: false });
      setEditingId(null);
    } catch (err) {
      setError('Failed to save blog');
    }
  };

  const handleEdit = (blog) => {
    setFormData({
      title: blog.title,
      content: blog.content,
      image: null,
      is_published: blog.is_published
    });
    setEditingId(blog.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        await api.delete(`/api/v1/blogs/${id}/`);
        fetchBlogs();
      } catch (err) {
        setError('Failed to delete blog');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F5F8F6]">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#395917]"></div>
          <span className="text-[#2C3B2A] text-base">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#F5F8F6]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C3B2A]">Blog Management</h2>
            <p className="text-[#5C7361] mt-1">Create and manage blog posts for your community</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-6 rounded-xl bg-red-50 text-red-900">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Blog Form */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-8">
          <h3 className="text-xl font-semibold text-[#2C3B2A] mb-6">
            {editingId ? 'Edit Blog' : 'Create Blog'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-[#5C7361] mb-2">Title</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full text-base px-4 py-3 border border-[#E8EFEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#5C7361] mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full text-base px-4 py-3 border border-[#E8EFEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors h-32"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#5C7361] mb-2">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                className="w-full text-base px-4 py-3 border border-[#E8EFEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#395917] transition-colors"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                  className="w-5 h-5 border border-[#E8EFEA] rounded-md text-[#395917] focus:ring-[#395917] transition-colors"
                />
                <span className="text-sm text-[#5C7361]">Publish</span>
              </label>
            </div>
            <div className="flex gap-4">
              <Button
                type="submit"
                className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2.5 rounded-lg"
              >
                {editingId ? 'Update Blog' : 'Create Blog'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFormData({ title: '', content: '', image: '', is_published: false });
                    setEditingId(null);
                  }}
                  className="bg-transparent border border-[#2C3B2A] text-[#2C3B2A] hover:bg-[#21330e] hover:text-white px-6 py-2.5 rounded-lg"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Blog List */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-8">
          <h3 className="text-xl font-semibold text-[#2C3B2A] mb-6">Blog Posts</h3>
          {blogs.length === 0 ? (
            <p className="text-[#5C7361] py-8">No blogs available.</p>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="flex justify-between items-start p-6 border border-[#E8EFEA] rounded-lg hover:bg-[#F5F8F6] transition-colors"
                >
                  <div>
                    <h4 className="text-base font-medium text-[#2C3B2A]">{blog.title}</h4>
                    <p className="text-sm text-[#5C7361] mt-1">
                      {blog.content.substring(0, 100)}...
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                        blog.is_published ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {blog.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(blog)}
                      variant="secondary"
                      className="bg-transparent border border-[#2C3B2A] text-[#2C3B2A] hover:bg-[#21330e] hover:text-white px-4 py-1.5 rounded-lg text-sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(blog.id)}
                      variant="secondary"
                      className="bg-transparent border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-1.5 rounded-lg text-sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}