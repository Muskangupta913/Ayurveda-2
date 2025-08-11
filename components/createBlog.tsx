import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded flex items-center justify-center">
    <p className="text-gray-500">Loading editor...</p>
  </div>
});

interface Blog {
  _id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface ConfirmAction {
  type: string;
  id: string;
  title: string;
}

interface BlogEditorProps {
  tokenKey: 'clinicToken' | 'doctorToken';
}

const BlogEditor: React.FC<BlogEditorProps> = ({ tokenKey }) => {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [drafts, setDrafts] = useState<Blog[]>([]);
  const [publishedBlogs, setPublishedBlogs] = useState<Blog[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [selectedPublished, setSelectedPublished] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'drafts' | 'published'>('drafts');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [showImageContextMenu, setShowImageContextMenu] = useState<boolean>(false);
  const [contextMenuImage, setContextMenuImage] = useState<HTMLImageElement | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const getAuthHeaders = () => {
    const token = localStorage.getItem(tokenKey);
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  };

  // Debug effect for context menu
  useEffect(() => {
    console.log('Context menu state changed:', showImageContextMenu);
  }, [showImageContextMenu]);

  // Global click handler to close context menu
  useEffect(() => {
    const handleGlobalClick = (e: globalThis.MouseEvent) => {
      if (showImageContextMenu) {
        setShowImageContextMenu(false);
        setContextMenuImage(null);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [showImageContextMenu]);

  // Load drafts and published blogs on component mount
  useEffect(() => {
    loadDrafts();
    loadPublishedBlogs();
  }, []);

  // Load ReactQuill CSS after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
      document.head.appendChild(link);
    }
  }, []);

  // Auto-save draft every 30 seconds if there's content and not editing published blog
  useEffect(() => {
    if (!title && !content) return;
    if (selectedPublished) return;

    const autoSaveTimer = setTimeout(() => {
      if (title || content) {
        saveDraft();
      }
    }, 30000);

    return () => clearTimeout(autoSaveTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, selectedPublished]);

  // Add image click handlers after content changes
  useEffect(() => {
    const attachImageListeners = () => {
      const editorContainer = document.querySelector('.ql-editor');
      if (editorContainer) {
        const images = editorContainer.querySelectorAll('img');
        console.log('Found images:', images.length);
        
        images.forEach((img) => {
          img.removeEventListener('dblclick', handleImageDoubleClick as EventListener);
          img.removeEventListener('contextmenu', handleImageRightClick as EventListener);
          
          img.addEventListener('dblclick', handleImageDoubleClick as EventListener);
          img.addEventListener('contextmenu', handleImageRightClick as EventListener);
          
          (img as HTMLImageElement).style.cursor = 'pointer';
          (img as HTMLImageElement).title = 'Double-click to add/edit link, Right-click for more options';
        });
      }
    };

    const timer = setTimeout(attachImageListeners, 1000);
    
    const editorContainer = document.querySelector('.ql-editor');
    if (editorContainer) {
      editorContainer.addEventListener('focus', attachImageListeners);
      editorContainer.addEventListener('input', attachImageListeners);
    }
    
    return () => {
      clearTimeout(timer);
      if (editorContainer) {
        editorContainer.removeEventListener('focus', attachImageListeners);
        editorContainer.removeEventListener('input', attachImageListeners);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const ensureLinksUnderlined = (htmlContent: string) => {
    if (typeof window === 'undefined') return htmlContent;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      if (!link.style.textDecoration || link.style.textDecoration === 'none') {
        link.style.textDecoration = 'underline';
        link.style.textDecorationColor = '#2563eb';
        link.style.textDecorationThickness = '2px';
      }
    });
    
    return tempDiv.innerHTML;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const openConfirmModal = (type: string, id: string, title: string) => {
    setConfirmAction({ type, id, title });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'deleteDraft') {
      deleteDraft(confirmAction.id);
    } else if (confirmAction.type === 'deletePublished') {
      deletePublishedBlog(confirmAction.id);
    }
    
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleImageDoubleClick = (e: Event) => {
    e.preventDefault();
    const img = e.target as HTMLImageElement;
    const currentLink = img.parentElement?.tagName === 'A' ? (img.parentElement as HTMLAnchorElement).href : '';
    
    setSelectedImage(img);
    setLinkUrl(currentLink);
    setShowLinkModal(true);
  };

  const handleImageRightClick = (e: Event) => {
    e.preventDefault();
    console.log('Right-click detected on image');
    const img = e.target as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    
    const menuWidth = 150;
    const menuHeight = 80;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let x = rect.left;
    let y = rect.bottom + window.scrollY;
    
    if (x + menuWidth > windowWidth) {
      x = rect.right - menuWidth;
    }
    
    if (y + menuHeight > windowHeight + window.scrollY) {
      y = rect.top + window.scrollY - menuHeight;
    }
    
    console.log('Image rect:', rect);
    console.log('Context menu position:', { x, y });
    
    setContextMenuImage(img);
    setContextMenuPosition({ x, y });
    setShowImageContextMenu(true);
  };

  const removeImage = () => {
    console.log('removeImage called');
    if (contextMenuImage) {
      console.log('Removing image:', contextMenuImage);
      
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        const images = tempDiv.querySelectorAll('img');
        let imageRemoved = false;
        
        images.forEach((img) => {
          if (img.src === contextMenuImage.src && !imageRemoved) {
            img.remove();
            imageRemoved = true;
          }
        });
        
        if (imageRemoved) {
          setContent(tempDiv.innerHTML);
          showToast('Image removed successfully!', 'success');
        } else {
          showToast('Image not found in content', 'error');
        }
      } catch (error) {
        console.error('Error removing image:', error);
        showToast('Failed to remove image', 'error');
      }
    } else {
      console.log('No contextMenuImage found');
      showToast('No image selected for removal', 'error');
    }
    
    setShowImageContextMenu(false);
    setContextMenuImage(null);
  };

  const checkImageSizes = (htmlContent: string): boolean => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const images = tempDiv.querySelectorAll('img');
    let hasLargeImage = false;
    
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('data:image')) {
        const base64Data = src.split(',')[1];
        if (base64Data) {
          const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
          const sizeInMB = sizeInBytes / (1024 * 1024);
          
          if (sizeInMB > 1) {
            hasLargeImage = true;
            showToast(`Image size (${sizeInMB.toFixed(2)}MB) exceeds the 1MB limit. Please resize the image before publishing.`, 'error');
          }
        }
      }
    });
    
    return hasLargeImage;
  };

  const handleLinkSubmit = () => {
    if (!selectedImage) return;

    const trimmedUrl = linkUrl.trim();
    
    if (trimmedUrl) {
      if (!trimmedUrl.match(/^https?:\/\//)) {
        showToast('Please enter a valid URL with https:// or http:// protocol', 'error');
        return;
      }
      
      try {
        new URL(trimmedUrl);
      } catch (e) {
        showToast('Please enter a valid URL format (e.g., https://example.com)', 'error');
        return;
      }
      
      const linkElement = document.createElement('a');
      linkElement.href = trimmedUrl;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener noreferrer';
      
      selectedImage.parentNode?.replaceChild(linkElement, selectedImage);
      linkElement.appendChild(selectedImage);
    } else {
      if (selectedImage.parentElement?.tagName === 'A') {
        selectedImage.parentElement.parentNode?.replaceChild(selectedImage, selectedImage.parentElement);
      }
    }
    
    const editorContainer = document.querySelector('.ql-editor');
    if (editorContainer) {
      setContent(editorContainer.innerHTML);
    }
    
    setShowLinkModal(false);
    setSelectedImage(null);
    setLinkUrl('');
    showToast('Image link updated successfully!', 'success');
  };

  const loadDrafts = async () => {
    try {
      const response = await axios.get('/api/blog/draft', getAuthHeaders());
      const draftsData = response.data?.drafts || response.data || [];
      setDrafts(Array.isArray(draftsData) ? draftsData : []);
    } catch (err) {
      console.error('Failed to load drafts:', err);
      showToast('Failed to load drafts', 'error');
      setDrafts([]);
    }
  };

  const loadPublishedBlogs = async () => {
    try {
      const response = await axios.get('/api/blog/published', getAuthHeaders());
      const publishedData = response.data?.blogs || response.data || [];
      setPublishedBlogs(Array.isArray(publishedData) ? publishedData : []);
    } catch (err) {
      console.error('Failed to load published blogs:', err);
      showToast('Failed to load published blogs', 'error');
      setPublishedBlogs([]);
    }
  };

  const saveDraft = async () => {
    if (!title && !content) {
      showToast('Please enter at least a title or content', 'warning');
      return;
    }
    
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      showToast('Authentication required. Please login again.', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      if (selectedDraft) {
        await axios.put(`/api/blog/draft?id=${selectedDraft}`, { 
          title: title || 'Untitled Draft', 
          content: ensureLinksUnderlined(content || '')
        }, getAuthHeaders());
        setLastSaved(new Date());
        showToast('Draft updated successfully!', 'success');
      } else {
        const response = await axios.post('/api/blog/draft', { 
          title: title || 'Untitled Draft', 
          content: ensureLinksUnderlined(content || '')
        }, getAuthHeaders());
        const newDraft = response.data?.draft || response.data;
        if (newDraft && newDraft._id) {
          setSelectedDraft(newDraft._id);
        }
        setLastSaved(new Date());
        showToast('Draft created successfully!', 'success');
      }
      loadDrafts();
    } catch (err) {
      console.error(err);
      showToast('Failed to save draft', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const publishBlog = async () => {
    if (!title || !content) {
      showToast('Title and content required', 'warning');
      return;
    }
    
    if (checkImageSizes(content)) {
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.post('/api/blog/published', { 
        title, 
        content: ensureLinksUnderlined(content)
      }, getAuthHeaders());
      showToast('Blog published successfully!', 'success');
      setTitle('');
      setContent('');
      setSelectedDraft(null);
      setSelectedPublished(null);
      loadDrafts();
      loadPublishedBlogs();
    } catch (err) {
      console.error(err);
      showToast('Failed to publish blog', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDraft = async (draftId: string) => {
    try {
      const response = await axios.get(`/api/blog/draft?id=${draftId}`, getAuthHeaders());
      const draft = response.data?.draft || response.data;
      if (!draft) {
        showToast('Draft not found', 'error');
        return;
      }
      setTitle(draft.title || '');
      setContent(draft.content || '');
      setSelectedDraft(draftId);
      setSelectedPublished(null);
      setActiveTab('drafts');
      showToast('Draft loaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to load draft:', err);
      showToast('Failed to load draft', 'error');
    }
  };

  const loadPublishedBlog = async (blogId: string) => {
    try {
      const response = await axios.get(`/api/blog/published?id=${blogId}`, getAuthHeaders());
      const blog = response.data?.blog || response.data;
      if (!blog) {
        showToast('Published blog not found', 'error');
        return;
      }
      setTitle(blog.title || '');
      setContent(blog.content || '');
      setSelectedPublished(blogId);
      setSelectedDraft(null);
      setActiveTab('published');
      showToast('Published blog loaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to load published blog:', err);
      showToast('Failed to load published blog', 'error');
    }
  };

  const updatePublishedBlog = async () => {
    if (!selectedPublished) {
      showToast('No blog selected for update', 'warning');
      return;
    }
    if (!title || !content) {
      showToast('Title and content required', 'warning');
      return;
    }
    
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      showToast('Authentication required. Please login again.', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.put(`/api/blog/published?id=${selectedPublished}`, { 
        title, 
        content: ensureLinksUnderlined(content)
      }, getAuthHeaders());
      
      if (response.data) {
        showToast('Blog updated successfully!', 'success');
        setTitle('');
        setContent('');
        setSelectedPublished(null);
        loadPublishedBlogs();
      } else {
        showToast('Failed to update blog - no response data', 'error');
      }
    } catch (err: any) {
      console.error('Update error:', err);
      showToast('Failed to update blog: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      await axios.delete(`/api/blog/draft?id=${draftId}`, getAuthHeaders());
      showToast('Draft deleted successfully!', 'success');
      if (selectedDraft === draftId) {
        setTitle('');
        setContent('');
        setSelectedDraft(null);
      }
      loadDrafts();
    } catch (err) {
      console.error('Failed to delete draft:', err);
      showToast('Failed to delete draft', 'error');
    }
  };

  const deletePublishedBlog = async (blogId: string) => {
    try {
      await axios.delete(`/api/blog/published?id=${blogId}`, getAuthHeaders());
      showToast('Blog deleted successfully!', 'success');
      if (selectedPublished === blogId) {
        setTitle('');
        setContent('');
        setSelectedPublished(null);
      }
      loadPublishedBlogs();
    } catch (err) {
      console.error('Failed to delete published blog:', err);
      showToast('Failed to delete published blog', 'error');
    }
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link', 'image'],
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
  ];

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-in p-4 rounded-lg shadow-lg max-w-sm ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-yellow-500 text-white'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
            <p className="mb-6">
              Are you sure you want to delete "{confirmAction.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmAction}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog Editor</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded ${activeTab === 'drafts' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          >
            Drafts ({Array.isArray(drafts) ? drafts.length : 0})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded ${activeTab === 'published' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          >
            Published ({Array.isArray(publishedBlogs) ? publishedBlogs.length : 0})
          </button>
        </div>
      </div>

      {/* Content Panel */}
      {activeTab === 'drafts' && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Saved Drafts</h2>
          {!Array.isArray(drafts) || drafts.length === 0 ? (
            <p className="text-gray-600">No drafts found</p>
          ) : (
            <div className="grid gap-3">
              {drafts.map((draft) => (
                <div key={draft._id} className="flex justify-between items-center p-3 bg-white rounded border">
                  <div className="flex-1">
                    <h3 className="font-medium">{draft.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadDraft(draft._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => openConfirmModal('deleteDraft', draft._id, draft.title)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'published' && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Published Blogs</h2>
          {!Array.isArray(publishedBlogs) || publishedBlogs.length === 0 ? (
            <p className="text-gray-600">No published blogs found</p>
          ) : (
            <div className="grid gap-3">
              {publishedBlogs.map((blog) => (
                <div key={blog._id} className="flex justify-between items-center p-3 bg-white rounded border">
                  <div className="flex-1">
                    <h3 className="font-medium">{blog.title}</h3>
                    <p className="text-sm text-gray-600">
                      Published: {new Date(blog.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadPublishedBlog(blog._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openConfirmModal('deletePublished', blog._id, blog.title)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blog Title
          </label>
          <input
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your blog title..."
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <div className="mb-2 text-sm text-gray-600">
            💡 Tip: Double-click on any image to add or edit its link, or right-click for more options (remove image). URLs must include https:// or http:// protocol (e.g., "https://example.com")
          </div>
          <ReactQuill
            key={`editor-${selectedDraft || selectedPublished || 'new'}`}
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            theme="snow"
            placeholder="Write your blog content here..."
            className="h-64"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {!selectedPublished && (
            <button
              onClick={saveDraft}
              disabled={isLoading}
              className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          
          {selectedPublished ? (
            <button
              onClick={updatePublishedBlog}
              disabled={isLoading || (!title && !content)}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Blog'}
            </button>
          ) : (
            <button
              onClick={publishBlog}
              disabled={isLoading || (!title && !content)}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Publishing...' : 'Publish Blog'}
            </button>
          )}

          {(title || content) && (
            <button
              onClick={() => {
                setTitle('');
                setContent('');
                setSelectedDraft(null);
                setSelectedPublished(null);
                showToast('Editor cleared', 'success');
              }}
              className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mt-4 flex items-center justify-between">
          {selectedDraft && (
            <div className="p-3 bg-blue-100 rounded-md">
              <p className="text-blue-800 text-sm">
                📝 Editing draft: {Array.isArray(drafts) ? drafts.find(d => d._id === selectedDraft)?.title : ''}
              </p>
            </div>
          )}
          {selectedPublished && (
            <div className="p-3 bg-green-100 rounded-md">
              <p className="text-green-800 text-sm">
                ✏️ Editing published blog: {Array.isArray(publishedBlogs) ? publishedBlogs.find(b => b._id === selectedPublished)?.title : ''}
              </p>
            </div>
          )}
          {lastSaved && !selectedPublished && (
            <div className="text-sm text-gray-600">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add/Edit Image Link</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link URL
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setLinkUrl(e.target.value);
                  const url = e.target.value.trim();
                  if (url && !url.match(/^https?:\/\//)) {
                    e.target.style.borderColor = '#ef4444';
                    e.target.title = 'URL must include https:// or http:// protocol';
                  } else if (url) {
                    try {
                      new URL(url);
                      e.target.style.borderColor = '#10b981';
                      e.target.title = 'Valid URL format';
                    } catch (err) {
                      e.target.style.borderColor = '#ef4444';
                      e.target.title = 'Invalid URL format';
                    }
                  } else {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.title = '';
                  }
                }}
                placeholder="https://example.com (protocol required)"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-1 text-xs text-gray-500">
                ⚠️ URL must include https:// or http:// protocol to be valid
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLinkSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save Link
              </button>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedImage(null);
                  setLinkUrl('');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Context Menu */}
      {showImageContextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setShowImageContextMenu(false)}>
          <div 
            className="absolute bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-[150px]"
            style={{ 
              left: contextMenuPosition.x, 
              top: contextMenuPosition.y,
              zIndex: 1000
            }}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (contextMenuImage) {
                  const currentLink = contextMenuImage.parentElement?.tagName === 'A' ? 
                    (contextMenuImage.parentElement as HTMLAnchorElement).href : '';
                  setSelectedImage(contextMenuImage);
                  setLinkUrl(currentLink);
                  setShowLinkModal(true);
                  setShowImageContextMenu(false);
                }
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            >
              <span>🔗</span> Add/Edit Link
            </button>
            <button
              onClick={removeImage}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
            >
              <span>🗑️</span> Remove Image
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .ql-editor a {
          color: #2563eb;
          text-decoration: underline;
          text-decoration-color: #2563eb;
          text-decoration-thickness: 2px;
          transition: all 0.2s ease;
        }
        
        .ql-editor a:hover {
          color: #1d4ed8;
          text-decoration-color: #1d4ed8;
          text-decoration-thickness: 3px;
        }
        
        .ql-editor a:visited {
          color: #7c3aed;
          text-decoration-color: #7c3aed;
        }
        
        .ql-editor a:visited:hover {
          color: #6d28d9;
          text-decoration-color: #6d28d9;
        }
      `}</style>
    </div>
  );
};

export default BlogEditor;