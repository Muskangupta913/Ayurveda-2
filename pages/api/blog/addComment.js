// pages/api/blog/addComment.js
import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import { verifyAuth } from './verifyAuth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const user = await verifyAuth(req, res);
  if (!user) return; // Already handled error inside verifyAuth

  const { blogId, text } = req.body;
  if (!blogId || !text) {
    return res.status(400).json({ success: false, error: 'Blog ID & text are required' });
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({ success: false, error: 'Blog not found' });
  }

  const newComment = {
    user: user._id,
    username: user.name,
    text,
    createdAt: new Date()
  };

  blog.comments.push(newComment);
  await blog.save();

  res.status(200).json({ success: true, comments: blog.comments,commentsCount: blog.comments.length });
}
