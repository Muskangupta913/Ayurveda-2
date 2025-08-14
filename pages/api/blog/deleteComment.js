import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import { verifyAuth } from './verifyAuth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const user = await verifyAuth(req, res);
  if (!user) return;

  const { blogId, commentId } = req.body;

  if (!blogId || !commentId) {
    return res.status(400).json({ success: false, error: 'Blog ID & Comment ID are required' });
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({ success: false, error: 'Blog not found' });
  }

  // Try top-level comment first
  let comment = blog.comments.id(commentId);

  if (comment) {
    const isOwner = String(comment.user) === String(user._id);
    const isBlogAuthor = String(blog.postedBy) === String(user._id);
    if (!isOwner && !isBlogAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
    }
    comment.deleteOne();
  } else {
    // Search in replies
    let parentComment = blog.comments.find(c =>
      c.replies?.some(r => String(r._id) === String(commentId))
    );

    if (!parentComment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const reply = parentComment.replies.id(commentId);
    const isOwner = String(reply.user) === String(user._id);
    const isBlogAuthor = String(blog.postedBy) === String(user._id);
    if (!isOwner && !isBlogAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this reply' });
    }

    reply.deleteOne();
  }

  await blog.save();
  return res.status(200).json({ success: true, message: 'Comment/reply deleted successfully' });
}
