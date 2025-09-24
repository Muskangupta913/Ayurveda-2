// // pages/find-clinic.tsx
// import { useState } from 'react';
// import axios from 'axios';
// import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
// import withClinicAuth from '../../components/withClinicAuth';  
// import type { NextPageWithLayout } from '../_app'
// import ClinicLayout from '../../components/ClinicLayout';

// function FindClinic() {
//   const [query, setQuery] = useState('');
//   const [suggestions, setSuggestions] = useState<string[]>([]);
//   const [selectedService, setSelectedService] = useState('');
//   interface Clinic {
//     name: string;
//     address: string;
//     treatments: string[];
//     location: {
//       coordinates: [number, number];
//     };
//     [key: string]: unknown;
//   }
//   const [clinics, setClinics] = useState<Clinic[]>([]);
//   const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
//   const [manualPlace, setManualPlace] = useState('');

//   const fetchSuggestions = async (q: string) => {
//     const res = await axios.get('/api/clinics/search?q=' + q);
//     setSuggestions(res.data.treatments);
//   };

//   const fetchClinics = async (lat: number, lng: number) => {
//     const res = await axios.get('/api/clinics/nearby', {
//       params: { lat, lng, service: selectedService }
//     });
//     setClinics(res.data.clinics);
//   };

//   const locateMe = () => {
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const { latitude, longitude } = pos.coords;
//         setCoords({ lat: latitude, lng: longitude });
//         fetchClinics(latitude, longitude);
//       },
//       () => alert('Geolocation permission denied')
//     );
//   };

//   const searchByPlace = async () => {
//     const res = await axios.get('/api/clinics/geocode', { params: { place: manualPlace } });
//     setCoords({ lat: res.data.lat, lng: res.data.lng });
//     fetchClinics(res.data.lat, res.data.lng);
//   };

//   return (
//     <div className="p-6 space-y-6 max-w-4xl mx-auto">
//       <h1 className="text-2xl font-bold">Find Clinics Near You</h1>

//       <div>
//         <input
//           type="text"
//           placeholder="Search a treatment e.g. physiotherapy"
//           value={query}
//           onChange={(e) => {
//             setQuery(e.target.value);
//             fetchSuggestions(e.target.value);
//           }}
//           className="p-3 border rounded w-full"
//         />
//         {suggestions.length > 0 && (
//           <ul className="bg-white border mt-1">
//             {suggestions.map((s, i) => (
//               <li key={i} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => {
//                 setSelectedService(s);
//                 setQuery(s);
//                 setSuggestions([]);
//               }}>
//                 {s}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       <div className="flex gap-4 items-center">
//         <button onClick={locateMe} className="px-4 py-2 bg-blue-600 text-white rounded">
//           📍 Find Nearby
//         </button>

//         <div className="flex gap-2 items-center">
//           <input
//             placeholder="or enter a location"
//             value={manualPlace}
//             onChange={(e) => setManualPlace(e.target.value)}
//             className="border p-2 rounded"
//           />
//           <button onClick={searchByPlace} className="px-4 py-2 bg-green-600 text-white rounded">
//             Search
//           </button>
//         </div>
//       </div>

//       {coords && (
//         <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
//           <GoogleMap
//             center={coords}
//             zoom={13}
//             mapContainerStyle={{ width: '100%', height: '400px' }}
//           >
//             {clinics.map((clinic, idx) => (
//               <Marker
//                 key={idx}
//                 position={{
//                   lat: clinic.location.coordinates[1],
//                   lng: clinic.location.coordinates[0]
//                 }}
//               />
//             ))}
//           </GoogleMap>
//         </LoadScript>
//       )}

//       <div>
//         <h2 className="text-xl font-semibold mt-6 mb-2">Results:</h2>
//         {clinics.length === 0 ? (
//           <p>No clinics found</p>
//         ) : (
//           clinics.map((c, i) => (
//             <div key={i} className="p-4 border rounded mb-2">
//               <h3 className="text-lg font-bold">{c.name}</h3>
//               <p>{c.address}</p>
//               <p><strong>Services:</strong> {c.treatments.join(', ')}</p>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// FindClinic.getLayout = function PageLayout(page: React.ReactNode) {
//   return <ClinicLayout>{page}</ClinicLayout>;
// };

// // ✅ Apply HOC and assign correct type
// const ProtectedDashboard: NextPageWithLayout = withClinicAuth(FindClinic);

// // ✅ Reassign layout (TS-safe now)
// ProtectedDashboard.getLayout = FindClinic.getLayout;

// export default ProtectedDashboard;

