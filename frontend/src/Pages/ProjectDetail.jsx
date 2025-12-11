import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IndianRupee, Clock, Calendar, X, CheckCircle, MessageCircle, Trash2,
  MapPin, Star, Briefcase, Award, FileText, LogIn
} from 'lucide-react';
import { projectsAPI } from '../api/projects';
import { proposalsAPI } from '../api/proposals';
import { formatCurrency } from '../utils/currency';

import FreelancerCard from '../components/FreelancerCard';
import SkillSelector from '../components/SkillSelector'; // ✅ NEW


const DURATION_MAP = {
  less_1_month: 'Less than 1 month',
  '1_3_months': '1-3 months',
  '3_6_months': '3-6 months',
  '6_plus_months': '6+ months',
};
const HOURS_MAP = {
  less_10: 'Less than 10 hrs/week',
  '10_30': '10–30 hrs/week',
  more_30: 'More than 30 hrs/week',
};

const EXPERIENCE_MAP = { entry: 'Entry Level', intermediate: 'Intermediate', expert: 'Expert' };
const LOCATION_MAP = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' };

export default function ProjectDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [userProposal, setUserProposal] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    cover_letter: '',
    bid_amount: '',
    estimated_time: '',
    proposed_solution: '',
    portfolio_links: '',
    availability: '',
    resume_file: null,
    portfolio_files: [],
  });
  const [selectedSkills, setSelectedSkills] = useState([]); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [freelancerModalOpen, setFreelancerModalOpen] = useState(false);
  const [freelancerForModal, setFreelancerForModal] = useState(null);

  useEffect(() => {
    loadProject();
    if (user?.role === 'client') loadProposals();
    else if (user?.role === 'freelancer') checkUserProposal();
  
  }, [id, user]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const res = await projectsAPI.get(id);
      setProject(res.data);
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const loadProposals = async () => {
    try {
      const res = await projectsAPI.getProposals(id);
      setProposals(res.data);
    } catch (err) {
      console.error('Failed to load proposals:', err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await projectsAPI.remove(id);
      navigate('/dashboard/client');
    } catch {
      alert('Failed to delete project');
    }
  };


  const handleChat = (freelancerId) => {
    if (!user) {
      navigate('/signin');
      return;
    }
    navigate(`/messages?user=${freelancerId}`);
  };

  const checkUserProposal = async () => {
    try {
      const response = await proposalsAPI.list();
      const list = response.data.results || response.data || [];
      const up = list.find((p) => p.project === parseInt(id)) || null;
      setUserProposal(up);
    } catch (err) {
      console.error('Failed to check proposal:', err);
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to submit a proposal');
      navigate('/signin');
      return;
    }
    if (user.role !== 'freelancer') {
      alert('Only freelancers can submit proposals');
      return;
    }
    setError('');

    try {
      const formData = new FormData();
      formData.append('project', id);
      formData.append('cover_letter', proposalForm.cover_letter);
      formData.append('bid_amount', proposalForm.bid_amount);
      formData.append('estimated_time', proposalForm.estimated_time);

      // NEW fields
      if (proposalForm.proposed_solution)
        formData.append('proposed_solution', proposalForm.proposed_solution);
      if (proposalForm.portfolio_links)
        formData.append('portfolio_links', proposalForm.portfolio_links);
      if (proposalForm.availability)
        formData.append('availability', proposalForm.availability);

      // Relevant skills ids (SkillSelector)
      (selectedSkills || []).forEach((skill) => {
        if (skill?.id != null) {
          formData.append('relevant_skills_ids', skill.id);
        }
      });


      if (proposalForm.resume_file) {
        formData.append('resume', proposalForm.resume_file);
      }
      (proposalForm.portfolio_files || []).slice(0, 5).forEach((file) => {
        formData.append('portfolio_files', file);
      });

      const res = await proposalsAPI.create(formData);

      setShowProposalModal(false);
      setProposalForm({
        cover_letter: '',
        bid_amount: '',
        estimated_time: '',
        proposed_solution: '',
        portfolio_links: '',
        availability: '',
        resume_file: null,
        portfolio_files: [],
      });
      setSelectedSkills([]);


      setUserProposal(res.data);

      alert('Proposal submitted successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit proposal');
    }
  };


  const handleAcceptProposal = async (proposalId) => {
    try {
      await proposalsAPI.accept(proposalId);
      loadProposals();
      loadProject();
      alert('Proposal accepted! Contract created.');
    } catch {
      alert('Failed to accept proposal');
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      await proposalsAPI.reject(proposalId);
      loadProposals();
      alert('Proposal rejected');
    } catch {
      alert('Failed to reject proposal');
    }
  };

  const handleProposalButtonClick = () => {
    if (!user) { navigate('/signin'); return; }
    if (user.role !== 'freelancer') { alert('Only freelancers can submit proposals'); return; }
    setShowProposalModal(true);
  };

  const getFreelancerName = (f) => {
    if (!f) return 'Freelancer';
    if (f.name) return f.name;
    if (f.first_name || f.last_name) return `${f.first_name || ''} ${f.last_name || ''}`.trim();
    return 'Freelancer';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">Loading project details...</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Project not found</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const canSubmitProposal = user?.role === 'freelancer' && project.status === 'open' && !userProposal;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* ===== Project details ===== */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
              {project.category && (
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {project.category}
                </span>
              )}
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                project.status === 'open'
                  ? 'bg-green-100 text-green-700'
                  : project.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {project.status === 'open'
                ? 'Open for Proposals'
                : project.status === 'in_progress'
                ? 'In Progress'
                : project.status}
            </span>
          </div>

          {user?.id === project.client && (
            <div className="flex gap-2 mb-4">
            <button
              onClick={() => navigate(`/projects/${project.id}/edit`)}
              className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center gap-2 text-sm"
            >
              <LogIn size={16} /> Edit Project
            </button>
              <button
                onClick={handleDeleteProject}
                className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg flex items-center gap-2 text-sm"
              >
                <Trash2 size={16} /> Delete Project
              </button>
            </div>
          )}

          <p className="text-gray-700 mb-6 text-lg leading-relaxed">{project.description}</p>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {project.skills_required?.map((skill) => (
                <span key={skill.id} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium text-sm">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-6 rounded-lg">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-gray-600 mb-1"><IndianRupee size={18} /><span className="text-sm font-medium">Budget</span></div>
              <span className="text-lg font-bold text-gray-900">
                {project.job_type === 'fixed' && project.fixed_payment
                  ? formatCurrency(project.fixed_payment)
                  : project.job_type === 'hourly' && (project.hourly_min || project.hourly_max)
                  ? `${formatCurrency(project.hourly_min || 0)} - ${formatCurrency(project.hourly_max || 0)}/hr`
                  : `${formatCurrency(project.budget_min)} - ${formatCurrency(project.budget_max)}`}
              </span>
              <span className="text-xs text-gray-500 mt-1">{project.job_type === 'hourly' ? 'Hourly Rate' : 'Fixed Price'}</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-gray-600 mb-1"><Clock size={18} /><span className="text-sm font-medium">Duration</span></div>
              <span className="text-lg font-bold text-gray-900">{DURATION_MAP[project.duration] || project.duration}</span>
              <span className="text-xs text-gray-500 mt-1">{HOURS_MAP[project.hours_per_week] || project.hours_per_week}</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-gray-600 mb-1"><Award size={18} /><span className="text-sm font-medium">Experience</span></div>
              <span className="text-lg font-bold text-gray-900">{EXPERIENCE_MAP[project.experience_level] || project.experience_level}</span>
              <span className="text-xs text-gray-500 mt-1">Required Level</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-gray-600 mb-1"><MapPin size={18} /><span className="text-sm font-medium">Location</span></div>
              <span className="text-lg font-bold text-gray-900">{LOCATION_MAP[project.location_type] || project.location_type}</span>
              <span className="text-xs text-gray-500 mt-1">{project.client_location || 'Any Location'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-4">
            <div className="flex items-center gap-2"><Calendar size={16} /><span>Posted: {new Date(project.created_at).toLocaleDateString()}</span></div>
            <div className="flex items-center gap-2"><FileText size={16} /><span>{project.proposal_count || 0} Proposals</span></div>
          </div>

          {Array.isArray(project.file_attachments) && project.file_attachments.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Attachments</h3>
              <ul className="space-y-2">
                {project.file_attachments.map((att) => (
                  <li key={att.id} className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-gray-50">
                    <span className="text-sm font-medium truncate">{att.original_name || 'Attachment'}</span>
                    <a href={att.file_url} target="_blank" rel="noreferrer" className="text-sm px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" download>
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!user && project.status === 'open' && (
            <div className="mt-6 border-t pt-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
                <Calendar className="mx-auto mb-3 text-blue-600" size={48} />
                <h3 className="text-lg font-bold text-blue-900 mb-2">Interested in this project?</h3>
                <p className="text-blue-700 mb-4">Sign in as a freelancer to submit your proposal</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => navigate('/signin')} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">Sign In</button>
                  <button onClick={() => navigate('/signup')} className="px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-semibold">Sign Up</button>
                </div>
              </div>
            </div>
          )}

          {user?.role === 'freelancer' && ( 
            <div className="mt-6 border-t pt-6">
              {canSubmitProposal ? (
                <button
                  onClick={handleProposalButtonClick}
                  className="w-full sm:w-auto px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 text-lg shadow-lg"
                >
                  Submit Proposal
                </button>
              ) : userProposal ? (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="text-blue-600" size={28} />
                    <span className="font-bold text-blue-900 text-lg">Proposal Submitted</span>
                  </div>
                  <p className="text-blue-700 mb-3 text-base">
                    Status: <span className="font-semibold capitalize">{userProposal.status}</span>
                  </p>

                  {/* ✅ NEW: view submitted proposal + keep existing browse button */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/proposals/${userProposal.id}`)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold"
                    >
                      View Submitted Proposal
                    </button>
                    <button
                      onClick={() => navigate('/projects')}
                      className="text-blue-600 hover:underline font-medium text-sm"
                    >
                      Browse Other Projects →
                    </button>
                  </div>
                </div>
              ) : (
                project.status !== 'open' && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                    <p className="text-yellow-800 font-semibold text-base mb-2">
                      This project is no longer accepting proposals
                    </p>
                    <button
                      onClick={() => navigate('/projects')}
                      className="text-yellow-600 hover:underline font-medium"
                    >
                      Browse Other Projects →
                    </button>
                  </div>
                )
              )}
            </div>
          )}


          {user?.role === 'client' && user.id !== project.client && (
            <div className="mt-6 border-t pt-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-700">This page is for project owners and freelancers.</p>
              </div>
            </div>
          )}
        </div>

        {/* ===== Proposals (client) ===== */}
        {user?.role === 'client' && user.id === project.client && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Proposals Received ({proposals.length})</h2>
            </div>

            {proposals.length === 0 ? (
              <div className="text-center py-10">
                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600">No proposals yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((p) => {
                  const f = p.freelancer || {};
                  const name = getFreelancerName(f);
                  const rating = f.rating_avg?.toFixed?.(1) ?? '0.0';
                  const location = f.location || 'Not specified';
                  const projectsDone = f.projects_completed || 0;

                  return (
                    <div key={p.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition-all">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="leading-tight">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
                            {f.is_top_rated && <Award size={12} className="text-yellow-500" title="Top Rated" />}
                          </div>
                          <div className="flex items-center gap-3 text-[12px] text-gray-600 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Star size={11} className="text-yellow-400 fill-yellow-400" />
                              <span className="font-medium">{rating}</span>
                            </span>
                            <span className="inline-flex items-center gap-1"><MapPin size={11} />{location}</span>
                            <span className="inline-flex items-center gap-1"><Briefcase size={11} />{projectsDone} projects</span>
                          </div>
                        </div>

                        {/*  View Details button  */}
                        <button
                          onClick={() => { setFreelancerForModal(f); setFreelancerModalOpen(true); }}
                          className="px-3 py-1 border border-gray-300 rounded text-xs font-medium hover:bg-purple-50 hover:border-purple-300"
                        >
                          View Details
                        </button>
                      </div>

                      {/* Proposal brief */}
                      <div className="grid grid-cols-2 gap-3 mb-2 bg-purple-50 p-2 rounded">
                        <div>
                          <div className="text-[12px] text-gray-600 mb-0.5 font-medium">Bid Amount</div>
                          <div className="text-sm font-bold text-purple-700">{formatCurrency(p.bid_amount)}</div>
                        </div>
                        <div>
                          <div className="text-[12px] text-gray-600 mb-0.5 font-medium">Estimated Time</div>
                          <div className="text-sm font-bold text-purple-700">{p.estimated_time}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[12px] font-semibold text-gray-700 mb-0.5">Cover Letter</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{p.cover_letter}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t mt-2">
                        <button
                          onClick={() => handleChat(f.id || p.freelancer_id)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 inline-flex items-center gap-1.5 text-xs font-medium"
                        >
                          <MessageCircle size={14} /> Chat
                        </button>

                        {/* ✅ NEW: open full proposal page */}
                        <button
                          onClick={() => navigate(`/proposals/${p.id}`)}
                          className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-xs font-medium"
                        >
                          View Proposal
                        </button>

                        {p.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleAcceptProposal(p.id)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => handleRejectProposal(p.id)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                            >
                              ✗ Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              p.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== Submit proposal modal  ===== */}
        {showProposalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full p-8 relative max-h-screen overflow-y-auto">
              <button onClick={() => setShowProposalModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-6">Submit Your Proposal</h2>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">{error}</div>}

              <form onSubmit={handleSubmitProposal} className="space-y-6">
                {/* Cover letter - full width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={proposalForm.cover_letter}
                    onChange={(e) =>
                      setProposalForm({ ...proposalForm, cover_letter: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    placeholder="Explain why you're the best fit for this project..."
                  />
                </div>

                {/* Bid / Time / Availability - 3 in grid so less scrolling */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bid Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={proposalForm.bid_amount}
                      onChange={(e) =>
                        setProposalForm({ ...proposalForm, bid_amount: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      placeholder="e.g., 5000.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={proposalForm.estimated_time}
                      onChange={(e) =>
                        setProposalForm({ ...proposalForm, estimated_time: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      placeholder="e.g., 2 weeks"
                    />
                  </div>

                  {/* Availability dropdown (recommended) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability (recommended)
                    </label>
                    <select
                      value={proposalForm.availability}
                      onChange={(e) =>
                        setProposalForm({ ...proposalForm, availability: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    >
                      <option value="">Select availability</option>
                      <option value="less_10">Less than 10 hrs/week</option>
                      <option value="10_30">10–30 hrs/week</option>
                      <option value="more_30">More than 30 hrs/week</option>
                      <option value="full_time">Full-time for this project</option>
                    </select>
                  </div>
                </div>

                {/* Proposed Solution + Portfolio Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Solution (optional)
                    </label>
                    <textarea
                      value={proposalForm.proposed_solution}
                      onChange={(e) =>
                        setProposalForm({ ...proposalForm, proposed_solution: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      placeholder="Briefly outline how you will approach this project..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio Links (optional)
                    </label>
                    <textarea
                      value={proposalForm.portfolio_links}
                      onChange={(e) =>
                        setProposalForm({ ...proposalForm, portfolio_links: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      placeholder="Paste relevant portfolio URLs (one per line or comma-separated)"
                    />
                  </div>
                </div>

                {/* Relevant skills via SkillSelector (recommended) */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Relevant Skills (recommended)
                    </h3>
                    <span className="text-xs text-gray-500">Helps clients match your expertise</span>
                  </div>
                  <SkillSelector
                    selectedSkills={selectedSkills}
                    setSelectedSkills={setSelectedSkills}
                  />
                </div>

                {/* File uploads: Resume + portfolio files */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resume (optional)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.rtf,.odt"
                      onChange={(e) =>
                        setProposalForm({
                          ...proposalForm,
                          resume_file: e.target.files?.[0] || null,
                        })
                      }
                      className="w-full text-sm text-gray-700"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Upload your CV / resume for this proposal.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio Files (optional, max 5)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx"
                      onChange={(e) =>
                        setProposalForm({
                          ...proposalForm,
                          portfolio_files: Array.from(e.target.files || []).slice(0, 5),
                        })
                      }
                      className="w-full text-sm text-gray-700"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Attach up to 5 relevant work samples.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowProposalModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Submit Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== Your FreelancerCard inside a modal - THIS OPENS THE FULL CARD ===== */}
        {freelancerModalOpen && freelancerForModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setFreelancerModalOpen(false)}>
            <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
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
                    avatar: freelancerForModal.avatar,
                    bio: freelancerForModal.bio || '',
                    location: freelancerForModal.location || '',
                    rating_avg: freelancerForModal.rating_avg || 0,
                  }
                }} 
                showChatButton={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}