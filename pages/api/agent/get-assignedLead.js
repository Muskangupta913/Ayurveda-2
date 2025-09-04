import dbConnect from '../../../lib/database';
import Lead from '../../../models/Lead';
import User from '../../../models/Users';
import { getUserFromReq, requireRole } from '../lead-ms/auth';   

export default async function(req,res){
    await dbConnect();

    if(req.method!=="GET"){
        return res.status(405).json({message:"Method not allowed"});
    }

    try{
    const user = await getUserFromReq(req);
          if (!requireRole(user, ["agent"])) {
            return res.status(403).json({ message: "Access denied" });
          }



          const leads=await Lead.find({assignedTo: user._id})
           .populate("treatments.treatment", "name")
          .populate("assignedTo","name email role");


          return res.status(200).json({
            success:true,
            totalAssigned:leads.length,
            leads,
          });
        } catch(error){
            console.error("Error fetching assigned leads:",error);
            return res.status(500).json({success:false, message:"Server Error" });
        }
        
    
}