// /pages/api/admin/staff-treatments.js
import dbConnect from "../../../lib/database";
import StaffTreatment from "../../../models/StaffTreatment";

export default async function handler(req, res) {
  await dbConnect();

  try {
    // -------------------------------
    // GET → Fetch all staff treatments
    // -------------------------------
    if (req.method === "GET") {
      const treatments = await StaffTreatment.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: treatments });
    }

    // -------------------------------
    // POST → Add a new staff treatment
    // -------------------------------
    if (req.method === "POST") {
      const { package: pkg, treatment, packagePrice, treatmentPrice } = req.body;

      // Must provide at least one field
      if (!pkg?.trim() && !treatment?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Please provide at least one field (package or treatment)",
        });
      }

      // Build the object dynamically depending on input
      const dataToInsert = {};
      if (pkg?.trim()) dataToInsert.package = pkg.trim();
      if (treatment?.trim()) dataToInsert.treatment = treatment.trim(); 
      if (packagePrice !== undefined && packagePrice !== null && packagePrice !== "") {
        const parsedPackagePrice = Number(packagePrice);
        if (!Number.isNaN(parsedPackagePrice)) dataToInsert.packagePrice = parsedPackagePrice;
      }
      if (treatmentPrice !== undefined && treatmentPrice !== null && treatmentPrice !== "") {
        const parsedTreatmentPrice = Number(treatmentPrice);
        if (!Number.isNaN(parsedTreatmentPrice)) dataToInsert.treatmentPrice = parsedTreatmentPrice;
      }

      const newTreatment = await StaffTreatment.create(dataToInsert);

      return res.status(201).json({
        success: true,
        message: "Staff treatment added successfully",
        data: newTreatment,
      });
    }

    // -------------------------------
    // PUT → Update existing treatment
    // -------------------------------
    if (req.method === "PUT") {
      const { id, package: pkg, treatment, packagePrice, treatmentPrice } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: "Missing treatment ID" });
      }

      const dataToUpdate = {};
      if (pkg !== undefined) dataToUpdate.package = pkg?.trim() || "";
      if (treatment !== undefined) dataToUpdate.treatment = treatment?.trim() || "";
      if (packagePrice !== undefined) {
        if (packagePrice === null || packagePrice === "") {
          dataToUpdate.packagePrice = undefined;
        } else {
          const parsedPackagePrice = Number(packagePrice);
          if (!Number.isNaN(parsedPackagePrice)) dataToUpdate.packagePrice = parsedPackagePrice;
        }
      }
      if (treatmentPrice !== undefined) {
        if (treatmentPrice === null || treatmentPrice === "") {
          dataToUpdate.treatmentPrice = undefined;
        } else {
          const parsedTreatmentPrice = Number(treatmentPrice);
          if (!Number.isNaN(parsedTreatmentPrice)) dataToUpdate.treatmentPrice = parsedTreatmentPrice;
        }
      }

      const updated = await StaffTreatment.findByIdAndUpdate(id, dataToUpdate, { new: true });

      if (!updated) {
        return res.status(404).json({ success: false, message: "Treatment not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Treatment updated successfully",
        data: updated,
      });
    }

    // -------------------------------
    // DELETE → Remove a treatment
    // -------------------------------
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, message: "Missing treatment ID" });
      }

      const deleted = await StaffTreatment.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: "Treatment not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Treatment deleted successfully",
      });
    }

    // -------------------------------
    // Invalid method
    // -------------------------------
    return res.status(405).json({ success: false, message: "Method not allowed" });

  } catch (error) {
    console.error("❌ Error in staff-treatments API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
