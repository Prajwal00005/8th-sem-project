import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import api from "../../utils/axiosConfig"
import { FaSpinner,FaChevronRight } from "react-icons/fa"

export default function BlogSection() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const BACKEND_URL = "http://localhost:8000/api/v1"

  const fetchBlogs = async () => {
    try {
      const response = await api.get("/api/v1/blogs/")
      setBlogs(response.data)
      setLoading(false)
    } catch (err) {
      console.error("Fetch error:", err.response || err)
      setError("Failed to load blog posts")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FaSpinner className="animate-spin text-[#395917] text-4xl mb-4" />
        <p className="text-[#2C3B2A] font-medium">Loading blog posts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-[#E8EFEA]">
        <div className="text-red-900 mb-4">{error}</div>
        <button
          onClick={() => {
            setLoading(true)
            setError(null)
            fetchBlogs()
          }}
          className="px-4 py-2 bg-[#395917] text-white rounded-lg hover:bg-[#2C3B2A] transition-all"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {blogs.map((blog) => (
        <Link
          to={`/blog/${blog.id}`}
          key={blog.id}
          className="group bg-white rounded-2xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="aspect-[16/9] overflow-hidden">
            {blog.image ? (
              <img
                src={`${BACKEND_URL}${blog.image}`}
                alt={blog.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = `${BACKEND_URL}/media/images/default.png`
                }}
              />
            ) : (
              <div className="w-full h-full bg-[#F5F8F6] flex items-center justify-center">
                <span className="text-[#5C7361] text-sm font-medium">No Image</span>
              </div>
            )}
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-[#2C3B2A] mb-2 line-clamp-2">
              {blog.title}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-2">
              {blog.content}
            </p>
            <span className="inline-flex items-center text-[#395917] font-medium group-hover:text-[#2C3B2A]">
              Read More
              <FaChevronRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}