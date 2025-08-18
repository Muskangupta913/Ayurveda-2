import dbConnect from "../../../lib/database";
import Blog from "../../../models/Blog";
import jwt from "jsonwebtoken";
import User from "../../../models/Users";

// Define allowed roles for different operations
const allowedRoles = {
  create: ["clinic", "doctor", "admin"], // roles that can create published blogs
  edit: ["clinic", "doctor", "admin"], // roles that can edit published blogs
  delete: ["admin", "clinic", "doctor"], // roles that can delete published blogs
};

// Authentication middleware function
const authenticate = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("No token provided");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new Error("Invalid token format");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { role, userId } = decoded;

    if (!userId || !role) {
      throw new Error("Invalid token payload");
    }

    // Verify user exists in database
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return { userId, role, user };
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// Authorization middleware function
const authorize = (userRole, requiredRoles) => {
  if (!requiredRoles.includes(userRole)) {
    throw new Error(
      `Access denied. Required roles: ${requiredRoles.join(", ")}`
    );
  }
};

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;

  try {
    switch (method) {
      case "GET":
        try {
          const { id } = req.query;
          const { userId, role } = await authenticate(req); // Authenticate for all GET requests

          if (id) {
            // Get single published blog by ID
            const blog = await Blog.findOne({
              _id: id,
              status: "published",
              $or: [
                { postedBy: userId }, // User owns the blog
                { role: "admin" }, // Or user is admin
              ],
            }).populate("postedBy", "name email");

            if (!blog) {
              return res
                .status(404)
                .json({
                  success: false,
                  message: "Published blog not found or you lack permission",
                });
            }
            return res.status(200).json({ success: true, blog });
          }

          // Get published blogs for the authenticated user's role
          const publishedBlogs = await Blog.find({
            status: "published",
            role: role, // Filter by the user's role
            $or: [
              { postedBy: userId }, // User owns the blog
              { role: "admin" }, // Or user is admin
            ],
          })
            .populate("postedBy", "name email")
            .sort({ createdAt: -1 });

          res.status(200).json({ success: true, blogs: publishedBlogs });
        } catch (error) {
          if (
            error.message.includes("No token") ||
            error.message.includes("Authentication failed")
          ) {
            return res
              .status(401)
              .json({ success: false, message: error.message });
          }
          res.status(400).json({ success: false, error: error.message });
        }
        break;

      case "POST":
        try {
          // Authenticate user
          const { userId, role } = await authenticate(req);

          // Check authorization for creating published blogs
          authorize(role, allowedRoles.create);

          const { title, content, paramlink } = req.body;

          if (!title || !content || !paramlink) {
            return res.status(400).json({
              success: false,
              message:
                "Title, content, and paramlink are required for published blogs",
            });
          }

          // Check for unique paramlink
          const existing = await Blog.findOne({ paramlink });
          if (existing) {
            return res
              .status(409)
              .json({ success: false, message: "Paramlink already exists" });
          }

          const publishedBlog = await Blog.create({
            title: title || "Untitled Blog",
            content: content || "",
            paramlink,
            status: "published",
            postedBy: userId,
            role: role,
          });

          // Populate the postedBy field to return user info
          const populatedBlog = await Blog.findById(publishedBlog._id).populate(
            "postedBy",
            "name email"
          );

          res.status(201).json({ success: true, blog: populatedBlog });
        } catch (error) {
          if (
            error.message.includes("No token") ||
            error.message.includes("Authentication failed")
          ) {
            return res
              .status(401)
              .json({ success: false, message: error.message });
          }
          if (error.message.includes("Access denied")) {
            return res
              .status(403)
              .json({ success: false, message: error.message });
          }
          res.status(400).json({ success: false, error: error.message });
        }
        break;

      case "PUT":
        try {
          // Authenticate user
          const { userId, role } = await authenticate(req);

          // Check authorization for editing published blogs
          authorize(role, allowedRoles.edit);

          const { id } = req.query;
          const { title, content, paramlink } = req.body;

          if (!id) {
            return res
              .status(400)
              .json({ success: false, message: "Blog ID required" });
          }

          // Find the existing blog
          const existingBlog = await Blog.findById(id);
          if (!existingBlog) {
            return res
              .status(404)
              .json({ success: false, message: "Published blog not found" });
          }

          // Check if user owns the blog or is admin
          if (existingBlog.postedBy.toString() !== userId && role !== "admin") {
            return res.status(403).json({
              success: false,
              message:
                "You can only edit your own published blogs unless you are an admin",
            });
          }

          // If paramlink is being updated, check for uniqueness
          if (paramlink) {
            const existing = await Blog.findOne({
              paramlink,
              _id: { $ne: id },
            });
            if (existing) {
              return res
                .status(409)
                .json({ success: false, message: "Paramlink already exists" });
            }
          }

          const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            {
              title,
              content,
              paramlink,
              status: "published",
              updatedAt: new Date(),
            },
            { new: true, runValidators: true }
          ).populate("postedBy", "name email");

          res.status(200).json({ success: true, blog: updatedBlog });
        } catch (error) {
          if (
            error.message.includes("No token") ||
            error.message.includes("Authentication failed")
          ) {
            return res
              .status(401)
              .json({ success: false, message: error.message });
          }
          if (error.message.includes("Access denied")) {
            return res
              .status(403)
              .json({ success: false, message: error.message });
          }
          res.status(400).json({ success: false, error: error.message });
        }
        break;

      case "DELETE":
        try {
          // Authenticate user
          const { userId, role } = await authenticate(req);

          // Check authorization for deleting published blogs
          authorize(role, allowedRoles.delete);

          const { id } = req.query;

          if (!id) {
            return res
              .status(400)
              .json({ success: false, message: "Blog ID required" });
          }

          // Find the existing blog
          const existingBlog = await Blog.findById(id);
          if (!existingBlog) {
            return res
              .status(404)
              .json({ success: false, message: "Published blog not found" });
          }

          // Check if user owns the blog or has delete permissions
          if (
            existingBlog.postedBy.toString() !== userId &&
            !allowedRoles.delete.includes(role)
          ) {
            return res.status(403).json({
              success: false,
              message:
                "You do not have permission to delete this published blog",
            });
          }

          await Blog.findByIdAndDelete(id);
          res
            .status(200)
            .json({
              success: true,
              message: "Published blog deleted successfully",
            });
        } catch (error) {
          if (
            error.message.includes("No token") ||
            error.message.includes("Authentication failed")
          ) {
            return res
              .status(401)
              .json({ success: false, message: error.message });
          }
          if (error.message.includes("Access denied")) {
            return res
              .status(403)
              .json({ success: false, message: error.message });
          }
          res.status(400).json({ success: false, error: error.message });
        }
        break;

      default:
        res.status(405).json({ success: false, message: "Method not allowed" });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
}
