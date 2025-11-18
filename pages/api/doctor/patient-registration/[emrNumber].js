import dbConnect from "../../../../lib/database";
import jwt from "jsonwebtoken";
import PatientRegistration from "../../../../models/PatientRegistration";
import User from "../../../../models/Users";

// Helper: verify JWT and get user
async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId || decoded.id).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export default async function handler(req, res) {
  await dbConnect();

  // ✅ Extract EMR number from URL
  const { emrNumber } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  let user;
  try {
    user = await getUserFromToken(req);
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message });
  }

  try {
    const patient = await PatientRegistration.findOne({ emrNumber });

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Calculate total advance amount for this EMR number across all records
    const allPatientsWithSameEMR = await PatientRegistration.find({ emrNumber });
    const totalAdvanceAmount = allPatientsWithSameEMR.reduce((total, p) => {
      return total + (parseFloat(p.advance) || 0);
    }, 0);

    return res.status(200).json({ 
      success: true, 
      data: {
        ...patient.toObject(),
        totalAdvanceAmount: totalAdvanceAmount,
        advanceOnlyAmount: Math.max(0, Number(patient.advance) || 0)
      }
    });
  } catch (err) {
    console.error("GET by EMR error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

