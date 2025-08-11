// pages/api/blog/addReply.js
import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import { verifyAuth } from './verifyAuth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const user = await verifyAuth(req, res);
  if (!user) return;

  const { blogId, commentId, text } = req.body;
  if (!blogId || !commentId || !text) {
    return res.status(400).json({ success: false, error: 'Blog ID, Comment ID & text are required' });
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({ success: false, error: 'Blog not found' });
  }

  // Check if current user is the blog author
  if (String(blog.postedBy) !== String(user._id)) {
    return res.status(403).json({ success: false, error: 'Only the blog author can reply to comments' });
  }

  const comment = blog.comments.id(commentId);
  if (!comment) {
    return res.status(404).json({ success: false, error: 'Comment not found' });
  }

  comment.replies.push({
    user: user._id,
    username: user.name,
    text,
    createdAt: new Date()
  });

  await blog.save();

  res.status(200).json({ success: true, comment });
}
