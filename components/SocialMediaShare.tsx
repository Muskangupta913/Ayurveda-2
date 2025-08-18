import React, { useMemo, useState } from "react";

export interface SocialMediaShareProps {
  blogTitle: string;
  blogUrl: string; // absolute URL preferred
  blogDescription?: string;
  triggerLabel?: string;
  triggerClassName?: string;
}

const openWindow = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer,width=800,height=600");
};

const SocialMediaShare: React.FC<SocialMediaShareProps> = ({
  blogTitle,
  blogUrl,
  blogDescription = "",
  triggerLabel = "Share",
  triggerClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const safeUrl = useMemo(() => {
    if (!blogUrl) return "";
    try {
      const u = new URL(
        blogUrl,
        typeof window !== "undefined" ? window.location.origin : undefined
      );
      return u.toString();
    } catch {
      return blogUrl; // best effort
    }
  }, [blogUrl]);

  const description = blogDescription?.slice(0, 220) || "";

  const shareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      safeUrl
    )}&title=${encodeURIComponent(blogTitle)}&summary=${encodeURIComponent(
      description
    )}`;
    openWindow(url);
  };

  const shareFacebook = () => {
    const quote = `${blogTitle}\n\n${description}`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      safeUrl
    )}&quote=${encodeURIComponent(quote)}`;
    openWindow(url);
  };

  const shareTwitter = () => {
    const text = `${blogTitle}\n\n${description}\n\n`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(safeUrl)}`;
    openWindow(url);
  };

  const shareWhatsApp = () => {
    const text = `${blogTitle}\n\n${description}\n\n${safeUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    openWindow(url);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(safeUrl);
      setIsOpen(false);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = safeUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ||
          "px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {triggerLabel}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Share this blog</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {blogTitle}
              </p>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={shareLinkedIn}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700"
              >
                LinkedIn
              </button>
              <button
                onClick={shareFacebook}
                className="w-full flex items-center justify-center gap-2 bg-blue-800 text-white rounded-md py-2 hover:bg-blue-900"
              >
                Facebook
              </button>
              <button
                onClick={shareTwitter}
                className="w-full flex items-center justify-center gap-2 bg-sky-500 text-white rounded-md py-2 hover:bg-sky-600"
              >
                Twitter
              </button>
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-md py-2 hover:bg-green-700"
              >
                WhatsApp
              </button>
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white rounded-md py-2 hover:bg-gray-700"
              >
                Copy Link
              </button>
            </div>
            <div className="p-3 border-t flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialMediaShare;
