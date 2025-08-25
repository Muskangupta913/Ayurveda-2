import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";
import withAdminAuth from "../../components/withAdminAuth";

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);

  const fetchBlogs = async () => {
     const token= localStorage.getItem("adminToken");
    try {
      const res = await axios.get("/api/admin/get-blogs", {
        headers: { 
            Authorization: `Bearer ${token}` 
        },
      });
      setBlogs(res.data.blogs);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    const token= localStorage.getItem("adminToken");

    try {
      await axios.delete(`/api/admin/deleteBlog/${id}`, {
        headers: { 
            Authorization: `Bearer ${token}` 
        },
      });
      setBlogs(blogs.filter((b: any) => b._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">All Blogs (Admin)</h1>

      <div className="grid gap-4">
        {blogs.map((blog: any) => (
          <div key={blog._id} className="p-4 border rounded-lg shadow flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{blog.title}</h2>
              <p className="text-gray-600">{blog.content.substring(0, 150)}...</p>
              <p className="text-sm text-gray-500 mt-2">
                Posted by: {blog.postedBy?.name || "Unknown"} ({blog.role})
              </p>
              <p className="text-sm text-gray-400">
                {new Date(blog.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Likes: {blog.likes.length} | Comments: {blog.comments.length}
              </p>
            </div>

            <button
              onClick={() => deleteBlog(blog._id)}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default withAdminAuth(AdminBlogs);
