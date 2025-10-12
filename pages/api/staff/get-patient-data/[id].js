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
        userId: invoice.userId?.toString(),
        invoicedDate: invoice.invoicedDate?.toISOString(),
        createdAt: invoice.createdAt?.toISOString(),
        updatedAt: invoice.updatedAt?.toISOString(),
        advanceClaimReleaseDate: invoice.advanceClaimReleaseDate?.toISOString(),
      });
    }

    // -------------------------------
    // PUT: Update Payment OR Advance Claim
    // -------------------------------
    if (req.method === "PUT") {
      const { updateType } = req.body; // 'payment' or 'advanceClaim'
      const invoice = await PatientRegistration.findById(id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      // -------------------------------
      // OPTION 1: Payment Update
      // -------------------------------
      if (updateType === "payment") {
        let { amount, paying, paymentMethod } = req.body;

        const currentAmount = invoice.amount ?? 0;
        const currentPaid = invoice.paid ?? 0;
        const currentAdvance = invoice.advance ?? 0;

        amount = amount !== undefined ? Number(amount) : currentAmount;
        paying = paying !== undefined ? Number(paying) : 0;
        paymentMethod = paymentMethod || invoice.paymentMethod || "";

        // New payment logic: paid = paying, advance = paying - amount (if paying > amount)
        const newPaid = paying;
        const newAdvance = Math.max(0, paying - amount);
        const finalPending = Math.max(0, amount - paying);

        invoice.amount = amount;
        invoice.paid = newPaid; // Update paid to paying amount
        invoice.advance = newAdvance; // Calculate advance automatically
        invoice.pending = finalPending;
        invoice.paymentMethod = paymentMethod;

        // Add to payment history with the new payment
        invoice.paymentHistory.push({
          amount,
          paid: newPaid,
          advance: newAdvance,
          pending: finalPending,
          paymentMethod,
          paying: paying, // Track the paying amount
          updatedAt: new Date(),
        });
      }

      // -------------------------------
      // OPTION 2: Status Update
      // -------------------------------
      else if (updateType === "status") {
        const { status, rejectionNote } = req.body;

        if (status !== undefined) invoice.status = status;
        if (rejectionNote !== undefined) invoice.rejectionNote = rejectionNote;

        // Add snapshot to payment history
        invoice.paymentHistory.push({
          amount: invoice.amount,
          paid: invoice.paid,
          advance: invoice.advance,
          pending: Math.max(0, invoice.amount - (invoice.paid + invoice.advance)),
          paymentMethod: invoice.paymentMethod,
          status: invoice.status,
          rejectionNote: invoice.rejectionNote,
          updatedAt: new Date(),
        });
      }

      // -------------------------------
      // OPTION 3: Advance Claim Status Update
      // -------------------------------
      else if (updateType === "advanceClaim") {
        const {
          advanceClaimStatus,
          advanceClaimCancellationRemark,
          advanceClaimReleaseDate,
          advanceClaimReleasedBy,
        } = req.body;

        if (advanceClaimStatus !== undefined)
          invoice.advanceClaimStatus = advanceClaimStatus;

        if (advanceClaimCancellationRemark !== undefined)
          invoice.advanceClaimCancellationRemark = advanceClaimCancellationRemark;

        if (advanceClaimReleaseDate !== undefined)
          invoice.advanceClaimReleaseDate = advanceClaimReleaseDate
            ? new Date(advanceClaimReleaseDate)
            : null;

        if (advanceClaimReleasedBy !== undefined)
          invoice.advanceClaimReleasedBy = advanceClaimReleasedBy;

        // Add snapshot to payment history
        invoice.paymentHistory.push({
          amount: invoice.amount,
          paid: invoice.paid,
          advance: invoice.advance,
          pending: Math.max(0, invoice.amount - (invoice.paid + invoice.advance)),
          paymentMethod: invoice.paymentMethod,
          advanceClaimStatus: invoice.advanceClaimStatus,
          advanceClaimCancellationRemark: invoice.advanceClaimCancellationRemark,
          updatedAt: new Date(),
        });
      } 
      
      // -------------------------------
      // OPTION 4: Status Update
      // -------------------------------
      else if (updateType === "status") {
        const { status, rejectionNote } = req.body;

        if (status !== undefined) {
          invoice.status = status;
        }

        if (rejectionNote !== undefined) {
          // Only set rejection note if status is Rejected, otherwise clear it
          if (status === "Rejected") {
            invoice.rejectionNote = rejectionNote;
          } else {
            invoice.rejectionNote = null;
          }
        }

        // Add snapshot to payment history
        invoice.paymentHistory.push({
          amount: invoice.amount,
          paid: invoice.paid,
          advance: invoice.advance,
          pending: Math.max(0, invoice.amount - (invoice.paid + invoice.advance)),
          paymentMethod: invoice.paymentMethod,
          status: invoice.status,
          rejectionNote: invoice.rejectionNote,
          updatedAt: new Date(),
        });
      }
      
      else {
        return res.status(400).json({ message: "Invalid update type" });
      }

      await invoice.save();

      return res.status(200).json({
        message:
          updateType === "payment"
            ? "Payment updated successfully"
            : updateType === "status"
            ? "Status updated successfully"
            : "Advance claim status updated successfully",
        updatedInvoice: {
          ...invoice.toObject(),
          _id: invoice._id.toString(),
          userId: invoice.userId?.toString(),
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
