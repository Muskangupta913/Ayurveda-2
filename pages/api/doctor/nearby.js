// pages/api/doctors/nearby.js

import dbConnect from "../../../lib/database";
import DoctorProfile from "../../../models/DoctorProfile";
import "../../../models/Users"; // Register the User model
import axios from "axios";

export default async function handler(req, res) {
  await dbConnect();
  const { lat, lng, service } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and longitude required" });
  }

  try {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // ✅ Get comprehensive location info
    const locationInfo = await checkLocationInfo(latitude, longitude);

    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          // ✅ Use location info for search radius
          $maxDistance: locationInfo.isInternational ? 200000 : 100000,
        },
      },
    };

    if (service) {
      query.$or = [
        { treatment: { $regex: new RegExp(service, "i") } },
        { "user.name": { $regex: new RegExp(service, "i") } },
        { specialization: { $regex: new RegExp(service, "i") } },
      ];
    }

    let doctors = await DoctorProfile.find(query)
      .populate("user", "name email phone profileImage isApproved")
      .select(
        "specialization degree experience address location user rating reviews verified consultationFee clinicContact timeSlots treatment photos"
      )
      // ✅ Use location info for result limits
      .limit(locationInfo.isInternational ? 100 : 50)
      .lean();

    // ✅ Only include approved doctors
    doctors = doctors.filter((doc) => doc.user?.isApproved === true);

    // Helper function to get base URL
    const getBaseUrl = () => {
      if (process.env.NODE_ENV === "production") {
        return "https://ayurvedanearme.ae";
      }
      return "http://localhost:3000";
    };

    // ✅ Convert profileImage & photos to full URL
    doctors = doctors.map((doc) => {
      const user = doc.user || {};
      let profileImage = user.profileImage;

      // ✅ Process profileImage
      if (profileImage?.startsWith("http")) {
        // Already full URL - leave as is
      } else if (profileImage?.startsWith("/uploads/")) {
        // Relative path - convert to full URL
        profileImage = `${getBaseUrl()}${profileImage}`;
      } else if (profileImage) {
        // Handle filename or partial path
        const filename = profileImage.includes('uploads/clinic/') 
          ? profileImage.split('uploads/clinic/').pop()
          : profileImage;
        profileImage = `${getBaseUrl()}/uploads/clinic/${filename}`;
      }

      // ✅ Process photos array - FIXED LOGIC
      const photos = (doc.photos || []).map((photo) => {
        if (!photo) return null;

        // Case 1: Already full URL
        if (photo.startsWith("http")) return photo;

        // Case 2: Relative path (starts with /)
        if (photo.startsWith("/uploads/")) {
          return `${getBaseUrl()}${photo}`;
        }

        // Case 3: Handle filename or partial path
        // Since doctors save to /uploads/clinic/, we need to handle this correctly
        let filename = photo;
        if (photo.includes('uploads/clinic/')) {
          filename = photo.split('uploads/clinic/').pop();
        } else if (photo.includes('uploads/doctor/')) {
          // Legacy path handling if any exist
          filename = photo.split('uploads/doctor/').pop();
        }
        
        return `${getBaseUrl()}/uploads/clinic/${filename}`;
      }).filter(Boolean); // Remove null values

      // ✅ Process resumeUrl if present
      let resumeUrl = doc.resumeUrl;
      if (resumeUrl && !resumeUrl.startsWith("http")) {
        if (resumeUrl.startsWith("/uploads/")) {
          resumeUrl = `${getBaseUrl()}${resumeUrl}`;
        } else {
          const filename = resumeUrl.includes('uploads/clinic/') 
            ? resumeUrl.split('uploads/clinic/').pop()
            : resumeUrl;
          resumeUrl = `${getBaseUrl()}/uploads/clinic/${filename}`;
        }
      }

      return {
        ...doc,
        user: {
          ...user,
          profileImage,
        },
        photos,
        resumeUrl,
      };
    });

    // ✅ Dubai-specific prioritization logic
    if (locationInfo.isDubai) {
      let prioritizedDoctors = doctors.filter(doc => doc.verified === true);
      let otherDoctors = doctors.filter(doc => doc.verified !== true);
      
      doctors = [...prioritizedDoctors, ...otherDoctors];
    }

    // ✅ Apply final result count based on location
    doctors = doctors.slice(0, locationInfo.isInternational ? 30 : 20);

    res.status(200).json({ 
      success: true, 
      doctors,
      locationInfo // Optional: include location info in response
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Error fetching doctors", error: error.message });
  }
}

// ✅ Updated function to match clinics API - returns comprehensive location info
async function checkLocationInfo(lat, lng) {
  try {
    const dubaiBounds = {
      north: 25.5,
      south: 24.8,
      east: 55.6,
      west: 54.8,
    };

    const isWithinDubaiBounds =
      lat >= dubaiBounds.south &&
      lat <= dubaiBounds.north &&
      lng >= dubaiBounds.west &&
      lng <= dubaiBounds.east;

    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            latlng: `${lat},${lng}`,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        }
      );

      const results = response.data.results;
      if (results && results.length > 0) {
        const addressComponents = results[0].address_components;

        const countryComponent = addressComponents.find((component) =>
          component.types.includes("country")
        );
        const country = countryComponent ? countryComponent.long_name : "Unknown";

        const isDubai =
          addressComponents.some(
            (component) =>
              component.long_name.toLowerCase().includes("dubai") ||
              component.short_name.toLowerCase().includes("dubai") ||
              component.long_name.toLowerCase().includes("دبي") ||
              component.long_name.toLowerCase().includes("uae") ||
              component.long_name.toLowerCase().includes("united arab emirates")
          ) || isWithinDubaiBounds;

        return {
          isDubai,
          isInternational: country !== "India",
          country,
        };
      }
    } catch (geocodeError) {
      console.log(
        "Geocoding error, falling back to bounds check:",
        geocodeError.message
      );
      return {
        isDubai: isWithinDubaiBounds,
        isInternational: false,
        country: "Unknown",
      };
    }

    return {
      isDubai: isWithinDubaiBounds,
      isInternational: false,
      country: "Unknown",
    };
  } catch (error) {
    console.error("Error checking location:", error);
    return {
      isDubai: false,
      isInternational: false,
      country: "Unknown",
    };
  }
}