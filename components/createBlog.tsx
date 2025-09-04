import React, { useState, useEffect, ChangeEvent, MouseEvent, useMemo } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { useRouter } from "next/router";
import { FileText, Video, Eye, Save, Send, Trash2, X, Link } from "lucide-react";



// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 animate-pulse rounded flex items-center justify-center">
      <p className="text-gray-500">Loading editor...</p>
    </div>
  ),
});

interface Blog {
  _id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  createdAt: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning";
}

interface ConfirmAction {
  type: string;
  id: string;
  title: string;
}

interface BlogEditorProps {
  tokenKey: "clinicToken" | "doctorToken";
}

const BlogEditor: React.FC<BlogEditorProps> = ({ tokenKey }) => {
  const [title, setTitle] = useState<string>("");
  const [isParamlinkEditable, setIsParamlinkEditable] = useState(false);
  const [content, setContent] = useState<string>("");
  // lists moved to /clinic/published-blogs page
  const [drafts, setDrafts] = useState<Blog[]>([]);
  const [publishedBlogs, setPublishedBlogs] = useState<Blog[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [selectedPublished, setSelectedPublished] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // tabs removed
  const [activeTab, setActiveTab] = useState<"drafts" | "published">("drafts");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const [showImageContextMenu, setShowImageContextMenu] =
    useState<boolean>(false);
  const [contextMenuImage, setContextMenuImage] =
    useState<HTMLImageElement | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  // Video context menu state
  const [showVideoContextMenu, setShowVideoContextMenu] =
    useState<boolean>(false);
  const [contextMenuVideo, setContextMenuVideo] =
    useState<HTMLElement | null>(null);
  // Sharing moved to reusable component
  const [paramlink, setParamlink] = useState<string>("");
  const [paramlinkError, setParamlinkError] = useState<string>("");

  // New video-related state
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoType, setVideoType] = useState<"youtube" | "drive">("youtube");

  const getAuthHeaders = () => {
    const token = localStorage.getItem(tokenKey);
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Debug effect for context menu
  useEffect(() => {
    console.log("Context menu state changed:", showImageContextMenu);
  }, [showImageContextMenu]);

  // Global click handler to close context menus
  useEffect(() => {
    const handleGlobalClick = (e: globalThis.MouseEvent) => {
      if (showImageContextMenu) {
        setShowImageContextMenu(false);
        setContextMenuImage(null);
      }
      if (showVideoContextMenu) {
        setShowVideoContextMenu(false);
        setContextMenuVideo(null);
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [showImageContextMenu, showVideoContextMenu]);

  // Support loading by query param when navigated from Published Blogs page
  const router = useRouter();
  useEffect(() => {
    const { draftId, blogId } = router.query as {
      draftId?: string;
      blogId?: string;
    };
    if (draftId) {
      loadDraft(draftId);
    } else if (blogId) {
      loadPublishedBlog(blogId);
    }
  }, [router.query]);

  // Load ReactQuill CSS after component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css";
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

  // Add image and video click handlers after content changes
  useEffect(() => {
    const attachMediaListeners = () => {
      const editorContainer = document.querySelector(".ql-editor");
      if (editorContainer) {
        // Handle images
        const images = editorContainer.querySelectorAll("img");
        console.log("Found images:", images.length);

        images.forEach((img) => {
          img.removeEventListener(
            "dblclick",
            handleImageDoubleClick as EventListener
          );
          img.removeEventListener(
            "contextmenu",
            handleImageRightClick as EventListener
          );

          img.addEventListener(
            "dblclick",
            handleImageDoubleClick as EventListener
          );
          img.addEventListener(
            "contextmenu",
            handleImageRightClick as EventListener
          );

          (img as HTMLImageElement).style.cursor = "pointer";
          (img as HTMLImageElement).title =
            "Double-click to add/edit link, Right-click for more options";
        });

        // Handle videos
        const videoContainers = editorContainer.querySelectorAll(".video-container");
        console.log("Found videos:", videoContainers.length);

        videoContainers.forEach((container) => {
          container.removeEventListener(
            "contextmenu",
            handleVideoRightClick as EventListener
          );

          container.addEventListener(
            "contextmenu",
            handleVideoRightClick as EventListener
          );

          (container as HTMLElement).style.cursor = "pointer";
          (container as HTMLElement).title = "Right-click to remove video";
        });
      }
    };

    const timer = setTimeout(attachMediaListeners, 1000);

    const editorContainer = document.querySelector(".ql-editor");
    if (editorContainer) {
      editorContainer.addEventListener("focus", attachMediaListeners);
      editorContainer.addEventListener("input", attachMediaListeners);
    }

    return () => {
      clearTimeout(timer);
      if (editorContainer) {
        editorContainer.removeEventListener("focus", attachMediaListeners);
        editorContainer.removeEventListener("input", attachMediaListeners);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Slugify function
  const slugify = (text: string) =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");

  // Auto-generate paramlink from title if not manually edited
  useEffect(() => {
    if (!selectedDraft && !selectedPublished) {
      setParamlink(slugify(title));
    }
  }, [title, selectedDraft, selectedPublished]);

  // New video utility functions
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const extractGoogleDriveId = (url: string): string | null => {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /drive\.google\.com.*\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const createVideoEmbed = (url: string, type: "youtube" | "drive"): string => {
    if (type === "youtube") {
      const videoId = extractYouTubeId(url);
      if (!videoId) return "";

      return `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 16px 0;">
        <iframe 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
          src="https://www.youtube.com/embed/${videoId}" 
          frameborder="0" 
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
        </iframe>
      </div>`;
    } else {
      const fileId = extractGoogleDriveId(url);
      if (!fileId) return "";

      return `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 16px 0;">
        <iframe 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
          src="https://drive.google.com/file/d/${fileId}/preview" 
          frameborder="0" 
          allowfullscreen>
        </iframe>
      </div>`;
    }
  };

  const validateVideoUrl = (url: string, type: "youtube" | "drive"): boolean => {
    if (type === "youtube") {
      return extractYouTubeId(url) !== null;
    } else {
      return extractGoogleDriveId(url) !== null;
    }
  };

  const handleVideoInsert = () => {
    const trimmedUrl = videoUrl.trim();

    if (!trimmedUrl) {
      showToast("Please enter a video URL", "warning");
      return;
    }

    if (!validateVideoUrl(trimmedUrl, videoType)) {
      const message = videoType === "youtube"
        ? "Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...)"
        : "Please enter a valid Google Drive video URL (e.g., https://drive.google.com/file/d/.../view)";
      showToast(message, "error");
      return;
    }

    const videoEmbed = createVideoEmbed(trimmedUrl, videoType);
    if (!videoEmbed) {
      showToast("Failed to create video embed", "error");
      return;
    }

    // Insert the video embed into the content with automatic line break
    const newContent = content + videoEmbed + "\n";
    setContent(newContent);

    // Close modal and reset
    setShowVideoModal(false);
    setVideoUrl("");
    setVideoType("youtube");

    showToast(`${videoType === "youtube" ? "YouTube" : "Google Drive"} video added successfully!`, "success");
  };

  const ensureLinksUnderlined = (htmlContent: string) => {
    if (typeof window === "undefined") return htmlContent;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const links = tempDiv.querySelectorAll("a");
    links.forEach((link) => {
      if (!link.style.textDecoration || link.style.textDecoration === "none") {
        link.style.textDecoration = "underline";
        link.style.textDecorationColor = "#2563eb";
        link.style.textDecorationThickness = "2px";
      }
    });

    return tempDiv.innerHTML;
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const openConfirmModal = (type: string, id: string, title: string) => {
    setConfirmAction({ type, id, title });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "deleteDraft") {
      deleteDraft(confirmAction.id);
    } else if (confirmAction.type === "deletePublished") {
      deletePublishedBlog(confirmAction.id);
    }

    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleImageDoubleClick = (e: Event) => {
    e.preventDefault();
    const img = e.target as HTMLImageElement;
    const currentLink =
      img.parentElement?.tagName === "A"
        ? (img.parentElement as HTMLAnchorElement).href
        : "";

    setSelectedImage(img);
    setLinkUrl(currentLink);
    setShowLinkModal(true);
  };

  const handleImageRightClick = (e: Event) => {
    e.preventDefault();
    console.log("Right-click detected on image");
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

    console.log("Image rect:", rect);
    console.log("Context menu position:", { x, y });

    setContextMenuImage(img);
    setContextMenuPosition({ x, y });
    setShowImageContextMenu(true);
  };

  const handleVideoRightClick = (e: Event) => {
    e.preventDefault();
    console.log("Right-click detected on video");
    const videoContainer = e.currentTarget as HTMLElement;
    const rect = videoContainer.getBoundingClientRect();

    const menuWidth = 150;
    const menuHeight = 50;
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

    console.log("Video rect:", rect);
    console.log("Video context menu position:", { x, y });

    setContextMenuVideo(videoContainer);
    setContextMenuPosition({ x, y });
    setShowVideoContextMenu(true);
  };

  const removeVideo = () => {
    console.log("removeVideo called");
    if (contextMenuVideo) {
      console.log("Removing video:", contextMenuVideo);

      try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;

        const videoContainers = tempDiv.querySelectorAll(".video-container");
        let videoRemoved = false;

        videoContainers.forEach((container) => {
          const iframe = container.querySelector("iframe");
          const contextIframe = contextMenuVideo.querySelector("iframe");

          if (iframe && contextIframe && iframe.src === contextIframe.src && !videoRemoved) {
            container.remove();
            videoRemoved = true;
          }
        });

        if (videoRemoved) {
          setContent(tempDiv.innerHTML);
          showToast("Video removed successfully!", "success");
        } else {
          showToast("Video not found in content", "error");
        }
      } catch (error) {
        console.error("Error removing video:", error);
        showToast("Failed to remove video", "error");
      }
    } else {
      console.log("No contextMenuVideo found");
      showToast("No video selected for removal", "error");
    }

    setShowVideoContextMenu(false);
    setContextMenuVideo(null);
  };
  const removeImage = () => {
    console.log("removeImage called");
    if (contextMenuImage) {
      console.log("Removing image:", contextMenuImage);

      try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;

        const images = tempDiv.querySelectorAll("img");
        let imageRemoved = false;

        images.forEach((img) => {
          if (img.src === contextMenuImage.src && !imageRemoved) {
            img.remove();
            imageRemoved = true;
          }
        });

        if (imageRemoved) {
          setContent(tempDiv.innerHTML);
          showToast("Image removed successfully!", "success");
        } else {
          showToast("Image not found in content", "error");
        }
      } catch (error) {
        console.error("Error removing image:", error);
        showToast("Failed to remove image", "error");
      }
    } else {
      console.log("No contextMenuImage found");
      showToast("No image selected for removal", "error");
    }

    setShowImageContextMenu(false);
    setContextMenuImage(null);
  };

  const checkImageSizes = (htmlContent: string): boolean => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const images = tempDiv.querySelectorAll("img");
    let hasLargeImage = false;

    images.forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.startsWith("data:image")) {
        const base64Data = src.split(",")[1];
        if (base64Data) {
          const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
          const sizeInMB = sizeInBytes / (1024 * 1024);

          if (sizeInMB > 1) {
            hasLargeImage = true;
            showToast(
              `Image size (${sizeInMB.toFixed(
                2
              )}MB) exceeds the 1MB limit. Please resize the image before publishing.`,
              "error"
            );
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
        showToast(
          "Please enter a valid URL with https:// or http:// protocol",
          "error"
        );
        return;
      }

      try {
        new URL(trimmedUrl);
      } catch (e) {
        showToast(
          "Please enter a valid URL format (e.g., https://example.com)",
          "error"
        );
        return;
      }

      const linkElement = document.createElement("a");
      linkElement.href = trimmedUrl;
      linkElement.target = "_blank";
      linkElement.rel = "noopener noreferrer";

      selectedImage.parentNode?.replaceChild(linkElement, selectedImage);
      linkElement.appendChild(selectedImage);
    } else {
      if (selectedImage.parentElement?.tagName === "A") {
        selectedImage.parentElement.parentNode?.replaceChild(
          selectedImage,
          selectedImage.parentElement
        );
      }
    }

    const editorContainer = document.querySelector(".ql-editor");
    if (editorContainer) {
      setContent(editorContainer.innerHTML);
    }

    setShowLinkModal(false);
    setSelectedImage(null);
    setLinkUrl("");
    showToast("Image link updated successfully!", "success");
  };

  const loadDrafts = async () => {
    try {
      const response = await axios.get("/api/blog/draft", getAuthHeaders());
      const draftsData = response.data?.drafts || response.data || [];
      setDrafts(Array.isArray(draftsData) ? draftsData : []);
    } catch (err) {
      console.error("Failed to load drafts:", err);
      showToast("Failed to load drafts", "error");
      setDrafts([]);
    }
  };

  const loadPublishedBlogs = async () => {
    try {
      const response = await axios.get("/api/blog/published", getAuthHeaders());
      const publishedData = response.data?.blogs || response.data || [];
      setPublishedBlogs(Array.isArray(publishedData) ? publishedData : []);
    } catch (err) {
      console.error("Failed to load published blogs:", err);
      showToast("Failed to load published blogs", "error");
      setPublishedBlogs([]);
    }
  };

  const saveDraft = async () => {
    if (!title && !content) {
      showToast("Please enter at least a title or content", "warning");
      return;
    }
    if (!paramlink) {
      setParamlinkError("Paramlink is required");
      return;
    }
    setParamlinkError("");

    const token = localStorage.getItem(tokenKey);
    if (!token) {
      showToast("Authentication required. Please login again.", "error");
      return;
    }

    setIsLoading(true);
    try {
      if (selectedDraft) {
        await axios.put(
          `/api/blog/draft?id=${selectedDraft}`,
          {
            title: title || "Untitled Draft",
            content: ensureLinksUnderlined(content || ""),
            paramlink,
          },
          getAuthHeaders()
        );
        setLastSaved(new Date());
        showToast("Draft updated successfully!", "success");
      } else {
        const response = await axios.post(
          "/api/blog/draft",
          {
            title: title || "Untitled Draft",
            content: ensureLinksUnderlined(content || ""),
            paramlink,
          },
          getAuthHeaders()
        );
        const newDraft = response.data?.draft || response.data;
        if (newDraft && newDraft._id) {
          setSelectedDraft(newDraft._id);
        }
        setLastSaved(new Date());
        showToast("Draft created successfully!", "success");
      }
      loadDrafts();
    } catch (err: any) {
      if (err.response?.data?.message?.includes("Paramlink already exists")) {
        setParamlinkError("Paramlink already exists. Please choose another.");
      } else {
        showToast("Failed to save draft", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const publishBlog = async () => {
    if (!title || !content) {
      showToast("Title and content required", "warning");
      return;
    }
    if (!paramlink) {
      setParamlinkError("Paramlink is required");
      return;
    }
    setParamlinkError("");

    if (checkImageSizes(content)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        "/api/blog/published",
        {
          title,
          content: ensureLinksUnderlined(content),
          paramlink,
        },
        getAuthHeaders()
      );

      // After publishing, navigate to Published Blogs page to manage/share

      showToast("Blog published successfully!", "success");
      setTitle("");
      setContent("");
      setParamlink("");
      setSelectedDraft(null);
      setSelectedPublished(null);
      loadDrafts();
      loadPublishedBlogs();
    } catch (err: any) {
      if (err.response?.data?.message?.includes("Paramlink already exists")) {
        setParamlinkError("Paramlink already exists. Please choose another.");
      } else {
        showToast("Failed to publish blog", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDraft = async (draftId: string) => {
    try {
      const response = await axios.get(
        `/api/blog/draft?id=${draftId}`,
        getAuthHeaders()
      );
      const draft = response.data?.draft || response.data;
      if (!draft) {
        showToast("Draft not found", "error");
        return;
      }
      setTitle(draft.title || "");
      setContent(draft.content || "");
      setParamlink(draft.paramlink || "");
      setSelectedDraft(draftId);
      setSelectedPublished(null);
      setActiveTab("drafts");
      showToast("Draft loaded successfully!", "success");
    } catch (err) {
      console.error("Failed to load draft:", err);
      showToast("Failed to load draft", "error");
    }
  };

  const loadPublishedBlog = async (blogId: string) => {
    try {
      const response = await axios.get(
        `/api/blog/published?id=${blogId}`,
        getAuthHeaders()
      );
      const blog = response.data?.blog || response.data;
      if (!blog) {
        showToast("Published blog not found", "error");
        return;
      }
      setTitle(blog.title || "");
      setContent(blog.content || "");
      setParamlink(blog.paramlink || "");
      setSelectedPublished(blogId);
      setSelectedDraft(null);
      setActiveTab("published");
      showToast("Published blog loaded successfully!", "success");
    } catch (err) {
      console.error("Failed to load published blog:", err);
      showToast("Failed to load published blog", "error");
    }
  };

  const updatePublishedBlog = async () => {
    if (!selectedPublished) {
      showToast("No blog selected for update", "warning");
      return;
    }
    if (!title || !content) {
      showToast("Title and content required", "warning");
      return;
    }
    if (!paramlink) {
      setParamlinkError("Paramlink is required");
      return;
    }
    setParamlinkError("");

    const token = localStorage.getItem(tokenKey);
    if (!token) {
      showToast("Authentication required. Please login again.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.put(
        `/api/blog/published?id=${selectedPublished}`,
        {
          title,
          content: ensureLinksUnderlined(content),
          paramlink,
        },
        getAuthHeaders()
      );

      if (response.data) {
        showToast("Blog updated successfully!", "success");
        setTitle("");
        setContent("");
        setParamlink("");
        setSelectedPublished(null);
        loadPublishedBlogs();
      } else {
        showToast("Failed to update blog - no response data", "error");
      }
    } catch (err: any) {
      if (err.response?.data?.message?.includes("Paramlink already exists")) {
        setParamlinkError("Paramlink already exists. Please choose another.");
      } else {
        showToast(
          "Failed to update blog: " +
          (err.response?.data?.message || err.message),
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      await axios.delete(`/api/blog/draft?id=${draftId}`, getAuthHeaders());
      showToast("Draft deleted successfully!", "success");
      if (selectedDraft === draftId) {
        setTitle("");
        setContent("");
        setParamlink("");
        setSelectedDraft(null);
      }
      loadDrafts();
    } catch (err) {
      console.error("Failed to delete draft:", err);
      showToast("Failed to delete draft", "error");
    }
  };

  const deletePublishedBlog = async (blogId: string) => {
    try {
      await axios.delete(`/api/blog/published?id=${blogId}`, getAuthHeaders());
      showToast("Blog deleted successfully!", "success");
      if (selectedPublished === blogId) {
        setTitle("");
        setContent("");
        setParamlink("");
        setSelectedPublished(null);
      }
      loadPublishedBlogs();
    } catch (err) {
      console.error("Failed to delete published blog:", err);
      showToast("Failed to delete published blog", "error");
    }
  };
  const [value, setValue] = useState("");

  const modules = useMemo(
  () => ({
    toolbar: {
      container: [
        ["bold", "italic", "underline"],
        ["link", "image", "video"],
      ],
      handlers: {
        image: function (this: any) {
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");
          input.click();

          input.onchange = () => {
            const file = input.files?.[0];
            if (file) {
              // ✅ check file size (998KB ~ 1021928 bytes)
              if (file.size > 998 * 1024) {
                alert("Please upload an image smaller than 1 MB.");
                return;
              }

              const reader = new FileReader();
              reader.onload = () => {
                const range = this.quill.getSelection();
                this.quill.insertEmbed(range.index, "image", reader.result);
                this.quill.insertText(range.index + 1, "\n"); // 👈 new line after image
                this.quill.setSelection(range.index + 2);
              };
              reader.readAsDataURL(file);
            }
          };
        },
        video: function (this: any) {
          this.quill.blur(); // avoid addRange error
          setShowVideoModal(true);
        },
      },
    },
  }),
  []
);







  const formats = [
    "bold",
    "italic",
    "underline",
    "link",
    "image",
    "video",
  ];


  // Utility to get base URL
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-lg min-w-80 transform transition-all duration-300 ease-in-out ${toast.type === "success"
              ? "bg-green-500 text-white"
              : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-yellow-500 text-white"
              }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-white hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}


        {/* Main Content */}
        <div className="space-y-6">
          {/* Title and Permalink Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Blog Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Blog Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTitle(value);

                    // Auto-generate slug only if user hasn’t manually edited it
                    if (!isParamlinkEditable) {
                      const slug = value
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "") // remove special chars
                        .trim()
                        .replace(/\s+/g, "-") // spaces to dashes
                        .slice(0, 60); // limit to 60
                      setParamlink(slug);
                    }
                  }}
                  placeholder="Enter your blog title..."
                  className="text-black w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Permalink Section */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 mb-2 sm:mb-0">
                    URL Slug (Permalink)
                  </label>
                  <button
                    onClick={() => setIsParamlinkEditable(!isParamlinkEditable)}
                    className="text-xs text-[#2D9AA5] hover:text-[#257A83] font-medium self-start sm:self-auto"
                  >
                    {isParamlinkEditable ? "Lock" : "Edit"}
                  </button>
                </div>
                <div className="text-black">
                  <div className="flex items-stretch">
                    <span className="text-sm text-gray-900 bg-gray-100 px-3 py-3 rounded-l-lg border border-gray-300 border-r-0 whitespace-nowrap">
                      {getBaseUrl()}/blog/
                    </span>
                    <input
                      type="text"
                      value={paramlink}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 60) {
                          setParamlink(value);
                        }
                      }}
                      readOnly={!isParamlinkEditable}
                      maxLength={60}
                      className={`flex-1 px-4 py-3 border ${paramlinkError ? "border-red-500" : "border-gray-300"
                        } rounded-r-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent transition-all duration-200 ${!isParamlinkEditable ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    {paramlinkError && (
                      <p className="text-red-500 text-sm">{paramlinkError}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                      {paramlink.length}/60 characters
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Permalink should be only 60 characters long
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Content Editor */}
          <div className="text-black bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-[#2D9AA5]" />
                Content Editor
              </h3>
            </div>
            <div className="p-6">
              <div className="h-[350px] overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  formats={formats}
                  placeholder="Start writing your blog content..."
                  className="h-full"
                  style={{
                    "--ql-primary": "#2D9AA5",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {lastSaved && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveDraft}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                >
                  <Save size={16} />
                  Save Draft
                </button>
                <button
                  onClick={selectedPublished ? updatePublishedBlog : publishBlog}
                  disabled={isLoading || !title || !content}
                  className="flex items-center gap-2 px-6 py-3 bg-[#2D9AA5] text-white rounded-lg hover:bg-[#257A83] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                >
                  <Send size={16} />
                  {selectedPublished ? "Update Blog" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Video size={24} className="text-[#2D9AA5]" />
                Insert Video
              </h3>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoUrl("");
                  setVideoType("youtube");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVideoType("youtube")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${videoType === "youtube"
                      ? "bg-[#2D9AA5] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    YouTube
                  </button>
                  <button
                    onClick={() => setVideoType("drive")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${videoType === "drive"
                      ? "bg-[#2D9AA5] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    Google Drive
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={
                    videoType === "youtube"
                      ? "https://youtube.com/watch?v=..."
                      : "https://drive.google.com/file/d/.../view"
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setVideoUrl("");
                    setVideoType("youtube");
                  }}
                  className="flex-1 py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVideoInsert}
                  disabled={!videoUrl.trim()}
                  className="flex-1 py-2 px-4 text-sm font-medium text-white bg-[#2D9AA5] rounded-lg hover:bg-[#257A83] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Insert Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Link size={24} className="text-[#2D9AA5]" />
                Add Image Link
              </h3>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedImage(null);
                  setLinkUrl("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL (optional)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D9AA5] focus:border-transparent transition-all duration-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to remove existing link
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setSelectedImage(null);
                    setLinkUrl("");
                  }}
                  className="flex-1 py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkSubmit}
                  className="flex-1 py-2 px-4 text-sm font-medium text-white bg-[#2D9AA5] rounded-lg hover:bg-[#257A83] transition-colors"
                >
                  Apply Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Confirm Action
              </h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{confirmAction.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="flex-1 py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="flex-1 py-2 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Context Menu */}
      {showImageContextMenu && contextMenuImage && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-2 min-w-32"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <button
            onClick={() => {
              handleImageDoubleClick({ target: contextMenuImage } as any);
              setShowImageContextMenu(false);
              setContextMenuImage(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Link size={14} />
            Edit Link
          </button>
          <button
            onClick={removeImage}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      )}

      {/* Video Context Menu */}
      {showVideoContextMenu && contextMenuVideo && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-2 min-w-32"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <button
            onClick={removeVideo}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={14} />
            Remove Video
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D9AA5]"></div>
            <span className="text-gray-700 font-medium">Processing...</span>
          </div>
        </div>
      )}

      {/* Custom Styles for ReactQuill */}
      <style jsx global>{`
        .ql-toolbar {
          border-top: 1px solid #e5e7eb !important;
          border-left: 1px solid #e5e7eb !important;
          border-right: 1px solid #e5e7eb !important;
          border-bottom: 1px solid #e5e7eb !important;
          border-radius: 8px 8px 0 0 !important;
          background: #f9fafb !important;
        }
        
        .ql-container {
          border-left: 1px solid #e5e7eb !important;
          border-right: 1px solid #e5e7eb !important;
          border-bottom: 1px solid #e5e7eb !important;
          border-radius: 0 0 8px 8px !important;
          height: calc(100% - 42px) !important;
        }
        
        .ql-editor {
          height: 100% !important;
          overflow-y: auto !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
        }
        
        .ql-editor::before {
          font-style: italic !important;
          color: #9ca3af !important;
        }
        
        .ql-toolbar .ql-formats {
          margin-right: 15px !important;
        }
        
        .ql-toolbar button:hover,
        .ql-toolbar button:focus {
          background: #2D9AA5 !important;
          color: white !important;
          border-radius: 4px !important;
        }
        
        .ql-toolbar .ql-active {
          background: #2D9AA5 !important;
          color: white !important;
          border-radius: 4px !important;
        }
        
        .ql-snow .ql-tooltip {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
        }
        
        .ql-snow .ql-tooltip input[type=text] {
          border: 1px solid #d1d5db !important;
          border-radius: 4px !important;
          padding: 6px 8px !important;
        }
        
        .ql-snow .ql-tooltip a.ql-action::after {
          content: 'Save' !important;
          background: #2D9AA5 !important;
          color: white !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
        }
        
        .ql-snow .ql-tooltip a.ql-remove::before {
          content: 'Remove' !important;
          background: #ef4444 !important;
          color: white !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
        }
          .ql-editor img {
  width: 400px !important;
  height: auto !important;
  object-fit: contain !important;
  display: block;
  margin: 12px auto;
}
.ql-editor iframe,
.ql-editor video { 
  display: block;               
  margin: 16px auto;            
  border-radius: 8px;           
  object-fit: contain !important;
}
  .ql-tooltip {
  transform: translateY(-150%) !important; /* move above selection */
  margin-bottom: 6px !important;
}

.ql-tooltip::after {
  content: "";
  position: absolute;
  bottom: -6px; /* arrow pointing downwards */
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: white transparent transparent transparent; /* little arrow */
}


      `}</style>
    </div>
  );
};

export default BlogEditor;