import { useEffect, useState } from "react";
import axios from "axios";
import NotificationBell from '../../components/NotificationBell';

const AppliedJobs = () => {
  const [appliedJobs, setAppliedJobs] = useState([]);
   const [commentsWithReplies, setCommentsWithReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

   useEffect(() => {
    async function fetchComments() {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to see your comments.");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get("/api/users/comments-with-replies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setCommentsWithReplies(res.data.commentsWithReplies);
        } else {
          setError(res.data.error || "Failed to fetch comments");
        }
      } catch (err) {
        setError("Network error while fetching comments");
      } finally {
        setLoading(false);
      }
    }
    fetchComments();
  }, []);

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get("/api/users/applied-jobs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAppliedJobs(response.data);
      } catch (error) {
        console.error("Failed to fetch applied jobs", error);
      }
    };

    fetchAppliedJobs();
  }, []);
   if (loading) return <p>Loading your comments...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (commentsWithReplies.length === 0) return <p>No comments found.</p>;

  return (
  <>
    <div className="p-4">
              <NotificationBell />
      <h2 className="text-xl font-bold mb-4">Jobs You've Applied To</h2>

      {appliedJobs.length === 0 ? (
  <p>No applications yet.</p>
) : (
  appliedJobs.map((application) => {
    const job = application.jobId;
    const applicant = application.applicantInfo || {};
    if (!job) {
      return (
        <div key={application._id} className="border p-4 mb-6 rounded shadow-md bg-white">
          <p className="text-red-600">This job posting is no longer available.</p>
        </div>
      );
    }


          return (
            <div
              key={application._id}
              className="border p-4 mb-6 rounded shadow-md bg-white"
            >
              {/* Job Information */}
              <h3 className="text-2xl font-semibold mb-1">
                {job.jobTitle}{" "}
                {!job.isActive && (
                  <span className="text-sm text-red-600 font-normal">(Job Expired)</span>
                )}
              </h3>

              <p className="text-gray-700 mb-2">
                {job.companyName} • {job.location}
              </p>

              <p className="text-sm mb-2"><strong>Salary:</strong> {job.salary}</p>
              <p className="text-sm mb-2"><strong>Job Type:</strong> {job.jobType}</p>
              <p className="text-sm mb-2"><strong>Qualification:</strong> {job.qualification}</p>
              <p className="text-sm mb-2"><strong>Department:</strong> {job.department}</p>
              <p className="text-sm mb-2"><strong>Working Days:</strong> {job.workingDays}</p>
              <p className="text-sm mb-2"><strong>Timing:</strong> {job.jobTiming}</p>
              <p className="text-sm mb-2"><strong>Establishment:</strong> {job.establishment}</p>
              <p className="text-sm mb-2"><strong>Languages Preferred:</strong> {job.languagesPreferred.join(", ")}</p>
              <p className="text-sm mb-2"><strong>Perks:</strong> {job.perks.join(", ")}</p>
              <p className="text-sm mb-2"><strong>Skills:</strong> {job.skills.join(", ")}</p>

              <p className="text-sm text-gray-600 mt-2"><strong>Description:</strong> {job.description}</p>

              {/* Application Info */}
              <div className="mt-4 bg-gray-50 p-3 rounded">
                <p className="text-sm"><strong>Status:</strong> {application.status}</p>
                <p className="text-sm"><strong>Applied On:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Applicant Info */}
              <div className="mt-4 border-t pt-3 text-sm text-gray-700">
                <p><strong>Applicant:</strong> {applicant.name}</p>
                <p><strong>Email:</strong> {applicant.email}</p>
                <p><strong>Phone:</strong> {applicant.phone}</p>
                <p><strong>Role:</strong> {applicant.role}</p>
              </div>
            </div>
          );
        })
      )}
    </div>

    <div className="max-w-3xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-4">Your Comments and Replies</h1>

      {commentsWithReplies.map(({ blogId, blogTitle, blogAuthor, commentId, commentText, commentCreatedAt, replies }) => (
        <div key={commentId} className="border p-4 mb-6 rounded shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-1">{blogTitle}</h2>
          <p className="text-sm text-gray-600 mb-2">Commented on: {new Date(commentCreatedAt).toLocaleString()}</p>
          <p className="mb-3">{commentText}</p>

          <div className="ml-4">
            <h3 className="font-semibold mb-1">Replies:</h3>
            {replies.length === 0 && <p className="italic text-gray-500">No replies yet.</p>}

            {replies.map(r => {
              const isAuthorReply = blogAuthor && r.user && String(r.user) === String(blogAuthor._id || blogAuthor);
              return (
                <div
                  key={r._id}
                  className={`ml-4 p-3 mb-2 border-l-4 ${isAuthorReply ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                >
                  <p className={`font-semibold ${isAuthorReply ? 'text-blue-600' : ''}`}>
                    {r.username} {isAuthorReply && <span className="text-blue-600 font-normal">(author)</span>}
                  </p>
                  <p>{r.text}</p>
                  <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </>
);
}
export default AppliedJobs;
