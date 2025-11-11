// pages/lead/offers.tsx
import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import CreateOfferModal from "../../components/CreateOfferModal";
import AgentLayout from "../../components/AgentLayout"; // ✅ agent layout
import withAgentAuth from "../../components/withAgentAuth"; // ✅ agent auth

function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [editingOfferData, setEditingOfferData] = useState(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("agentToken") : "";

  // Fetch all offers
  const fetchOffers = async () => {
    if (!token) return;
    try {
      const token = localStorage.getItem("agentToken");
      const res = await fetch("/api/lead-ms/get-create-offer", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (err) {
      console.error("Error fetching offers:", err);
      setOffers([]);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [token]);

  const openEditModal = async (offerId) => {
    if (!token) return alert("Not authorized!");
    setEditingOfferId(offerId);
    setModalOpen(true);

    try {
      const token = localStorage.getItem("agentToken");
      const res = await fetch(`/api/lead-ms/update-offer?id=${offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEditingOfferData(data.offer);
      } else {
        alert(data.message || "Failed to fetch offer");
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      setModalOpen(false);
    }
  };

  const handleOfferSaved = (offer, isUpdate) => {
    if (isUpdate) {
      setOffers((prev) => prev.map((o) => (o._id === offer._id ? offer : o)));
    } else {
      setOffers((prev) => [offer, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    if (!token) return alert("Not authorized!");

    try {
      const token = localStorage.getItem("agentToken");
      const res = await fetch(`/api/lead-ms/delete-create-offer?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOffers((prev) => prev.filter((o) => o._id !== id));
      } else {
        alert(data.message || "Failed to delete offer");
      }
    } catch (err) {
      console.error("Error deleting offer:", err);
      alert("Server error");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Offers</h1>
        <button
          onClick={() => {
            setEditingOfferId(null);
            setEditingOfferData(null);
            setModalOpen(true);
          }}
          className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Create Offer
        </button>
      </div>

      {/* Offers Table */}
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
                  {offers.map((offer) => (
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
                        {offer.endsAt
                          ? new Date(offer.endsAt).toLocaleDateString()
                          : "-"}
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
                        <button
                          onClick={() => openEditModal(offer._id)}
                          className="flex items-center px-2 py-1 text-sm rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(offer._id)}
                          className="flex items-center px-2 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                        >
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
        onClose={() => {
          setModalOpen(false);
          setEditingOfferId(null);
          setEditingOfferData(null);
        }}
        onCreated={(offer) => handleOfferSaved(offer, !!editingOfferId)}
        token={token || ""}
        offer={editingOfferData}
        mode={editingOfferId ? "update" : "create"}
      />
    </div>
  );
}

// Wrap page in AgentLayout
OffersPage.getLayout = (page) => <AgentLayout>{page}</AgentLayout>;

// Protect page
const ProtectedOffersPage = withAgentAuth(OffersPage);
ProtectedOffersPage.getLayout = OffersPage.getLayout;

export default ProtectedOffersPage;
