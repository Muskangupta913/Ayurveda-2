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

      const invoiceData = {
        ...invoice,
        _id: invoice._id.toString(),
        userId: invoice.userId.toString(),
        invoicedDate: invoice.invoicedDate?.toISOString(),
        createdAt: invoice.createdAt?.toISOString(),
        updatedAt: invoice.updatedAt?.toISOString(),
        advanceClaimReleaseDate: invoice.advanceClaimReleaseDate?.toISOString(),
      };

      return res.status(200).json(invoiceData);
    }

    // -------------------------------
    // PUT: Update ONLY payment fields
    // -------------------------------
    if (req.method === "PUT") {
      const { amount, paid, advance, paymentMethod } = req.body;

      const updateFields = {};
      if (amount !== undefined) updateFields.amount = amount;
      if (paid !== undefined) updateFields.paid = paid;
      if (advance !== undefined) updateFields.advance = advance;
      if (paymentMethod !== undefined) updateFields.paymentMethod = paymentMethod;

      const updatedInvoice = await PatientRegistration.findByIdAndUpdate(
        id,
        updateFields,
        { new: true }
      ).lean();

      if (!updatedInvoice) return res.status(404).json({ message: "Invoice not found" });

      const updatedData = {
        ...updatedInvoice,
        _id: updatedInvoice._id.toString(),
        userId: updatedInvoice.userId.toString(),
        invoicedDate: updatedInvoice.invoicedDate?.toISOString(),
        createdAt: updatedInvoice.createdAt?.toISOString(),
        updatedAt: updatedInvoice.updatedAt?.toISOString(),
        advanceClaimReleaseDate: updatedInvoice.advanceClaimReleaseDate?.toISOString(),
      };

      return res.status(200).json({
        message: "Payment updated successfully",
        updatedInvoice: updatedData,
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
