import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Calendar,
  MapPin,
  Award,
  Trash2,
  CheckCircle,
  Edit,
} from "lucide-react";
import { jobsAPI } from "../api/jobs";
import { jobApplicationsAPI } from "../api/jobApplications";
import JobApplicationForm from "../components/JobApplicationForm";
import FreelancerCard from "../components/FreelancerCard";

const EXPERIENCE_MAP = {
  entry: "Entry Level",
  intermediate: "Intermediate",
  expert: "Expert",
};

const LOCATION_MAP = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

export default function JobDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userApplication, setUserApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [applications, setApplications] = useState([]);

  // For full freelancer details modal (same pattern as ProjectDetail)
  const [freelancerModalOpen, setFreelancerModalOpen] = useState(false);
  const [freelancerForModal, setFreelancerForModal] = useState(null);

  useEffect(() => {
    loadJob();

    if (user?.role === "freelancer") {
      checkUserApplication();
    } else {
      setCheckingApplication(false);
    }

    if (user?.role === "client") {
      loadApplicationsForClient();
    }
  }, [id, user]);

  useEffect(() => {
    if (user?.role === "freelancer" && userApplication) {
      const interval = setInterval(() => {
        checkUserApplication();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user, userApplication]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const res = await jobsAPI.get(id);
      setJob(res.data);
    } catch {
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const checkUserApplication = async () => {
    try {
      setCheckingApplication(true);
      const response = await jobApplicationsAPI.list();
      const list = response.data.results || response.data || [];
      const parsedId = parseInt(id, 10);

      const myApp =
        list.find(
          (app) =>
            (app.job === parsedId || app.job_id === parsedId) &&
            (app.applicant === user?.id ||
              app.freelancer === user?.id ||
              app.freelancer_id === user?.id ||
              app.user === user?.id)
        ) || null;

      setUserApplication(myApp);
    } catch (err) {
      console.error("Failed to check application:", err);
      setUserApplication(null);
    } finally {
      setCheckingApplication(false);
    }
  };

const loadApplicationsForClient = async () => {
  try {
    const res = await jobApplicationsAPI.list({ job: id });

    // Handle BOTH shapes:
    // 1) { results: [...] }
    // 2) [ ... ]
    let list = [];

    if (Array.isArray(res.data?.results)) {
      list = res.data.results;
    } else if (Array.isArray(res.data)) {
      list = res.data;
    }

    setApplications(list);
  } catch (err) {
    console.error("Failed to load applications for client:", err);
    setApplications([]);
  }
};


  const handleDeleteJob = async () => {
    if (!window.confirm("Delete this job? This cannot be undone.")) return;

    try {
      await jobsAPI.remove(id);
      navigate("/dashboard/client");
    } catch {
      alert("Failed to delete job");
    }
  };

  const handleSubmitApplication = async (formData) => {
    try {
      setSubmitting(true);
      await jobApplicationsAPI.create(formData);
      setShowApplicationModal(false);
      await checkUserApplication();
      alert("Application submitted successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const approveApplication = async (appId) => {
    if (!window.confirm("Accept this application?")) return;

    try {
      await jobApplicationsAPI.accept(appId);
      alert("Application accepted successfully!");
      loadApplicationsForClient();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not approve application");
    }
  };

  const rejectApplication = async (appId) => {
    if (!window.confirm("Reject this application?")) return;

    try {
      await jobApplicationsAPI.reject(appId);
      alert("Application rejected.");
      loadApplicationsForClient();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not reject application");
    }
  };

  if (loading || checkingApplication) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-3 text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 mb-3">{error || "Job not found"}</p>
        <button
          onClick={() => navigate("/jobs")}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow p-8 rounded-xl">
          {/* HEADER */}
          <h1 className="text-4xl font-bold">{job.title}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold capitalize">
              {job.job_type === "hourly" ? "Hourly" : "Fixed Price"}
            </span>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
              {EXPERIENCE_MAP[job.experience_level]}
            </span>
            {job.location_type && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold capitalize">
                {LOCATION_MAP[job.location_type]}
              </span>
            )}
          </div>

          {/* DELETE / EDIT */}
          {user?.id === job.client && (
            <div className="flex gap-2 mt-4">
              {applications.length === 0 && (
                <button
                  onClick={() => navigate(`/jobs/${job.id}/edit`)}
                  className="px-4 py-2 bg-blue-50 border border-blue-300 text-blue-700 rounded-lg flex items-center gap-2 hover:bg-blue-100"
                >
                  <Edit size={16} /> Edit Job
                </button>
              )}

              <button
                onClick={handleDeleteJob}
                className="px-4 py-2 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-center gap-2 hover:bg-red-100"
              >
                <Trash2 size={16} /> Delete Job
              </button>
            </div>
          )}

          {/* DESCRIPTION */}
          <p className="mt-6 text-gray-700 text-lg leading-relaxed">
            {job.description}
          </p>

          {/* INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 bg-gray-50 p-6 rounded-lg">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <IndianRupee size={18} className="text-green-600" />
                <span className="text-sm font-medium">Payment</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {job.job_type === "hourly" && job.hourly_min && job.hourly_max
                  ? `₹${job.hourly_min} - ₹${job.hourly_max}/hr`
                  : job.job_type === "fixed" && job.fixed_amount
                  ? `₹${job.fixed_amount}`
                  : "Not specified"}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Award size={18} />
                <span className="text-sm font-medium">Experience</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {EXPERIENCE_MAP[job.experience_level]}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <MapPin size={18} />
                <span className="text-sm font-medium">Location</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {LOCATION_MAP[job.location_type] || job.location_type}
              </span>
            </div>
          </div>

          {/* POSTED INFO */}
          <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-4 mt-6">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                by <strong>{job.client_name || "Client"}</strong>
              </span>
            </div>
          </div>

          {/* FILE ATTACHMENTS (JOB) */}
          {Array.isArray(job.file_attachments) &&
            job.file_attachments.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                <ul className="space-y-2">
                  {job.file_attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex justify-between items-center border rounded-lg px-4 py-3 hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium">
                        {att.original_name || "Attachment"}
                      </span>
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        download
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* FREELANCER APPLY STATUS */}
          {user?.role === "freelancer" && (
            <div className="mt-10 border-t pt-6">
              {!userApplication && job.status === "open" ? (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg shadow hover:bg-purple-700 font-semibold"
                >
                  Apply for this Job
                </button>
              ) : userApplication ? (
                <div
                  className={`border-2 rounded-xl p-6 ${
                    userApplication.status === "accepted"
                      ? "bg-green-50 border-green-200"
                      : userApplication.status === "rejected"
                      ? "bg-red-50 border-red-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle
                      className={
                        userApplication.status === "accepted"
                          ? "text-green-600"
                          : userApplication.status === "rejected"
                          ? "text-red-600"
                          : "text-blue-600"
                      }
                      size={28}
                    />
                    <span
                      className={`font-bold text-lg ${
                        userApplication.status === "accepted"
                          ? "text-green-900"
                          : userApplication.status === "rejected"
                          ? "text-red-900"
                          : "text-blue-900"
                      }`}
                    >
                      {userApplication.status === "accepted" &&
                        "Application Accepted"}
                      {userApplication.status === "rejected" &&
                        "Application Rejected"}
                      {userApplication.status === "pending" &&
                        "Application Submitted"}
                    </span>
                  </div>

                  <p className="text-base text-gray-700 mb-3">
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {userApplication.status}
                    </span>
                  </p>

                  <p className="text-blue-600 text-sm mb-3">
                    Your application has been sent to the client. You'll be
                    notified when they respond.
                  </p>

                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => navigate("/jobs")}
                      className="font-medium text-purple-600 hover:underline"
                    >
                      Browse Other Jobs →
                    </button>

                    <button
                      onClick={() => checkUserApplication()}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Freelancer viewing closed job */}
          {user?.role === "freelancer" && job.status !== "open" && (
            <div className="mt-6 border-t pt-6">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 font-semibold text-base mb-2">
                  This job is no longer accepting applications
                </p>
                <button
                  onClick={() => navigate("/jobs")}
                  className="text-yellow-600 hover:underline font-medium"
                >
                  Browse Other Jobs →
                </button>
              </div>
            </div>
          )}

          {/* Client viewing job managed by another client */}
          {user?.role === "client" && user.id !== job.client && (
            <div className="mt-6 border-t pt-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-700">
                  This job posting is managed by another client.
                </p>
              </div>
            </div>
          )}

          {/* CLIENT: APPLICATION LIST (only for job owner) */}
          {user?.role === "client" && user.id === job.client && (
            <section className="mt-10 border-t pt-6">
              <h2 className="text-xl font-bold mb-4 text-purple-800">
                Applications Received ({applications.length})
              </h2>

              {applications.length === 0 && (
                <p className="text-gray-500">No applications received yet.</p>
              )}

              <ul className="space-y-6">
                {applications.map((app) => {
                  const freelancer = app.freelancer || {};

                  const rating =
                    typeof freelancer.rating_avg === "number"
                      ? freelancer.rating_avg.toFixed(1)
                      : typeof freelancer.rating === "number"
                      ? freelancer.rating.toFixed(1)
                      : "0.0";

                  const projectsDone =
                    typeof freelancer.projects_completed === "number"
                      ? freelancer.projects_completed
                      : freelancer.projectsCount || 0;

                  const freelancerId = freelancer.id || app.freelancer_id;

                  return (
                    <li
                      className="bg-white border border-purple-200 rounded-xl p-6 shadow"
                      key={app.id}
                    >
                      {/* FREELANCER INFO */}
                      <div className="flex gap-4 items-start">
                        <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl text-purple-600 font-bold overflow-hidden">
                          {freelancer.avatar ? (
                            <img
                              src={freelancer.avatar}
                              alt={freelancer.name || "Freelancer"}
                              className="h-full w-full object-cover rounded-full"
                            />
                          ) : (
                            <span>
                              {(freelancer.first_name ||
                                freelancer.name ||
                                "F")[0]}
                            </span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex gap-2 items-center flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900">
                              {freelancer.first_name || freelancer.last_name
                                ? `${freelancer.first_name || ""} ${
                                    freelancer.last_name || ""
                                  }`.trim()
                                : freelancer.name || "Freelancer"}
                            </h3>

                            <span
                              className="px-4 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor:
                                  app.status === "pending"
                                    ? "#FEF3C7"
                                    : app.status === "accepted"
                                    ? "#D1FADF"
                                    : "#FECACA",
                                color:
                                  app.status === "pending"
                                    ? "#92400E"
                                    : app.status === "accepted"
                                    ? "#166534"
                                    : "#B91C1C",
                              }}
                            >
                              {app.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex gap-6 text-sm text-gray-600 mt-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />{" "}
                              {freelancer.location || "Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award
                                size={14}
                                className="text-yellow-500"
                              />{" "}
                              Rating {rating}
                            </span>
                            <span>Projects {projectsDone}</span>
                          </div>
                        </div>
                      </div>

                      {/* BID DETAILS */}
                      <div className="bg-purple-50 p-4 rounded-lg flex flex-wrap gap-6 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">
                            Bid Amount
                          </p>
                          <h3 className="text-2xl font-bold text-purple-700">
                            ₹{app.bid_amount}
                          </h3>
                        </div>

                        {app.estimated_time && (
                          <div>
                            <p className="text-xs text-gray-500 font-semibold">
                              Proposed Timing (optional)
                            </p>
                              <h3 className="text-2xl font-bold text-purple-700">
                              {app.estimated_time}
                            </h3>
                          </div>
                        )}
                      </div>

                      {/* COVER LETTER */}
                      <div className="mt-4">
                        <h4 className="font-bold text-gray-900 mb-1">
                          Cover Letter
                        </h4>
                        <p className="text-gray-700">{app.cover_letter}</p>
                      </div>

                      {/* APPLICATION ATTACHMENTS */}
                      {Array.isArray(app.file_attachments) &&
                        app.file_attachments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-bold text-gray-900 mb-1">
                              Attachments
                            </h4>
                            <ul className="space-y-2">
                              {app.file_attachments.map((file) => (
                                <li
                                  key={file.id}
                                  className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-gray-50"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {file.original_name || "File"}
                                    </p>
                                    {typeof file.size === "number" && (
                                      <p className="text-xs text-gray-500">
                                        {(file.size / 1024).toFixed(1)} KB
                                      </p>
                                    )}
                                  </div>
                                  {file.file_url && (
                                    <a
                                      href={file.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      download
                                      className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700"
                                    >
                                      View / Download
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* ACTION BUTTONS */}
                      <div className="flex gap-4 mt-5 flex-wrap">
                        
                        <button
                          onClick={() => {
                            setFreelancerForModal(freelancer);
                            setFreelancerModalOpen(true);
                          }}
                          className="px-3 py-1 border border-gray-300 rounded text-xs font-medium hover:bg-purple-50 hover:border-purple-300"
                        >
                          View Details
                        </button>

                        <button
                          onClick={() =>
                            freelancerId &&
                            navigate(`/messages?user=${freelancerId}`)
                          }
                          className="px-5 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-800 font-medium"
                        >
                          Start Chat
                        </button>

                        {app.status === "pending" && (
                          <>
                            <button
                              onClick={() => approveApplication(app.id)}
                              className="px-5 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                            >
                              ✓ Accept
                            </button>

                            <button
                              onClick={() => rejectApplication(app.id)}
                              className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

{/* ===== Freelancer full profile modal  ===== */}
{freelancerModalOpen && freelancerForModal && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={() => setFreelancerModalOpen(false)}
  >
    <div
      className="max-w-3xl w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <FreelancerCard
        freelancer={{
          id: freelancerForModal.id,
          hourly_rate: freelancerForModal.hourly_rate || 0,
          availability: freelancerForModal.availability,
          skills: freelancerForModal.skills || [],
          portfolio: freelancerForModal.portfolio || '',
          portfolio_files: freelancerForModal.portfolio_files || [],
          role_title: freelancerForModal.role_title || '',
          social_links: freelancerForModal.social_links || {},
          languages: freelancerForModal.languages || [],
          experiences: freelancerForModal.experiences || [],
          education: freelancerForModal.education || [],
          projects_completed: freelancerForModal.projects_completed || 0,
          total_earnings: freelancerForModal.total_earnings || 0,
          user: {
            id: freelancerForModal.id,
            first_name: freelancerForModal.first_name || '',
            last_name: freelancerForModal.last_name || '',
            email: freelancerForModal.email || '',
            avatar: freelancerForModal.avatar || null,
            bio: freelancerForModal.bio || '',
            location: freelancerForModal.location || '',
            rating_avg: freelancerForModal.rating_avg || 0,
          },
        }}
        showChatButton={true}
      />
    </div>
  </div>
)}


        {/* APPLICATION FORM MODAL */}
        {showApplicationModal && (
          <JobApplicationForm
            job={job}
            onSubmit={handleSubmitApplication}
            onClose={() => setShowApplicationModal(false)}
            isLoading={submitting}
          />
        )}
      </div>
    </div>
  );
}