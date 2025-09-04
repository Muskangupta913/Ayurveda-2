import { useEffect, useState } from "react";
import { Bell, Briefcase, MessageCircle, FileText, User, Calendar, MapPin, Clock, Building, Languages, Award, CheckCircle, XCircle, AlertCircle, Search, Filter, ChevronDown } from "lucide-react";
import NotificationBell from "../../components/NotificationBell";

const AppliedJobs = () => {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [commentsWithReplies, setCommentsWithReplies] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [appliedJobsLoading, setAppliedJobsLoading] = useState(false);
  
  // New state for section management
  const [activeSection, setActiveSection] = useState('notifications');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      setLoadingComments(true);
      setCommentsError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setCommentsError("You must be logged in to see your comments.");
        setLoadingComments(false);
        return;
      }
      try {
        const res = await fetch("/api/users/comments-with-replies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setCommentsWithReplies(data.commentsWithReplies || []);
        } else {
          setCommentsError(data.error || "Failed to fetch comments");
        }
      } catch (err) {
        setCommentsError("Network error while fetching comments");
      } finally {
        setLoadingComments(false);
      }
    }
    fetchComments();
  }, []);

  // Fetch applied jobs
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setAppliedJobsLoading(true);
      try {
        const response = await fetch("/api/users/applied-jobs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setAppliedJobs(data || []);
      } catch (error) {
        console.error("Failed to fetch applied jobs", error);
      } finally {
        setAppliedJobsLoading(false);
      }
    };
    fetchAppliedJobs();
  }, []);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setChatsLoading(true);
      try {
        const response = await fetch("/api/chat/user-chats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setChats((data.data || []).filter(chat => chat.prescriptionRequest));
        }
      } catch (error) {
        console.error("Failed to fetch chats", error);
      } finally {
        setChatsLoading(false);
      }
    };
    fetchChats();
  }, []);

  const sections = [
    { id: 'notifications', name: 'Notifications', icon: Bell, count: 0 },
    { id: 'jobs', name: 'Applied Jobs', icon: Briefcase, count: appliedJobs.length },
    { id: 'analytics', name: 'Blog Analytics', icon: MessageCircle, count: commentsWithReplies.length },
    { id: 'prescriptions', name: 'Prescriptions', icon: FileText, count: chats.length }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      reviewed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const filteredJobs = appliedJobs.filter(application => {
    const job = application.jobId;
    if (!job) return false;
    
    const matchesSearch = job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || application.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <NotificationBell />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No new notifications</h3>
        <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Applied Jobs</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {appliedJobsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Start applying to jobs to see them here'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredJobs.map((application) => {
            const job = application.jobId;
            const applicant = application.applicantInfo || {};
            if (!job) return null;
            
            return (
              <div key={application._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Building className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {job.jobTitle}
                            {!job.isActive && (
                              <span className="ml-2 text-sm text-red-600 font-normal">(Expired)</span>
                            )}
                          </h3>
                          <p className="text-gray-600 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            {job.companyName}
                            <span className="text-gray-400">•</span>
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      {getStatusBadge(application.status)}
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        Applied {new Date(application.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Salary:</span> {job.salary}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Type:</span> {job.jobType}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Department:</span> {job.department}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Working Days:</span> {job.workingDays}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Timing:</span> {job.jobTiming}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Languages className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Languages:</span> {job.languagesPreferred.join(", ")}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Perks & Benefits</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.perks.map((perk, index) => (
                            <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                              {perk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Applicant Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="font-medium">Name:</span> {applicant.name}</div>
                        <div><span className="font-medium">Email:</span> {applicant.email}</div>
                        <div><span className="font-medium">Phone:</span> {applicant.phone}</div>
                        <div><span className="font-medium">Role:</span> {applicant.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Blog Analytics</h2>
      
      {loadingComments ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : commentsError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-medium text-red-900">Error loading comments</h3>
              <p className="text-red-700 text-sm">{commentsError}</p>
            </div>
          </div>
        </div>
      ) : commentsWithReplies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
          <p className="text-gray-500">Start engaging with blog posts to see your activity here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {commentsWithReplies.map(({ blogId, blogTitle, blogAuthor, commentId, commentText, commentCreatedAt, replies }) => (
            <div key={commentId} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{blogTitle}</h3>
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    {new Date(commentCreatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{commentText}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Replies ({replies.length})
                  </h4>
                  
                  {replies.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No replies yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {replies.map(r => {
                        const isAuthorReply = blogAuthor && r.user && String(r.user) === String(blogAuthor._id || blogAuthor);
                        return (
                          <div
                            key={r._id}
                            className={`p-4 rounded-lg border-l-4 ${
                              isAuthorReply ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-medium ${isAuthorReply ? 'text-blue-700' : 'text-gray-900'}`}>
                                {r.username}
                                {isAuthorReply && (
                                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    Author
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(r.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{r.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPrescriptions = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Medical Prescriptions</h2>
      
      {chatsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : chats.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions yet</h3>
          <p className="text-gray-500">Your medical consultations and prescriptions will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {chats.map((chat) => (
            <div key={chat._id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Dr. {chat.doctor.name}</h3>
                      {chat.prescriptionRequest ? (
                        <div className="space-y-1">
                          <p className="text-gray-600">
                            <span className="font-medium">Health Issue:</span> {chat.prescriptionRequest.healthIssue}
                          </p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(chat.prescriptionRequest.status)}
                          </div>
                        </div>
                      ) : (
                        <p className="text-red-600 text-sm">No prescription request yet</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = `/user/chat/${chat.prescriptionRequest._id}`}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Continue Chat
                  </button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Recent Messages
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {chat.messages.slice(-3).map((msg) => (
                      <div
                        key={msg._id}
                        className={`p-4 rounded-lg ${
                          msg.senderRole === "user" 
                            ? "bg-blue-50 border border-blue-200" 
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm text-gray-900">
                            {msg.senderRole === "user" ? "You" : `Dr. ${chat.doctor.name}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {msg.messageType === "prescription" ? (
                          <div>
                            <div className="font-medium text-sm text-green-700 mb-2 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Prescription:
                            </div>
                            <div className="bg-white p-3 rounded border text-sm">
                              {msg.prescription}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 text-sm">{msg.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.name}
                  {section.count > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {section.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'notifications' && renderNotifications()}
        {activeSection === 'jobs' && renderJobs()}
        {activeSection === 'analytics' && renderAnalytics()}
        {activeSection === 'prescriptions' && renderPrescriptions()}
      </div>
    </div>
  );
};

export default AppliedJobs;