// pages/api/admin/delete-clinic.ts
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import Review from "../../../models/Review"; // import Review model
import Enquiry from "../../../models/Enquiry"; // import Enquiry model

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { clinicId } = req.body;

  if (!clinicId) {
    return res
      .status(400)
      .json({ success: false, message: "Clinic ID is required" });
  }

  try {
    // Find the clinic and populate its owner
    const clinic = await Clinic.findById(clinicId).populate('owner');
    
    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found" });
    }

    // Delete the clinic
    await Clinic.findByIdAndDelete(clinicId);

    // Delete associated user if their role is "clinic"
    if (clinic.owner && clinic.owner.role === "clinic") {
      await User.findByIdAndDelete(clinic.owner._id);
    }

    // Delete all reviews related to this clinic
    await Review.deleteMany({ clinicId });

    // Delete all enquiries related to this clinic
    await Enquiry.deleteMany({ clinicId });

    res.status(200).json({ 
      success: true, 
      message: "Clinic, associated user, reviews, and enquiries deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting clinic:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}
