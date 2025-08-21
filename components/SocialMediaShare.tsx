import React, { useMemo, useState } from "react";
import { 
  Share2, 
  Linkedin, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Copy, 
  X,
  ExternalLink,
  Check
} from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = safeUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ||
          "px-4 py-2 text-sm rounded-xl  text-blue-500 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2  hover:scale-105"
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Share2 className="w-4 h-4" />
        {/* {triggerLabel} */}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 border border-gray-100">
            
            {/* Header with gradient accent */}
            <div className="relative p-6 border-b border-gray-100">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl"></div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Share this blog</h3>
                    <p className="text-sm text-gray-500 mt-1">Spread the word!</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-red-100 rounded-xl flex items-center justify-center transition-all duration-200 group"
                >
                  <X className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                </button>
              </div>
              
              {/* Blog title preview */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                  {blogTitle}
                </p>
                {description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Social Media Buttons */}
            <div className="p-6 space-y-3">
              
              {/* LinkedIn */}
              <button
                onClick={shareLinkedIn}
                className="w-full flex items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-3 px-4 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Linkedin className="w-5 h-5" />
                </div>
                <span className="font-semibold flex-1 text-left">Share on LinkedIn</span>
                <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </button>

              {/* Facebook */}
              <button
                onClick={shareFacebook}
                className="w-full flex items-center gap-4 bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-xl py-3 px-4 hover:from-blue-900 hover:to-blue-950 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Facebook className="w-5 h-5" />
                </div>
                <span className="font-semibold flex-1 text-left">Share on Facebook</span>
                <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </button>

              {/* Twitter */}
              <button
                onClick={shareTwitter}
                className="w-full flex items-center gap-4 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl py-3 px-4 hover:from-sky-600 hover:to-sky-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Twitter className="w-5 h-5" />
                </div>
                <span className="font-semibold flex-1 text-left">Share on Twitter</span>
                <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </button>

              {/* WhatsApp */}
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center gap-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl py-3 px-4 hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="font-semibold flex-1 text-left">Share on WhatsApp</span>
                <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </button>

              {/* Copy Link */}
              <button
                onClick={copyLink}
                className={`w-full flex items-center gap-4 rounded-xl py-3 px-4 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl group ${
                  copied 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                } text-white`}
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </div>
                <span className="font-semibold flex-1 text-left">
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </span>
                {copied && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-center">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 text-sm rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 font-medium"
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