import dbConnect from "../../../lib/database";
import Blog from "../../../models/Blog";
import jwt from "jsonwebtoken";
import User from "../../../models/Users";

// Define allowed roles for different operations
const allowedRoles = {
  create: ["clinic", "doctor", "admin"], // roles that can create drafts
  edit: ["clinic", "doctor", "admin"], // roles that can edit drafts
  delete: ["admin", "clinic", "doctor"], // roles that can delete drafts
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
            // Get single draft by ID
            const draft = await Blog.findOne({
              _id: id,
              status: "draft",
              $or: [
                { postedBy: userId }, // User owns the draft
                { role: "admin" }, // Or user is admin
              ],
            }).populate("postedBy", "name email");

            if (!draft) {
              return res
                .status(404)
                .json({
                  success: false,
                  message: "Draft not found or you lack permission",
                });
            }
            return res.status(200).json({ success: true, draft });
          }

          // Get all drafts for the authenticated user's role
          const drafts = await Blog.find({
            status: "draft",
            role: role, // Filter by the user's role
            $or: [
              { postedBy: userId }, // User owns the draft
              { role: "admin" }, // Or user is admin
            ],
          })
            .populate("postedBy", "name email")
            .sort({ createdAt: -1 });

          res.status(200).json({ success: true, drafts });
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

          // Check authorization for creating drafts
          authorize(role, allowedRoles.create);

          const { title, content, paramlink } = req.body;

          if (!title || !content || !paramlink) {
            return res.status(400).json({
              success: false,
              message: "Title, content, and paramlink are required for drafts",
            });
          }

          // Check for unique paramlink
          const existing = await Blog.findOne({ paramlink });
          if (existing) {
            return res
              .status(409)
              .json({ success: false, message: "Paramlink already exists" });
          }

          const draft = await Blog.create({
            title: title || "Untitled Draft",
            content: content || "",
            paramlink,
            status: "draft",
            postedBy: userId,
            role: role,
          });

          // Populate the postedBy field to return user info
          const populatedDraft = await Blog.findById(draft._id).populate(
            "postedBy",
            "name email"
          );

          res.status(201).json({ success: true, draft: populatedDraft });
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

          // Check authorization for editing drafts
          authorize(role, allowedRoles.edit);

          const { id } = req.query;
          const { title, content, paramlink } = req.body;

          if (!id) {
            return res
              .status(400)
              .json({ success: false, message: "Draft ID required" });
          }

          // Find the existing draft
          const existingDraft = await Blog.findById(id);
          if (!existingDraft) {
            return res
              .status(404)
              .json({ success: false, message: "Draft not found" });
          }

          // Check if user owns the draft or is admin
          if (
            existingDraft.postedBy.toString() !== userId &&
            role !== "admin"
          ) {
            return res.status(403).json({
              success: false,
              message:
                "You can only edit your own drafts unless you are an admin",
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

          const updatedDraft = await Blog.findByIdAndUpdate(
            id,
            {
              title,
              content,
              paramlink,
              status: "draft",
              updatedAt: new Date(),
            },
            { new: true, runValidators: true }
          ).populate("postedBy", "name email");

          res.status(200).json({ success: true, draft: updatedDraft });
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

          // Check authorization for deleting drafts
          authorize(role, allowedRoles.delete);

          const { id } = req.query;

          if (!id) {
            return res
              .status(400)
              .json({ success: false, message: "Draft ID required" });
          }

          // Find the existing draft
          const existingDraft = await Blog.findById(id);
          if (!existingDraft) {
            return res
              .status(404)
              .json({ success: false, message: "Draft not found" });
          }

          // Check if user owns the draft or has delete permissions
          if (
            existingDraft.postedBy.toString() !== userId &&
            !allowedRoles.delete.includes(role)
          ) {
            return res.status(403).json({
              success: false,
              message: "You do not have permission to delete this draft",
            });
          }

          await Blog.findByIdAndDelete(id);
          res
            .status(200)
            .json({ success: true, message: "Draft deleted successfully" });
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
