/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    enableFeedbackButton: false, // 🔥 This disables the floating "N" button
  },
  images: {
    domains: [
      'localhost',                // for local development
      'ayurvedanearme.ae',        // for production
      'images.unsplash.com'       // for Unsplash images
    ],
  },
  devIndicators: false,
};

module.exports = nextConfig;
