import mongoose from "mongoose";
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Treatment from "../../../models/Treatment";
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
  if (!me || !requireRole(me, ["lead"])) {
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
        notes,
      });

      return res.status(201).json({ success: true, lead });
    }

    // ---------------- Bulk Mode ----------------
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
          } = row;

          if (!name || !phone || !gender || !source || !treatments) {
            throw new Error(
              `Missing required fields in row: ${JSON.stringify(row)}`
            );
          }

          // Clean treatments string: remove brackets, quotes, extra spaces
          const cleanedTreatments = treatments
            .toString()
            .replace(/[\[\]'"]/g, "") // remove [], '', ""
            .split(",") // split by comma
            .map((t) => t.trim()) // trim spaces
            .filter(Boolean); // remove empty strings

          // Map treatments to DB ObjectIds
          // Map treatments to DB ObjectIds
          const parsedTreatments = await Promise.all(
            cleanedTreatments.map(async (entry) => {
              const [treatmentNameRaw, subTreatmentRaw] = entry.split(":");

              const treatmentName = treatmentNameRaw?.normalize("NFKC").trim();
              const subTreatment = subTreatmentRaw?.normalize("NFKC").trim();

              if (!treatmentName)
                throw new Error(`Invalid treatment entry: ${entry}`);

              let tDoc;

              if (subTreatment) {
                // Lookup by subcategory name
                tDoc = await Treatment.findOne({
                  "subcategories.name": {
                    $regex: `^${treatmentName}$`,
                    $options: "i",
                  },
                });
              } else {
                // Lookup by treatment name
                tDoc = await Treatment.findOne({
                  name: { $regex: `^${treatmentName}$`, $options: "i" },
                });
              }

              // If still not found, try subcategory fallback
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

              // Validate subTreatment exists
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
            notes: notes?.trim() || null,
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
