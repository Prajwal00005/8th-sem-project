import React, { useState, useEffect } from "react";
import api from "../../utils/axiosConfig";
import { Alert, AlertDescription } from "../UI/alert";
import { Button } from "../UI/button";
import { Input } from "../UI/input";

export default function BlogManagement() {
  const [blogs, setBlogs] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: null,
    is_published: false,
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await api.get("/api/v1/blogs/manage/");
      setBlogs(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load blogs");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("content", formData.content);
      if (formData.image) {
        data.append("image", formData.image);
      }
      data.append("is_published", formData.is_published);

      if (editingId) {
        await api.put(`/api/v1/blogs/${editingId}/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/api/v1/blogs/manage/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      fetchBlogs();
      setFormData({ title: "", content: "", image: null, is_published: false });
      setEditingId(null);
    } catch (err) {
      setError("Failed to save blog");
    }
  };

  const handleEdit = (blog) => {
    setFormData({
      title: blog.title,
      content: blog.content,
      image: null,
      is_published: blog.is_published,
    });
    setEditingId(blog.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await api.delete(`/api/v1/blogs/${id}/`);
        fetchBlogs();
      } catch (err) {
        setError("Failed to delete blog");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#395917]"></div>
          <span className="text-[#2C3B2A] text-base">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Blog Management
          </h1>
          <p className="text-slate-500 mt-1">
            Create and manage blog posts for your community
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Blog Form */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">
          {editingId ? "Edit Blog" : "Create Blog"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-32"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
              className="w-full bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required={!editingId}
            />
          </div>
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-5 h-5 border border-slate-300 rounded-md text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Publish</span>
            </label>
          </div>
          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25"
            >
              {editingId ? "Update Blog" : "Create Blog"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormData({
                    title: "",
                    content: "",
                    image: null,
                    is_published: false,
                  });
                  setEditingId(null);
                }}
                className="border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Blog List */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Blog Posts</h3>
        {blogs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <p className="text-slate-500 text-lg">No blogs available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white/50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800">{blog.title}</h4>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-3">
                      {blog.content.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        blog.is_published
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {blog.is_published ? "Published" : "Draft"}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(blog)}
                        variant="secondary"
                        className="px-3 py-1.5 text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(blog.id)}
                        variant="secondary"
                        className="px-3 py-1.5 text-xs border-red-200 hover:bg-red-50 text-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
