import React, { useEffect, useState } from "react";
import axios from "axios";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import SocialMediaShare from "../../components/SocialMediaShare";

type Blog = {
  _id: string;
  title: string;
  content: string;
  paramlink: string;
  createdAt: string;
  status?: "draft" | "published";
};

function PublishedBlogsPage() {
  const [drafts, setDrafts] = useState<Blog[]>([]);
  const [published, setPublished] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editParamlink, setEditParamlink] = useState<string>("");
  const [editError, setEditError] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("clinicToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      if (origin.includes("localhost")) {
        return "http://localhost:3000";
      } else {
        return "https://zeva360.com";
      }
    }
    return "";
  };

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        const [draftRes, pubRes] = await Promise.all([
          axios.get("/api/blog/draft", getAuthHeaders()),
          axios.get("/api/blog/published", getAuthHeaders()),
        ]);

        setDrafts(draftRes.data?.drafts || draftRes.data || []);
        setPublished(pubRes.data?.blogs || pubRes.data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load blogs");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const slugify = (text: string) =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");

  const handleEdit = (blog: Blog) => {
    setEditId(blog._id);
    setEditTitle(blog.title);
    setEditParamlink(blog.paramlink);
    setEditError("");
    setShowEditModal(true);
  };

  const handleSave = async (blog: Blog) => {
    if (!editTitle || !editParamlink) {
      setEditError("Title and paramlink are required");
      return;
    }
    setEditError("");
    try {
      await axios.put(
        `/api/blog/published?id=${blog._id}`,
        {
          title: editTitle,
          paramlink: editParamlink,
          content: blog.content,
        },
        getAuthHeaders()
      );
      setPublished((prev) =>
        prev.map((b) =>
          b._id === blog._id
            ? { ...b, title: editTitle, paramlink: editParamlink }
            : b
        )
      );
      setEditId(null);
      setEditTitle("");
      setEditParamlink("");
      setEditError("");
      setShowEditModal(false);
    } catch (err: any) {
      if (err.response?.data?.message?.includes("Paramlink already exists")) {
        setEditError("Paramlink already exists. Please choose another.");
      } else {
        setEditError("Failed to update blog");
      }
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setEditTitle("");
    setEditParamlink("");
    setEditError("");
    setShowEditModal(false);
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Published Blogs</h1>

      <section className="mb-8 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-semibold mb-3">Published</h2>
        {published.length === 0 ? (
          <p className="text-gray-600">No published blogs yet.</p>
        ) : (
          <div className="space-y-3">
            {published.map((b) => (
              <div key={b._id} className="p-3 bg-white border rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{b.title}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(b.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {getBaseUrl()}/blogs/{b.paramlink || "..."}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(b)}
                      className="px-3 py-1.5 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        (window.location.href = `/clinic/BlogForm?blogId=${b._id}`)
                      }
                      className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await axios.delete(
                            `/api/blog/published?id=${b._id}`,
                            getAuthHeaders()
                          );
                          setPublished((prev) =>
                            prev.filter((x) => x._id !== b._id)
                          );
                        } catch {}
                      }}
                      className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <SocialMediaShare
                      blogTitle={b.title}
                      blogUrl={`${getBaseUrl()}/blogs/${b.paramlink}`}
                      blogDescription={b.content
                        ?.replace(/<[^>]+>/g, "")
                        .slice(0, 200)}
                      triggerLabel="Share"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-semibold mb-3">Drafts</h2>
        {drafts.length === 0 ? (
          <p className="text-gray-600">No drafts yet.</p>
        ) : (
          <div className="space-y-3">
            {drafts.map((b) => (
              <div key={b._id} className="p-3 bg-white border rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{b.title}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(b.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        (window.location.href = `/clinic/BlogForm?draftId=${b._id}`)
                      }
                      className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await axios.delete(
                            `/api/blog/draft?id=${b._id}`,
                            getAuthHeaders()
                          );
                          setDrafts((prev) =>
                            prev.filter((x) => x._id !== b._id)
                          );
                        } catch {}
                      }}
                      className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Blog</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Title
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Blog Title"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog URL (paramlink)
              </label>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded block mb-2">
                {getBaseUrl()}/blogs/{editParamlink || "..."}
              </span>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={editParamlink}
                onChange={(e) => setEditParamlink(slugify(e.target.value))}
                placeholder="blog-url-slug"
              />
              {editError && (
                <div className="text-red-600 text-xs mt-1">{editError}</div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() =>
                  handleSave(published.find((b) => b._id === editId)!)
                }
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PageWithLayout = withClinicAuth(PublishedBlogsPage) as any;
PageWithLayout.getLayout = function getLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

export default PageWithLayout;
