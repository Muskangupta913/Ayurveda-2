import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
    await dbConnect();
    if(req.method !== "DELETE"){
        res.setHeader("Allow", ["DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try{
        const me = await getUserFromReq(req);

        if(!me || !requireRole(me, ["clinic"])){
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const{leadId}= req.body;

        if(!leadId){
            return res.status(400).json({success:false, message:"leadId is required"});

        }

        const deletedLead = await Lead.findByIdAndDelete(leadId);
        
        if(!deletedLead){
            return res.status(404).json({success:false, message:"Lead not found"});
        }

        return res.status(200).json({success:true, message:"Lead deleted successfully", lead:deletedLead});
    }catch(err){
        console.error("Error deleting Lead:", err);
        return res.status(500).json({success:false, message:"Internal Server Error"});

        

    }
}