import dbConnect from "../../../lib/database";
import Treatment from "../../../models/Treatment";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    const { mainTreatmentId, subTreatmentName, subTreatmentSlug } = req.body;

    if (!mainTreatmentId || !subTreatmentName) {
      return res
        .status(400)
        .json({
          message: "Main treatment ID and sub-treatment name are required",
        });
    }

    try {
      const mainTreatment = await Treatment.findById(mainTreatmentId);
      if (!mainTreatment) {
        return res.status(404).json({ message: "Main treatment not found" });
      }

      // Check if sub-treatment already exists
      const existingSubTreatment = mainTreatment.subcategories.find(
        (sub) => sub.name.toLowerCase() === subTreatmentName.toLowerCase()
      );

      if (existingSubTreatment) {
        return res
          .status(409)
          .json({
            message: "Sub-treatment already exists for this main treatment",
          });
      }

      // Add new sub-treatment
      mainTreatment.subcategories.push({
        name: subTreatmentName,
        slug:
          subTreatmentSlug ||
          subTreatmentName.toLowerCase().replace(/\s+/g, "-"),
      });

      await mainTreatment.save();

      return res.status(201).json({
        message: "Sub-treatment added successfully",
        treatment: mainTreatment,
      });
    } catch (error) {
      console.error("Error adding sub-treatment:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to add sub-treatment" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
