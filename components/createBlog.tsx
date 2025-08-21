import React, { useState, useEffect, ChangeEvent, MouseEvent } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import SocialMediaShare from "./SocialMediaShare";
import { useRouter } from "next/router";

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

        // Handle video remove buttons with direct event listeners
        const videoRemoveButtons = editorContainer.querySelectorAll(".remove-video-btn");
        console.log("Found video remove buttons:", videoRemoveButtons.length);
        
        videoRemoveButtons.forEach((button) => {
          // Remove existing listeners to prevent duplicates
          button.removeEventListener("click", handleVideoRemoveDirectClick as EventListener);
          button.removeEventListener("mousedown", handleVideoRemoveDirectClick as EventListener);
          
          // Add both click and mousedown for better compatibility
          button.addEventListener("click", handleVideoRemoveDirectClick as EventListener);
          button.addEventListener("mousedown", handleVideoRemoveDirectClick as EventListener);
          
          // Make sure the button looks clickable
          (button as HTMLElement).style.cursor = "pointer";
        });

        // Also use event delegation as backup
        editorContainer.removeEventListener("click", handleEditorClick as EventListener);
        editorContainer.addEventListener("click", handleEditorClick as EventListener);
      }
    };

    // Attach listeners immediately and also with a delay
    attachMediaListeners();
    const timer = setTimeout(attachMediaListeners, 100);
    const timer2 = setTimeout(attachMediaListeners, 500);

    const editorContainer = document.querySelector(".ql-editor");
    if (editorContainer) {
      editorContainer.addEventListener("focus", attachMediaListeners);
      editorContainer.addEventListener("input", attachMediaListeners);
      // Also listen for DOM changes
      const observer = new MutationObserver(attachMediaListeners);
      observer.observe(editorContainer, { childList: true, subtree: true });
      
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        observer.disconnect();
        editorContainer.removeEventListener("focus", attachMediaListeners);
        editorContainer.removeEventListener("input", attachMediaListeners);
        editorContainer.removeEventListener("click", handleEditorClick as EventListener);
      };
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
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
    const videoId = Date.now().toString() + Math.random().toString(36).substr(2, 9); // More unique ID
    
    if (type === "youtube") {
      const youtubeId = extractYouTubeId(url);
      if (!youtubeId) return "";
      
      return `<div class="video-wrapper" data-video-id="${videoId}" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #f9fafb; position: relative;">
        <div class="video-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280; display: flex; align-items: center; gap: 6px;">
            <span>🎥</span> YouTube Video
          </span>
          <div 
            class="remove-video-btn" 
            data-video-id="${videoId}"
            style="background: #ef4444; color: white; border: 1px solid #ef4444; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-left: auto; display: inline-flex; align-items: center; gap: 4px; z-index: 1000; position: relative; user-select: none; font-weight: 500;"
            contenteditable="false"
            title="Click to remove this video"
          >
            🗑️ Remove
          </div>
        </div>
        <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 6px;">
          <iframe 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            src="https://www.youtube.com/embed/${youtubeId}" 
            frameborder="0" 
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
          </iframe>
        </div>
      </div>`;
    } else {
      const fileId = extractGoogleDriveId(url);
      if (!fileId) return "";
      
      return `<div class="video-wrapper" data-video-id="${videoId}" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #f9fafb; position: relative;">
        <div class="video-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280; display: flex; align-items: center; gap: 6px;">
            <span>📁</span> Google Drive Video
          </span>
          <div 
            class="remove-video-btn" 
            data-video-id="${videoId}"
            style="background: #ef4444; color: white; border: 1px solid #ef4444; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-left: auto; display: inline-flex; align-items: center; gap: 4px; z-index: 1000; position: relative; user-select: none; font-weight: 500;"
            contenteditable="false"
            title="Click to remove this video"
          >
            🗑️ Remove
          </div>
        </div>
        <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 6px;">
          <iframe 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            src="https://drive.google.com/file/d/${fileId}/preview" 
            frameborder="0" 
            allowfullscreen>
          </iframe>
        </div>
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

    // Insert the video embed into the content
    const newContent = content + videoEmbed;
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

  // Direct click handler for video remove buttons
  const handleVideoRemoveDirectClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Video remove button clicked directly!");
    
    const target = e.target as HTMLElement;
    const button = target.classList.contains('remove-video-btn') ? target : target.closest('.remove-video-btn') as HTMLElement;
    
    if (button) {
      const videoId = button.getAttribute("data-video-id");
      console.log("Video ID to remove:", videoId);
      
      if (videoId) {
        removeVideoById(videoId);
      }
    }
  };

  // Event delegation handler for editor clicks
  const handleEditorClick = (e: Event) => {
    const target = e.target as HTMLElement;
    
    console.log("Editor clicked, target:", target.className, target.tagName);
    
    // Check if clicked element is a video remove button or its child
    if (target.classList.contains('remove-video-btn') || target.closest('.remove-video-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log("Video remove button detected via delegation!");
      
      const button = target.classList.contains('remove-video-btn') ? target : target.closest('.remove-video-btn') as HTMLElement;
      const videoId = button?.getAttribute("data-video-id");
      
      console.log("Video ID from delegation:", videoId);
      
      if (videoId) {
        removeVideoById(videoId);
      }
    }
  };

  const handleVideoRemoveClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.target as HTMLElement;
    const videoId = button.getAttribute("data-video-id") || 
                   button.closest('.remove-video-btn')?.getAttribute("data-video-id");
    
    if (videoId) {
      removeVideoById(videoId);
    }
  };

  const removeVideoById = (videoId: string) => {
    console.log("removeVideoById called with:", videoId);

    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      const videoWrapper = tempDiv.querySelector(`.video-wrapper[data-video-id="${videoId}"]`);
      
      if (videoWrapper) {
        videoWrapper.remove();
        setContent(tempDiv.innerHTML);
        showToast("Video removed successfully!", "success");
      } else {
        showToast("Video not found in content", "error");
      }
    } catch (error) {
      console.error("Error removing video:", error);
      showToast("Failed to remove video", "error");
    }
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

  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      ["link", "image"],
    ],
  };

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
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
    <div className="max-w-6xl mx-auto p-4">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-in p-4 rounded-lg shadow-lg max-w-sm ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-yellow-500 text-white"
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
              Are you sure you want to delete "{confirmAction.title}"? This
              action cannot be undone.
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

      {/* Sharing popup removed. Use SocialMediaShare buttons in lists below */}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog Editor</h1>
        {/* Remove the tab buttons for switching between drafts and published */}
      </div>

      {/* Content Panel */}
      {/* Remove the content panel for drafts and published blogs */}

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
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blog URL (paramlink)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {getBaseUrl()}/blogs/{paramlink || "..."}
            </span>
          </div>
          <input
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
            placeholder="blog-url-slug"
            value={paramlink}
            onChange={(e) => setParamlink(slugify(e.target.value))}
          />
          {paramlinkError && (
            <div className="text-red-600 text-xs mt-1">{paramlinkError}</div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <div className="mb-2 text-sm text-gray-600">
            💡 Tip: Double-click on any image to add or edit its link, or
            right-click for more options (remove image). Each video has a remove button above it for easy deletion.
            URLs must include https:// or http:// protocol (e.g., "https://example.com")
          </div>
          
          {/* Video Insert Button */}
          <div className="mb-3">
            <button
              onClick={() => setShowVideoModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 text-sm"
            >
              <span>🎥</span> Insert Video
            </button>
          </div>

          <ReactQuill
            key={`editor-${selectedDraft || selectedPublished || "new"}`}
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
              {isLoading ? "Saving..." : "Save Draft"}
            </button>
          )}

          {selectedPublished ? (
            <button
              onClick={updatePublishedBlog}
              disabled={isLoading || (!title && !content)}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating..." : "Update Blog"}
            </button>
          ) : (
            <button
              onClick={publishBlog}
              disabled={isLoading || (!title && !content)}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Publishing..." : "Publish Blog"}
            </button>
          )}

          {(title || content) && (
            <button
              onClick={() => {
                setTitle("");
                setContent("");
                setSelectedDraft(null);
                setSelectedPublished(null);
                showToast("Editor cleared", "success");
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
                📝 Editing draft:{" "}
                {Array.isArray(drafts)
                  ? drafts.find((d) => d._id === selectedDraft)?.title
                  : ""}
              </p>
            </div>
          )}
          {selectedPublished && (
            <div className="p-3 bg-green-100 rounded-md">
              <p className="text-green-800 text-sm">
                ✏️ Editing published blog:{" "}
                {Array.isArray(publishedBlogs)
                  ? publishedBlogs.find((b) => b._id === selectedPublished)
                      ?.title
                  : ""}
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

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insert Video</h3>
            
            {/* Video Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="youtube"
                    checked={videoType === "youtube"}
                    onChange={(e) => setVideoType(e.target.value as "youtube" | "drive")}
                    className="mr-2"
                  />
                  <span className="text-sm">YouTube</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="drive"
                    checked={videoType === "drive"}
                    onChange={(e) => setVideoType(e.target.value as "youtube" | "drive")}
                    className="mr-2"
                  />
                  <span className="text-sm">Google Drive</span>
                </label>
              </div>
            </div>

            {/* Video URL Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setVideoUrl(e.target.value);
                  const url = e.target.value.trim();
                  if (url && validateVideoUrl(url, videoType)) {
                    e.target.style.borderColor = "#10b981";
                  } else if (url) {
                    e.target.style.borderColor = "#ef4444";
                  } else {
                    e.target.style.borderColor = "#d1d5db";
                  }
                }}
                placeholder={
                  videoType === "youtube"
                    ? "https://youtube.com/watch?v=... or https://youtu.be/..."
                    : "https://drive.google.com/file/d/.../view"
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-1 text-xs text-gray-500">
                {videoType === "youtube" ? (
                  <>
                    📹 Supported formats:
                    <br />• https://youtube.com/watch?v=VIDEO_ID
                    <br />• https://youtu.be/VIDEO_ID
                    <br />• https://youtube.com/embed/VIDEO_ID
                  </>
                ) : (
                  <>
                    📁 Supported formats:
                    <br />• https://drive.google.com/file/d/FILE_ID/view
                    <br />• https://drive.google.com/open?id=FILE_ID
                    <br />Make sure the video is publicly accessible or shared with "Anyone with link"
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleVideoInsert}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Insert Video
              </button>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoUrl("");
                  setVideoType("youtube");
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                    e.target.style.borderColor = "#ef4444";
                    e.target.title =
                      "URL must include https:// or http:// protocol";
                  } else if (url) {
                    try {
                      new URL(url);
                      e.target.style.borderColor = "#10b981";
                      e.target.title = "Valid URL format";
                    } catch (err) {
                      e.target.style.borderColor = "#ef4444";
                      e.target.title = "Invalid URL format";
                    }
                  } else {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.title = "";
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
                  setLinkUrl("");
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Context Menu - keeping for backward compatibility but not actively used */}
      {showVideoContextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowVideoContextMenu(false)}
        >
          <div
            className="absolute bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-[150px]"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              zIndex: 1000,
            }}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <button
              onClick={removeVideo}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
            >
              <span>🎥</span> Remove Video
            </button>
          </div>
        </div>
      )}

      {/* Image Context Menu */}
      {showImageContextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowImageContextMenu(false)}
        >
          <div
            className="absolute bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-[150px]"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              zIndex: 1000,
            }}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (contextMenuImage) {
                  const currentLink =
                    contextMenuImage.parentElement?.tagName === "A"
                      ? (contextMenuImage.parentElement as HTMLAnchorElement)
                          .href
                      : "";
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

        .video-container iframe {
          border-radius: 8px;
        }

        .ql-editor .video-container {
          margin: 16px 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .ql-editor .video-wrapper {
          margin: 20px 0 !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          padding: 12px !important;
          background: #f9fafb !important;
        }

        .ql-editor .video-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 8px !important;
        }

        .ql-editor .remove-video-btn {
          background: #ef4444 !important;
          color: white !important;
          border: 1px solid #ef4444 !important;
          padding: 6px 10px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          cursor: pointer !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          transition: all 0.2s !important;
          user-select: none !important;
          z-index: 1000 !important;
          position: relative !important;
          font-weight: 500 !important;
          pointer-events: auto !important;
        }

        .ql-editor .remove-video-btn:hover {
          background: #dc2626 !important;
          border-color: #dc2626 !important;
          transform: scale(1.05) !important;
        }

        .ql-editor .remove-video-btn:active {
          transform: scale(0.95) !important;
        }
      `}</style>
    </div>
  );
};

export default BlogEditor;