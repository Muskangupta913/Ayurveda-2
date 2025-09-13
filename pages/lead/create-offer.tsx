import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import CreateOfferModal from "../../components/CreateOfferModal";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
  async function fetchOffers() {
    try {
      const token = localStorage.getItem("clinicToken"); // get token
      const res = await fetch("/api/lead-ms/get-create-offer", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // send token
        },
      });
      const data = await res.json();
      setOffers(data.offers || []); // extract offers array
    } catch (err) {
      console.error("Error fetching offers:", err);
      setOffers([]);
    }
  }
  fetchOffers();
}, []);


  const handleOfferCreated = (newOffer: any) => {
    setOffers((prev) => [newOffer, ...prev]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Offers</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Create Offer
        </button>
      </div>

      {/* Offers List */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-700">Available Offers</h2>
        </div>
        <div className="p-4">
          {offers.length === 0 ? (
            <p className="text-gray-500">No offers created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Value</th>
                    <th className="p-3 text-left">Valid Till</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer: any) => (
                    <tr
                      key={offer._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-3">{offer.title}</td>
                      <td className="p-3">{offer.type}</td>
                      <td className="p-3">
                        {offer.type === "percentage"
                          ? `${offer.value}%`
                          : `₹${offer.value}`}
                      </td>
                      <td className="p-3">
                        {new Date(offer.endsAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            offer.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {offer.status}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2">
                        <button className="flex items-center px-2 py-1 text-sm rounded bg-blue-100 text-blue-700 hover:bg-blue-200">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="flex items-center px-2 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <CreateOfferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleOfferCreated}
      />
    </div>
  );
}
