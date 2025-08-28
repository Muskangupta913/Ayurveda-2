import dbConnect from '../../../lib/database';
import Lead from '../../../models/Lead';
import { getUserFromReq, requireRole } from './auth';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  await dbConnect();

 const me = await getUserFromReq(req);
     if (!me) {
       return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
     }
 
     // Check role
     if (!requireRole(me, ['lead'])) {
       return res.status(403).json({ success: false, message: 'Forbidden: Only lead admins can perform this action' });
     }

  let { name, phone, gender, age, treatments, source, customSource, offerTag, status, customStatus, notes } = req.body;

  if (!name || !phone || !gender || !source || !treatments?.length) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  // Handle "Other" options
  // Don't overwrite enums
if (source === "Other" && customSource) {
  // just keep source = "Other"
}

if (status === "Other" && customStatus) {
  // just keep status = "Other"
}
console.log("Incoming status:", status, "Incoming source:", source);


  try {
    const lead = await Lead.create({
     name,
    phone,
    gender,
    age,
    treatments,
    source,            // stays as "Other"
    customSource,      // saves "linkedin"
    offerTag,
    status,            // stays as "Other"
    customStatus,      // saves "referall"
    notes,
    });

    console.log("Incoming status:", status, "Incoming source:", source);

    return res.status(201).json({ success: true, lead });
  } catch (err) {
    console.error("Error creating lead:", err);
    return res.status(500).json({ success: false, message: 'Error creating lead' });
  }
}
