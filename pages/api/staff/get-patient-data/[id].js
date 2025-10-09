// pages/api/staff/get-patient-data/[id].js
import dbConnect from "../../../../lib/database";
import PatientRegistration from "../../../../models/PatientRegistration";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    // -------------------------------
    // GET: Fetch Invoice + Patient Info
    // -------------------------------
    if (req.method === "GET") {
      const invoice = await PatientRegistration.findById(id).lean();
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      return res.status(200).json({
        ...invoice,
        _id: invoice._id.toString(),
        userId: invoice.userId.toString(),
        invoicedDate: invoice.invoicedDate?.toISOString(),
        createdAt: invoice.createdAt?.toISOString(),
        updatedAt: invoice.updatedAt?.toISOString(),
        advanceClaimReleaseDate: invoice.advanceClaimReleaseDate?.toISOString(),
      });
    }

    // -------------------------------
    // PUT: Update Payment & Track History
    // -------------------------------
    if (req.method === "PUT") {
      const { amount, paid, advance, paymentMethod } = req.body;

      const invoice = await PatientRegistration.findById(id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      // Backup old payment details
      invoice.paymentHistory.push({
        amount: invoice.amount ?? 0,
        paid: invoice.paid ?? 0,
        advance: invoice.advance ?? 0,
        pending: invoice.pending ?? 0,
        paymentMethod: invoice.paymentMethod || "",
        updatedAt: new Date(),
      });

      // Update payment fields
      if (amount !== undefined) invoice.amount = amount;
      if (paid !== undefined) invoice.paid = paid;
      if (advance !== undefined) invoice.advance = advance;
      if (paymentMethod !== undefined) invoice.paymentMethod = paymentMethod;

      await invoice.save();

      return res.status(200).json({
        message: "Payment updated successfully",
        updatedInvoice: {
          ...invoice.toObject(),
          _id: invoice._id.toString(),
          userId: invoice.userId.toString(),
          invoicedDate: invoice.invoicedDate?.toISOString(),
          createdAt: invoice.createdAt?.toISOString(),
          updatedAt: invoice.updatedAt?.toISOString(),
          advanceClaimReleaseDate: invoice.advanceClaimReleaseDate?.toISOString(),
        },
      });
    }

    // -------------------------------
    // Method Not Allowed
    // -------------------------------
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
