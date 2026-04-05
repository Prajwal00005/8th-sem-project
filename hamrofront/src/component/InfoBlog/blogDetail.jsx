import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import api from "../../utils/axiosConfig"
import { FaSpinner, FaArrowLeft } from "react-icons/fa"

export default function BlogDetail() {
  const { id } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const BACKEND_URL = "http://localhost:8000/api/v1"

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await api.get(`/api/v1/blogs/${id}/`)
        setBlog(response.data)
        setLoading(false)
      } catch (err) {
        console.error("Fetch error:", err.response || err)
        setError("Failed to load blog post")
        setLoading(false)
      }
    }
    fetchBlog()
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F8F6]">
        <FaSpinner className="animate-spin text-[#395917] text-4xl mb-4" />
        <p className="text-[#2C3B2A] font-medium">Loading blog post...</p>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F8F6]">
        <div className="text-red-900 mb-4">{error || "Blog post not found"}</div>
        <Link
          to="/"
          className="bg-[#395917] text-white px-6 py-2.5 rounded-lg hover:bg-[#2C3B2A] transition-colors inline-flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 bg-[#F5F8F6]">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-[#395917] hover:text-[#2C3B2A] mb-6 text-sm font-medium"
        >
          <FaArrowLeft className="mr-2" /> Back to Blogs
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-8">
          {blog.image && (
            <img
              src={`${BACKEND_URL}${blog.image}`}
              alt={blog.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
              onError={(e) => {
                console.error(`Failed to load blog image ${id}: ${blog.image}`)
                e.target.src = `${BACKEND_URL}/media/images/default.png`
              }}
              onLoad={() => console.log(`Loaded blog image ${id}: ${blog.image}`)}
            />
          )}
          <h1 className="text-3xl font-bold text-[#2C3B2A] mb-4">{blog.title}</h1>
          <div className="flex items-center text-sm text-[#5C7361] mb-6">
            <span>By {blog.author || "Admin"}</span>
            <span className="mx-2">•</span>
            <span>{new Date(blog.created_at).toLocaleDateString()}</span>
          </div>
          <div className="prose prose-[#2C3B2A] text-[#2C3B2A] max-w-none">
            <p>{blog.content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}