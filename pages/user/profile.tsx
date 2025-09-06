import { useEffect, useState } from "react";
import axios from "axios";
import { 
  User, 
  Briefcase, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Settings, 
  Search,
  Filter,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Building,
  Languages,
  Award,
  Wrench,
  ChevronRight,
  Bell,
  Menu,
  X
} from "lucide-react";

const AppliedJobs = () => {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [commentsWithReplies, setCommentsWithReplies] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [appliedJobsLoading, setAppliedJobsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('jobs');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        const res = await axios.get("/api/users/comments-with-replies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setCommentsWithReplies(res.data.commentsWithReplies || []);
        } else {
          setCommentsError(res.data.error || "Failed to fetch comments");
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
        const response = await axios.get("/api/users/applied-jobs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppliedJobs(response.data || []);
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
        const response = await axios.get("/api/chat/user-chats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setChats((response.data.data || []).filter(chat => chat.prescriptionRequest));
        }
      } catch (error) {
        console.error("Failed to fetch chats", error);
      } finally {
        setChatsLoading(false);
      }
    };
    fetchChats();
  }, []);

  const navigationItems = [
    { id: 'jobs', label: 'Applied Jobs', icon: Briefcase, count: appliedJobs.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, count: null },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText, count: chats.length },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: commentsWithReplies.length },
  ];

  const renderJobsSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applied Jobs</h2>
          <p className="text-gray-600 mt-1">{appliedJobs.length} job applications</p>
        </div>
  );
};
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {appliedJobsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : appliedJobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No job applications yet</h3>
          <p className="text-gray-500">Start applying to jobs to see them here</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {appliedJobs.map((application) => {
            const job = application.jobId;
            const applicant = application.applicantInfo || {};
            if (!job) return null;
            
            return (
              <div key={application._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Building className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {job.jobTitle}
                            {!job.isActive && (
                              <span className="ml-3 text-sm text-red-600 font-normal bg-red-100 px-2 py-1 rounded-full">
                                Job Expired
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-4 text-gray-600">
                            <span className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {job.companyName}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{job.salary}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{job.jobType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">{job.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">{job.workingDays}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm">{job.jobTiming}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-900">Qualifications: </span>
                          <span className="text-gray-700">{job.qualification}</span>
                        </div>
                        
                        {job.languagesPreferred?.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Languages className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <span className="font-medium text-gray-900">Languages: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {job.languagesPreferred.map((lang, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    {lang}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {job.skills?.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Wrench className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <span className="font-medium text-gray-900">Skills: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {job.skills.map((skill, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {job.perks?.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Award className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <span className="font-medium text-gray-900">Perks: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {job.perks.map((perk, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    {perk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:w-80">
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Applied On:</span>
                          <p className="text-gray-700">{new Date(application.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="border-t pt-3 mt-3">
                          <h4 className="font-medium text-gray-900 mb-2">Applicant Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Name:</span> {applicant.name}</p>
                            <p><span className="font-medium">Email:</span> {applicant.email}</p>
                            <p><span className="font-medium">Phone:</span> {applicant.phone}</p>
                            <p><span className="font-medium">Role:</span> {applicant.role}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {job.description && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{job.description}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600 mt-1">Overview of your activity and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{appliedJobs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900">{chats.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Comments</p>
              <p className="text-2xl font-bold text-gray-900">{commentsWithReplies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Activity Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.min(100, (appliedJobs.length * 10 + chats.length * 5 + commentsWithReplies.length * 2))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Distribution</h3>
          <div className="space-y-3">
            {['pending', 'accepted', 'rejected'].map(status => {
              const count = appliedJobs.filter(app => app.status === status).length;
              const percentage = appliedJobs.length > 0 ? (count / appliedJobs.length) * 100 : 0;
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="capitalize font-medium text-gray-700">{status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'pending' ? 'bg-yellow-500' :
                          status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Applied to {appliedJobs.length} jobs this month</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Received {chats.length} prescriptions</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Made {commentsWithReplies.length} comments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrescriptionsSection = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Medical Prescriptions</h2>
        <p className="text-gray-600 mt-1">Your consultation history with doctors</p>
      </div>

      {chatsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions yet</h3>
          <p className="text-gray-500">Your medical consultations will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {chats.map((chat) => (
            <div key={chat._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Dr. {chat.doctor.name}</h3>
                        {chat.prescriptionRequest && (
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Health Issue:</span> {chat.prescriptionRequest.healthIssue}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">Status:</span>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                chat.prescriptionRequest.status === 'completed' ? 'bg-green-100 text-green-800' :
                                chat.prescriptionRequest.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {chat.prescriptionRequest.status}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Recent Messages
                      </h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {chat.messages.slice(-3).map((msg) => (
                          <div
                            key={msg._id}
                            className={`p-3 rounded-lg ${
                              msg.senderRole === "user" 
                                ? "bg-blue-500 text-white ml-8" 
                                : "bg-white border mr-8"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm">
                                {msg.senderRole === "user" ? "You" : `Dr. ${chat.doctor.name}`}
                              </span>
                              <span className={`text-xs opacity-75 ${
                                msg.senderRole === "user" ? "text-blue-100" : "text-gray-500"
                              }`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            {msg.messageType === "prescription" ? (
                              <div>
                                <div className="font-medium text-sm mb-1">📋 Prescription:</div>
                                <div className="bg-white bg-opacity-20 p-2 rounded border text-sm">
                                  {msg.prescription}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-48">
                    <button
                      onClick={() => window.location.href = `/user/chat/${chat.prescriptionRequest._id}`}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      Continue Chat
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCommentsSection = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Comments & Replies</h2>
        <p className="text-gray-600 mt-1">Track your blog interactions and responses</p>
      </div>

      {loadingComments ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : commentsError ? (
        <div className="text-center py-12 bg-red-50 rounded-xl">
          <MessageSquare className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Comments</h3>
          <p className="text-red-600">{commentsError}</p>
        </div>
      ) : commentsWithReplies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
          <p className="text-gray-500">Your blog comments and discussions will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {commentsWithReplies.map(({ blogId, blogTitle, blogAuthor, commentId, commentText, commentCreatedAt, replies }) => (
            <div key={commentId} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{blogTitle}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Commented on {new Date(commentCreatedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-gray-800">{commentText}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <h4 className="font-semibold text-gray-900">
                      Replies ({replies.length})
                    </h4>
                  </div>
                  
                  {replies.length === 0 ? (
                    <p className="italic text-gray-500 ml-6">No replies yet.</p>
                  ) : (
                    <div className="space-y-3 ml-6">
                      {replies.map(r => {
                        const isAuthorReply = blogAuthor && r.user && String(r.user) === String(blogAuthor._id || blogAuthor);
                        return (
                          <div
                            key={r._id}
                            className={`p-4 rounded-lg border-l-4 ${
                              isAuthorReply 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-300 bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`font-semibold ${isAuthorReply ? 'text-purple-600' : 'text-gray-900'}`}>
                                {r.username} 
                                {isAuthorReply && <span className="ml-2 text-purple-600 font-normal text-sm">(Author)</span>}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(r.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-800">{r.text}</p>
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

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'jobs':
        return renderJobsSection();
      case 'analytics':
        return renderAnalyticsSection();
      case 'prescriptions':
        return renderPrescriptionsSection();
      case 'comments':
        return renderCommentsSection();
      default:
        return renderJobsSection();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50