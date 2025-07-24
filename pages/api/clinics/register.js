import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dbConnect from '../../../lib/database';
import Clinic from '../../../models/Clinic';
import User from '../../../models/Users';
import Treatment from '../../../models/Treatment';

// Disable default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Create directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Multer Setup to store in public/uploads/clinic/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads/clinic');
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// Create multer middleware
const uploadMiddleware = upload.fields([
  { name: 'clinicPhoto', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
]);

// Promisify multer middleware
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Main API handler function
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to database
    await dbConnect();

    // Ensure upload directory exists before processing
    const uploadDir = path.join(process.cwd(), 'public/uploads/clinic');
    ensureDirectoryExists(uploadDir);

    // Run multer middleware
    await runMiddleware(req, res, uploadMiddleware);

    const {
      email,
      name,
      address,
      pricing,
      timings,
      treatments,
      latitude,
      longitude,
      newTreatment,
    } = req.body;

    // 🔥 FIX: Find user with specific role 'clinic'
    // This ensures we only match clinic users, not doctor users with same email
    const user = await User.findOne({ email, role: 'clinic' });
    if (!user) {
      return res.status(404).json({ message: 'Clinic user not found with this email' });
    }

    // Additional validation: ensure the user is actually a clinic role
    if (user.role !== 'clinic') {
      return res.status(400).json({ message: 'User is not registered as a clinic' });
    }

    // Ensure treatments is an array
    let finalTreatments = Array.isArray(treatments) ? treatments : [treatments];

    // Add new treatment if provided
    if (newTreatment) {
      const exists = await Treatment.findOne({ treatment_name: newTreatment });
      if (!exists) {
        await Treatment.create({ treatment_name: newTreatment });
      }
      finalTreatments.push(newTreatment);
    }

    // Get uploaded file paths (normalize path separators)
    const clinicPhotoPath = req.files?.['clinicPhoto']?.[0]?.path
      ? req.files['clinicPhoto'][0].path.replace('public', '').replace(/\\/g, '/')
      : '';
    
    const licensePath = req.files?.['licenseDocument']?.[0]?.path
      ? req.files['licenseDocument'][0].path.replace('public', '').replace(/\\/g, '/')
      : '';

    // Create clinic
    const clinic = await Clinic.create({
      owner: user._id,
      name,
      address,
      treatments: finalTreatments,
      pricing,
      timings,
      photos: clinicPhotoPath ? [clinicPhotoPath] : [],
      licenseDocumentUrl: licensePath || null,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    return res.status(200).json({ message: 'Clinic saved', clinic });

  } catch (err) {
    console.error('❌ Clinic Save Error:', err);
    return res.status(500).json({ 
      message: 'Error saving clinic', 
      error: err.message || 'Internal server error' 
    });
  }
}