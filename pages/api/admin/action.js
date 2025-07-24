import dbConnect from "../../../lib/database"; 
import User from "../../../models/Users";
import DoctorProfile from "../../../models/DoctorProfile";
import Review from "../../../models/Review"; // ✅ Import Review model

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { userId, action } = req.body;

  if (!userId || !["approve", "decline", "delete"].includes(action)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    if (action === "delete") {
      // Delete DoctorProfile
      const doctorProfile = await DoctorProfile.findOneAndDelete({ user: userId });

      // Delete User
      await User.findByIdAndDelete(userId);

      // Delete all reviews associated with this doctor
      if (doctorProfile) {
        await Review.deleteMany({ doctorId: doctorProfile._id }); // ✅ Cleanup reviews
      }

      return res.status(200).json({ message: "Doctor and related reviews deleted successfully" });
    }

    const updateFields = {
      isApproved: action === "approve",
      declined: action === "decline",
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: `Doctor ${action === "approve" ? "approved" : "declined"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
