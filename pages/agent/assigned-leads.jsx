import { useEffect, useState } from "react";
import axios from "axios";
import ClinicLayout from "../../components/AgentLayout";
import withClinicAuth from "../../components/withAgentAuth";
import FilterAssignedLead from "../../components/Filter-assigned-lead";
import WhatsAppChat from "../../components/WhatsAppChat";

const AssignedLeadsPage = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [error, setError] = useState("");
  const [followUpsdate, setFollowUpsdate] = useState({});
  const [token, setToken] = useState(null);
  const [saving, setSaving] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("agentToken");
    if (t) setToken(t);
    else {
      setError("Unauthorized: No token found");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchLeads = async () => {
      try {
        const res = await axios.get("/api/agent/get-assignedLead", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setLeads(res.data.leads);
          setTotalAssigned(res.data.totalAssigned);
        } else {
          setError(res.data.message || "Failed to fetch leads");
        }
      } catch (err) {
        console.error("Error fetching leads:", err);
        setError("Something went wrong while fetching leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [token]);

  const handleFollowUpdateChange = (leadId, value) => {
    setFollowUpsdate((prev) => ({ ...prev, [leadId]: value }));
  };

  const saveFollowUp = async (leadId) => {
    if (!token) {
      alert("Unauthorized");
      return;
    }

    if (!followUpsdate[leadId]) {
      alert("Please select a follow-up date before saving.");
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [leadId]: true }));

      const payload = {
        leadId,
        nextFollowUp: followUpsdate[leadId]
      };

      const res = await axios.put("/api/agent/update-note", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        alert("Follow-up date updated ✅");

        setLeads((prevLeads) =>
          prevLeads.map((lead) => {
            if (lead._id === leadId) {
              const updatedFollowUps = [
                ...(lead.nextFollowUps || []),
                { date: new Date(followUpsdate[leadId]).toISOString() },
              ];
              return { ...lead, nextFollowUps: updatedFollowUps };
            }
            return lead;
          })
        );

        setFollowUpsdate((prev) => ({ ...prev, [leadId]: "" }));
      } else {
        alert(res.data.message || "Failed to update follow-up date");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while saving follow-up date");
    } finally {
      setSaving((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
      contacted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
      qualified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
      converted: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
      lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
    };
    return configs[status?.toLowerCase()] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
  };

  const getFollowUpBadge = (followUpStatus) => {
    if (followUpStatus === 'past') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          OVERDUE
        </span>
      );
    }
    if (followUpStatus === 'today') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          DUE TODAY
        </span>
      );
    }
    return null;
  };

  const formatPhoneNumber = (phone) => {
    const trimmed = phone.replace(/\s+/g, "");
    if (trimmed.startsWith("+")) return trimmed;
    return `+91${trimmed}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
        
        {/* Enhanced Header Section */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Assigned Leads</h1>
                  <p className="text-sm text-gray-600 mt-0.5">Manage your lead pipeline efficiently</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-5 py-3 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total</p>
                      <p className="text-2xl font-bold text-blue-900">{totalAssigned}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-2 px-4 py-2.5 font-semibold rounded-xl border-2 shadow-sm transition-all ${
                    filterOpen 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>

            {/* Filter Section */}
            {filterOpen && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                  <h3 className="text-base font-bold text-gray-900">Advanced Filters</h3>
                </div>
                <FilterAssignedLead
                  onResults={(filteredLeads) => {
                    setLeads(filteredLeads);
                    setTotalAssigned(filteredLeads.length);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-gray-700 font-semibold text-lg">Loading leads...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-red-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">Unable to Load Leads</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && leads.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Leads Found</h3>
              <p className="text-gray-600 leading-relaxed">You don't have any leads assigned at the moment. New leads will appear here once they're assigned to you.</p>
            </div>
          </div>
        )}

        {/* Leads Cards */}
        {!loading && !error && leads.length > 0 && (
          <div className="space-y-3">
            {leads.map((lead) => {
              const statusConfig = getStatusConfig(lead.status);
              const latestFollowUp = lead.nextFollowUps?.length > 0
                ? new Date(lead.nextFollowUps[lead.nextFollowUps.length - 1].date).toLocaleString()
                : "Not Set";

              const cardBorderClass = lead.followUpStatus === "past"
                ? "border-l-4 border-l-red-500 shadow-red-100"
                : lead.followUpStatus === "today"
                ? "border-l-4 border-l-green-500 shadow-green-100"
                : "border-l-4 border-l-gray-200";

              return (
                <div
                  key={lead._id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 ${cardBorderClass}`}
                >
                  <div className="p-5">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                      
                      {/* Lead Info - Enhanced */}
                      <div className="xl:col-span-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-blue-100">
                              {lead.name.charAt(0).toUpperCase()}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                                <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 truncate leading-tight">{lead.name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                {lead.gender}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                {lead.age} yrs
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact & Status - Enhanced */}
                      <div className="xl:col-span-3 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-sm text-gray-900">{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-10">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-xs text-gray-600">{lead.source}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <span className={`w-2 h-2 ${statusConfig.dot} rounded-full`}></span>
                            {lead.status.toUpperCase()}
                          </span>
                          {getFollowUpBadge(lead.followUpStatus)}
                        </div>
                        {lead.assignedTo && lead.assignedTo.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 pl-10 pt-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium text-gray-700">{lead.assignedTo[0].user?.name || "Unassigned"}</span>
                          </div>
                        )}
                      </div>

                      {/* Treatment - Keep existing design */}
                      <div className="xl:col-span-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Treatments
                          </div>
                        {lead.treatments && lead.treatments.length > 0 ? (
                            lead.treatments.map((t, idx) => (
                              <div key={idx} className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-2.5 border border-indigo-100 shadow-sm">
                                <div className="text-sm font-bold text-gray-900">{t.treatment?.name}</div>
                                {t.subTreatment && (
                                  <div className="text-xs text-gray-600 mt-0.5 font-medium">{t.subTreatment}</div>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 italic">No treatments</span>
                          )}
                        </div>
                      </div>

                      {/* Follow-up - Enhanced */}
                      <div className="xl:col-span-3">
                        <div className="space-y-2.5">
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Latest
                            </div>
                            <div className="text-sm font-bold text-gray-900">{latestFollowUp}</div>
                          </div>
                          
                          <div className="space-y-2">
                            <input
                              type="datetime-local"
                              value={followUpsdate[lead._id] || ""}
                              onChange={(e) => handleFollowUpdateChange(lead._id, e.target.value)}
                              className="w-full px-3 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            />
                            
                            <button
                              onClick={() => saveFollowUp(lead._id)}
                              disabled={saving[lead._id] || !followUpsdate[lead._id]}
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              {saving[lead._id] ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  SAVING...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  SCHEDULE
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Actions - Enhanced */}
                      <div className="xl:col-span-1 flex items-center justify-center">
                        <button
                          onClick={() => {
                            setActiveLead(lead);
                            setChatOpen(true);
                          }}
                          className="group relative w-full xl:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-5 h-5">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.1 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"></path>
                           <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.556 4.1 1.522 5.805L0 24l6.372-1.492C8.063 23.444 10.01 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.898 0-3.694-.495-5.293-1.36l-.379-.226-3.789.887.888-3.685-.246-.381C2.662 15.693 2.182 13.904 2.182 12 2.182 6.08 6.08 2.182 12 2.182S21.818 6.08 21.818 12 17.92 21.818 12 21.818z"></path>
                          </svg>
                          <span className="hidden lg:inline text-sm">CHAT</span>
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WhatsApp Chat Modal */}
        {chatOpen && activeLead && (
          <WhatsAppChat
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            leadName={activeLead.name}
            phoneNumber={formatPhoneNumber(activeLead.phone)}
          />
        )}
      </div>
    </div>
  );
};

AssignedLeadsPage.getLayout = (page) => <ClinicLayout>{page}</ClinicLayout>;

export default withClinicAuth(AssignedLeadsPage);
