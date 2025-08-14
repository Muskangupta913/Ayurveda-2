import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import { verifyAuth } from './verifyAuth'; // adjust path as needed

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Verify user from token in Authorization header
  const user = await verifyAuth(req, res);
  if (!user) return; // verifyAuth should handle error response if invalid

  try {
    // Find all blogs posted by this logged-in user
    const blogs = await Blog.find({ postedBy: user._id, status: 'published' })
      .select('title likes comments createdAt')
      .lean();

    const response = blogs.map(blog => ({
      _id: blog._id,
      title: blog.title,
      likesCount: blog.likes?.length || 0,
      commentsCount: blog.comments?.length || 0,
      comments: blog.comments || [],
      createdAt: blog.createdAt,
    }));

    res.status(200).json({ success: true, blogs: response });
  } catch (error) {
    console.error('Error fetching author blogs:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
