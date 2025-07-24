import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import axios from "axios";

export default async function handler(req, res) {
  await dbConnect();
  const { lat, lng, service } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and longitude required" });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  const locationInfo = await checkLocationInfo(latitude, longitude);

  const query = {
    isApproved: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: locationInfo.isInternational ? 200000 : 100000,
      },
    },
  };

  if (service) {
    query.$or = [
      { treatments: { $regex: new RegExp(service, "i") } },
      { name: { $regex: new RegExp(service, "i") } },
    ];
  }

  try {
    let clinics = await Clinic.find(query)
      .select(
        "name address treatments servicesName location pricing timings photos phone rating reviews verified"
      )
      .limit(locationInfo.isInternational ? 100 : 50)
      .lean();

    // ✅ Add photo path handling (local + live)
    clinics = clinics.map((clinic) => ({
      ...clinic,
      photos: clinic.photos?.map((photo) => {
        if (!photo) return null;

        if (photo.startsWith("http")) return photo; // Already full URL
        if (photo.startsWith("/uploads/clinic/")) return photo; // Local dev

        const filename = photo.split("uploads/clinic/").pop();
        return `https://ayurvedanearme.ae/uploads/clinic/${filename}`;
      }) || [],
    }));

    // Dubai prioritization logic
    if (locationInfo.isDubai) {
      let ramacareClinic = clinics.find(
        (clinic) =>
          clinic.name.toLowerCase().includes("ramacare") ||
          clinic.name.toLowerCase().includes("rama care") ||
          clinic.name.toLowerCase().includes("ramacare polyclinic") ||
          clinic.name.toLowerCase().includes("rama care polyclinic")
      );

      if (!ramacareClinic) {
        ramacareClinic = await Clinic.findOne({
          name: {
            $regex:
              /ramacare|rama care|ramacare polyclinic|rama care polyclinic/i,
          },
          address: { $regex: /dubai/i },
        }).lean();
      }

      if (ramacareClinic) {
        ramacareClinic.photos = ramacareClinic.photos?.map((photo) => {
          if (!photo) return null;

          if (photo.startsWith("http")) return photo;
          if (photo.startsWith("/uploads/clinic/")) return photo;

          const filename = photo.split("uploads/clinic/").pop();
          return `https://ayurvedanearme.ae/uploads/clinic/${filename}`;
        }) || [];

        clinics = clinics.filter(
          (clinic) =>
            !(
              clinic.name.toLowerCase().includes("ramacare") ||
              clinic.name.toLowerCase().includes("rama care") ||
              clinic.name.toLowerCase().includes("ramacare polyclinic") ||
              clinic.name.toLowerCase().includes("rama care polyclinic")
            )
        );

        ramacareClinic.isDubaiPrioritized = true;
        clinics = [ramacareClinic, ...clinics];
      }
    }

    clinics = clinics.slice(0, locationInfo.isInternational ? 30 : 20);

    res.status(200).json({ success: true, clinics });
  } catch (error) {
    console.error("Error fetching clinics:", error);
    res
      .status(500)
      .json({ message: "Error fetching clinics", error: error.message });
  }
}

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
