// File: pages/api/clinics/treatments.ts or app/api/clinics/treatments/route.ts

import mongoose from 'mongoose';
import dbConnect from '../../../lib/database';
import Treatment from '../../../models/Treatment';

export default async function handler(req, res) {
  console.log('🚀 API Route called:', req.method);
  console.log('🔗 Request URL:', req.url);
  
  try {
    console.log('📡 Attempting database connection...');
    await dbConnect();
    console.log('✅ Database connected successfully');
    
    // Enhanced connection debugging
    console.log('🏢 Connection details:');
    console.log('- Database name:', mongoose.connection.db.databaseName);
    console.log('- Connection state:', mongoose.connection.readyState);
    console.log('- Host:', mongoose.connection.host);
    console.log('- Port:', mongoose.connection.port);
    console.log('- Connection string used:', process.env.MONGODB_URI?.replace(/\/\/.*:.*@/, '//***:***@'));
    
    // Verify we're connected to the correct database
    if (mongoose.connection.db.databaseName !== 'nextapp') {
      console.error('❌ Connected to wrong database!');
      console.error('Expected: nextapp, Actual:', mongoose.connection.db.databaseName);
      return res.status(500).json({
        success: false,
        message: 'Connected to wrong database',
        expected: 'nextapp',
        actual: mongoose.connection.db.databaseName
      });
    }
    
  } catch (dbError) {
    console.error('❌ Database connection failed:', dbError);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: dbError.message
    });
  }

  if (req.method === 'GET') {
    try {
      console.log('📋 Fetching treatments from database...');
      
      // Method 1: Using Mongoose model
      console.log('🔎 Method 1: Mongoose model query...');
      const treatmentsViaModel = await Treatment.find({}).lean();
      console.log('📊 Treatments found via Mongoose model:', treatmentsViaModel.length);
      
      // Method 2: Raw MongoDB collection query
      console.log('🔍 Method 2: Raw MongoDB collection query...');
      const treatmentsCollection = mongoose.connection.db.collection('treatments');
      const treatmentsViaRaw = await treatmentsCollection.find({}).toArray();
      console.log('📊 Treatments found via raw query:', treatmentsViaRaw.length);
      
      // Method 3: Count documents
      console.log('🔢 Method 3: Document count...');
      const countViaModel = await Treatment.countDocuments();
      const countViaRaw = await treatmentsCollection.countDocuments();
      console.log('📊 Count via Mongoose model:', countViaModel);
      console.log('📊 Count via raw collection:', countViaRaw);
      
      // Enhanced debugging: Show all documents with their IDs
      console.log('🔍 All treatment documents with IDs:');
      treatmentsViaRaw.forEach((doc, index) => {
        console.log(`${index + 1}. ID: ${doc._id}, Name: "${doc.treatment_name}"`);
      });
      
      // Check for any documents with empty or undefined treatment_name
      const docsWithoutName = treatmentsViaRaw.filter(doc => !doc.treatment_name);
      if (docsWithoutName.length > 0) {
        console.log('⚠️ Documents without treatment_name:', docsWithoutName);
      }
      
      // Check for duplicate treatment names
      const nameCount = {};
      treatmentsViaRaw.forEach(doc => {
        if (doc.treatment_name) {
          nameCount[doc.treatment_name] = (nameCount[doc.treatment_name] || 0) + 1;
        }
      });
      
      const duplicates = Object.entries(nameCount).filter(([count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('⚠️ Duplicate treatment names found:', duplicates);
      }
      
      // Get treatment names, filtering out any with empty names
      const treatmentNames = treatmentsViaRaw
        .filter(treatment => treatment.treatment_name && treatment.treatment_name.trim())
        .map(treatment => treatment.treatment_name.trim());
      
      console.log('📋 Final treatment names:', treatmentNames);
      
      // Enhanced response with comprehensive debug info
      const response = {
        success: true,
        treatments: treatmentNames,
        debug: {
          databaseName: mongoose.connection.db.databaseName,
          collectionName: Treatment.collection.name,
          countsMatch: countViaModel === countViaRaw,
          counts: {
            mongooseModel: countViaModel,
            rawCollection: countViaRaw,
            filteredNames: treatmentNames.length
          },
          connectionDetails: {
            state: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port
          },
          dataConsistency: {
            modelVsRaw: treatmentsViaModel.length === treatmentsViaRaw.length,
            duplicatesFound: duplicates.length > 0,
            emptyNamesFound: docsWithoutName.length > 0
          },
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('✅ Sending successful response with debug info');
      res.status(200).json(response);
      
    } catch (error) {
      console.error('❌ Error fetching treatments:');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch treatments',
        error: error.message,
        debug: {
          databaseName: mongoose.connection.db?.databaseName,
          timestamp: new Date().toISOString()
        }
      });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      console.log('📝 POST request body:', req.body);
      const { treatment_name } = req.body;

      if (!treatment_name || typeof treatment_name !== 'string' || !treatment_name.trim()) {
        console.log('❌ Invalid treatment name provided:', treatment_name);
        return res.status(400).json({
          success: false,
          message: 'Treatment name is required and must be a non-empty string'
        });
      }

      const trimmedName = treatment_name.trim();
      console.log('🔍 Checking for existing treatment:', trimmedName);
      
      const existingTreatment = await Treatment.findOne({
        treatment_name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      
      console.log('🔍 Existing treatment found:', !!existingTreatment);

      if (existingTreatment) {
        console.log('⚠️ Treatment already exists with ID:', existingTreatment._id);
        return res.status(409).json({
          success: false,
          message: 'Treatment already exists',
          existingId: existingTreatment._id
        });
      }

      console.log('➕ Creating new treatment...');
      const newTreatment = new Treatment({
        treatment_name: trimmedName
      });

      console.log('💾 Saving new treatment to database...');
      const savedTreatment = await newTreatment.save();
      console.log('✅ Treatment saved successfully with ID:', savedTreatment._id);

      // Verify the save worked by fetching it back
      const verifyTreatment = await Treatment.findById(savedTreatment._id);
      console.log('🔍 Verification successful:', !!verifyTreatment);

      // Also verify via raw collection query
      const rawVerify = await mongoose.connection.db.collection('treatments')
        .findOne({ _id: savedTreatment._id });
      console.log('🔍 Raw verification successful:', !!rawVerify);

      const response = {
        success: true,
        message: 'Treatment added successfully',
        treatment: {
          id: savedTreatment._id,
          name: savedTreatment.treatment_name,
          created: savedTreatment.createdAt || new Date()
        },
        debug: {
          verificationPassed: !!verifyTreatment && !!rawVerify,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('✅ Sending POST response');
      res.status(201).json(response);
      
    } catch (error) {
      console.error('❌ Error adding treatment:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      if (error.code === 11000) {
        console.log('⚠️ Duplicate key error detected');
        res.status(409).json({
          success: false,
          message: 'Treatment already exists (duplicate key)',
          debug: {
            errorCode: error.code,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to add treatment',
          error: error.message,
          debug: {
            errorCode: error.code,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  } 
  
  else if (req.method === 'DELETE') {
    // Optional: Add a cleanup endpoint for debugging
    try {
      const { action } = req.query;
      
      if (action === 'cleanup-duplicates') {
        console.log('🧹 Cleaning up duplicate treatments...');
        
        const allTreatments = await Treatment.find({}).sort({ _id: 1 });
        const seen = new Set();
        const duplicates = [];
        
        for (const treatment of allTreatments) {
          const normalizedName = treatment.treatment_name?.toLowerCase().trim();
          if (seen.has(normalizedName)) {
            duplicates.push(treatment._id);
          } else {
            seen.add(normalizedName);
          }
        }
        
        if (duplicates.length > 0) {
          const deleteResult = await Treatment.deleteMany({ _id: { $in: duplicates } });
          console.log('🗑️ Deleted duplicates:', deleteResult.deletedCount);
          
          return res.status(200).json({
            success: true,
            message: `Cleaned up ${deleteResult.deletedCount} duplicate treatments`,
            duplicatesRemoved: duplicates
          });
        } else {
          return res.status(200).json({
            success: true,
            message: 'No duplicates found'
          });
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid DELETE action. Use ?action=cleanup-duplicates'
      });
      
    } catch (error) {
      console.error('❌ Error in DELETE operation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform DELETE operation',
        error: error.message
      });
    }
  }
  
  else {
    console.log('❌ Method not allowed:', req.method);
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }
}