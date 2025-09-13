import mongoose from "mongoose";
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Treatment from "../../../models/Treatment";
import User from "../../../models/Users"; // ✅ Added
import { getUserFromReq, requireRole } from "./auth";
import csv from "csvtojson";
import multer from "multer";
import * as XLSX from "xlsx";

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Disable Next.js bodyParser → important for file upload
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const contentType = req.headers["content-type"] || "";
  const isMultipart = contentType.startsWith("multipart/form-data");

  let body = {};
  if (isMultipart) {
    // Bulk mode
    await runMiddleware(req, res, upload.single("file"));
    body = req.body;
  } else {
    // Manual mode
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
  }

  const me = await getUserFromReq(req);
  if (!me || !requireRole(me, ["clinic"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const mode = isMultipart ? body.mode || "bulk" : body.mode || "manual";

  try {
    // ---------------- Manual Mode ----------------
    if (mode === "manual") {
      const {
        name,
        phone,
        gender,
        age,
        treatments,
        source,
        customSource,
        offerTag,
        status,
        customStatus,
        notes,
        followUps,   // ✅ new
        assignedTo,
      } = body;

      if (!name || !phone || !gender || !source || !treatments?.length) {
        return res
          .status(400)
          .json({ success: false, message: "Required fields missing" });
      }

      // Validate treatments
      const validatedTreatments = await Promise.all(
        treatments.map(async (t) => {
          if (!t.treatment) throw new Error("Treatment field missing");
          const treatmentName = t.treatment; // FIX

          const tDoc = mongoose.Types.ObjectId.isValid(treatmentName)
            ? await Treatment.findById(treatmentName)
            : await Treatment.findOne({
                name: { $regex: `^${treatmentName}$`, $options: "i" },
              }); // case-insensitive

          if (!tDoc) throw new Error(`Treatment not found: ${t.treatment}`);

          // Validate subTreatment if provided
          if (t.subTreatment) {
            const subExists = tDoc.subcategories?.some(
              (s) => s.name === t.subTreatment
            );
            if (!subExists)
              throw new Error(`SubTreatment not found: ${t.subTreatment}`);
          }

          return { treatment: tDoc._id, subTreatment: t.subTreatment || null };
        })
      );

      const followUpsArray = followUps && followUps.length > 0
        ? followUps.map(f => ({ date: new Date(f.date), addedBy: me._id }))
        : followUpDate
        ? [{ date: new Date(followUpDate), addedBy: me._id }]
        : [];

      const notesArray = Array.isArray(notes)
        ? notes.map((n) => ({
            text: typeof n === "string" ? n : n.text,
            addedBy: me._id,
            createdAt: new Date(),
          }))
        : notes
        ? [{ text: notes, addedBy: me._id, createdAt: new Date() }]
        : [];

      // ✅ Resolve assignedTo (can be ObjectId(s) or names)
      let assignedArray = [];
      if (assignedTo) {
        const rawAssigned = Array.isArray(assignedTo)
          ? assignedTo
          : [assignedTo];

        assignedArray = await Promise.all(
          rawAssigned.map(async (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) {
              return {
                user: new mongoose.Types.ObjectId(val),
                assignedAt: new Date(),
              };
            } else {
              const u = await User.findOne({
                name: { $regex: `^${val}$`, $options: "i" },
              });
              if (!u) throw new Error(`Assigned user not found: ${val}`);
              return { user: u._id, assignedAt: new Date() };
            }
          })
        );
      }

      // Create lead
      const lead = await Lead.create({
        name,
        phone,
        gender,
        age,
        treatments: validatedTreatments,
        source,
        customSource,
        offerTag,
        status,
        customStatus,
        notes: notesArray,
        followUps: followUpsArray,
        assignedTo: assignedArray, // ✅ updated
      });
      return res.status(201).json({ success: true, lead });
    }

    // ---------------- Bulk Mode ----------------
    if (mode === "bulk") {
      if (!req.file)
        return res.status(400).json({ message: "File is required" });

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname.toLowerCase();
      let jsonArray = [];

      // Parse file
      if (fileName.endsWith(".csv")) {
        jsonArray = await csv().fromString(fileBuffer.toString());
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        jsonArray = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        return res
          .status(400)
          .json({ message: "Unsupported file format. Upload CSV or Excel." });
      }

      const leadsToInsert = await Promise.all(
        jsonArray.map(async (row) => {
          let {
            name,
            phone,
            gender,
            age,
            treatments,
            source,
            customSource,
            offerTag,
            status,
            customStatus,
            notes,
            followUpDate,   // ✅
            assignedTo,
          } = row;

          if (!name || !phone || !gender || !source || !treatments) {
            throw new Error(
              `Missing required fields in row: ${JSON.stringify(row)}`
            );
          }

          // Clean treatments string
          const cleanedTreatments = treatments
            .toString()
            .replace(/[\[\]'"]/g, "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

          const parsedTreatments = await Promise.all(
            cleanedTreatments.map(async (entry) => {
              const [treatmentNameRaw, subTreatmentRaw] = entry.split(":");

              const treatmentName = treatmentNameRaw?.normalize("NFKC").trim();
              const subTreatment = subTreatmentRaw?.normalize("NFKC").trim();

              if (!treatmentName)
                throw new Error(`Invalid treatment entry: ${entry}`);

              let tDoc;

              if (subTreatment) {
                tDoc = await Treatment.findOne({
                  "subcategories.name": {
                    $regex: `^${treatmentName}$`,
                    $options: "i",
                  },
                });
              } else {
                tDoc = await Treatment.findOne({
                  name: { $regex: `^${treatmentName}$`, $options: "i" },
                });
              }

              if (!tDoc) {
                tDoc = await Treatment.findOne({
                  "subcategories.name": {
                    $regex: `^${treatmentName}$`,
                    $options: "i",
                  },
                });
              }

              if (!tDoc)
                throw new Error(`Treatment not found: ${treatmentName}`);

              if (subTreatment) {
                const exists = tDoc.subcategories?.some(
                  (s) =>
                    s.name?.trim().toLowerCase() === subTreatment.toLowerCase()
                );
                if (!exists)
                  throw new Error(
                    `SubTreatment not found: ${subTreatment} for ${treatmentName}`
                  );
              }

              return {
                treatment: tDoc._id,
                subTreatment: subTreatment || null,
              };
            })
          );

          // ✅ Resolve assignedTo
          let assignedArray = [];
          if (assignedTo) {
            const rawAssigned = Array.isArray(assignedTo)
              ? assignedTo
              : assignedTo.toString().split(",").map((a) => a.trim());

            assignedArray = await Promise.all(
              rawAssigned.map(async (val) => {
                if (mongoose.Types.ObjectId.isValid(val)) {
                  return {
                    user: new mongoose.Types.ObjectId(val),
                    assignedAt: new Date(),
                  };
                } else {
                  const u = await User.findOne({
                    name: { $regex: `^${val}$`, $options: "i" },
                  });
                  if (!u) throw new Error(`Assigned user not found: ${val}`);
                  return { user: u._id, assignedAt: new Date() };
                }
              })
            );
          }

          return {
            name: name.trim(),
            phone: phone.toString().trim(),
            gender: gender.trim(),
            age: age ? Number(age) : undefined,
            treatments: parsedTreatments,
            source: source.trim(),
            customSource: customSource?.trim() || null,
            offerTag: offerTag?.trim() || null,
            status: status?.trim() || "New",
            customStatus: customStatus?.trim() || null,
            notes: notes
              ? [{ text: notes, addedBy: me._id, createdAt: new Date() }]
              : [],
            followUps: followUpDate
              ? [{ date: new Date(followUpDate), addedBy: me._id }]
              : [],
            assignedTo: assignedArray, // ✅ updated
          };
        })
      );

      const createdLeads = await Lead.insertMany(leadsToInsert);
      return res
        .status(201)
        .json({ success: true, count: createdLeads.length });
    }

    return res.status(400).json({ success: false, message: "Invalid mode" });
  } catch (err) {
    console.error("Error creating/uploading leads:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Internal Server Error",
      });
  }
}
