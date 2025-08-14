import dbConnect from '../../../lib/database';
import Blog from '../../../models/Blog';
import { verifyAuth } from './verifyAuth';
import Notification from "../../../models/Notification";
import { emitNotificationToUser } from "../push-notification/socketio";

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

  // Remove author-only reply restriction:
  // Anyone authenticated can reply, so no check needed here.

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


await Notification.create({
  user: comment.user,
  message: `You received a reply on your comment in "${blog.title}"`,
  relatedBlog: blog._id,
  relatedComment: comment._id,
});

 emitNotificationToUser(comment.user.toString(), {
    message: `You received a reply on your comment in "${blog.title}"`,
    relatedBlog: blog._id,
    relatedComment: comment._id,
    createdAt: new Date(),
  });

  res.status(200).json({ success: true, comment });
}
