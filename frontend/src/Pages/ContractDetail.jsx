import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  IndianRupee,
  ArrowLeft,
  Paperclip,
  Edit2,
  X,
  Save
} from 'lucide-react';
import { contractsAPI } from '../api/contracts';

export default function ContractDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showReviewSuccess, setShowReviewSuccess] = useState(location.state?.reviewSubmitted || false);

  // ✅ new local editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTerms, setEditTerms] = useState('');
  const [editPaymentTerms, setEditPaymentTerms] = useState('');
  const [editFile, setEditFile] = useState(null);

  useEffect(() => {
    loadContract();
  }, [id]);

  useEffect(() => {
    if (location.state?.reviewSubmitted) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (showReviewSuccess) {
      const timer = setTimeout(() => setShowReviewSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showReviewSuccess]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const res = await contractsAPI.get(id);
      setContract(res.data);
      // sync edit fields with latest contract
      setEditTerms(res.data.terms || '');
      setEditPaymentTerms(res.data.payment_terms || '');
      setEditFile(null);
    } catch (err) {
      setError('Failed to load contract details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    try {
      setActionLoading(true);
      await contractsAPI.sign(id);
      await loadContract();
      alert('Contract signed successfully!');
    } catch (err) {
      alert('Failed to sign contract');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ NEW: save client edits (terms, payment_terms, attachment)
  const handleSaveEdits = async () => {
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('terms', editTerms || '');
      formData.append('payment_terms', editPaymentTerms || '');
      if (editFile) {
        formData.append('attachment', editFile);
      }

      const res = await contractsAPI.update(id, formData);
      setContract(res.data);
      setIsEditing(false);
      setEditTerms(res.data.terms || '');
      setEditPaymentTerms(res.data.payment_terms || '');
      setEditFile(null);
      alert('Contract updated successfully.');
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Failed to update contract.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!contract) return;
    setIsEditing(false);
    setEditTerms(contract.terms || '');
    setEditPaymentTerms(contract.payment_terms || '');
    setEditFile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-red-700 text-lg font-semibold">{error || 'Contract not found'}</p>
            <button
              onClick={() => navigate('/contracts')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Contracts
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canSign =
    contract.status === 'pending' &&
    ((user.role === 'client' && !contract.client_signed) ||
      (user.role === 'freelancer' && !contract.freelancer_signed));

  // ❌ removed: mark-as-completed from this page (handled in Workspace now)
  // const canComplete = contract.status === 'active' && user.role === 'client';

  const canClientReview = user?.role === 'client' && contract.client_can_review && user.id === contract.client;
  const canFreelancerReview =
    user?.role === 'freelancer' && contract.freelancer_can_review && user.id === contract.freelancer;
  const showReviewButton = canClientReview || canFreelancerReview;
  const reviewButtonLabel =
    user?.role === 'client' ? 'Review Freelancer' : user?.role === 'freelancer' ? 'Review Client' : 'Leave Review';

  // ✅ client can edit only while pending and before any signatures
  const canClientEdit =
    user?.role === 'client' &&
    contract.client === user?.id &&
    contract.status === 'pending' &&
    !contract.client_signed &&
    !contract.freelancer_signed;

  // ✅ Unified title for both job and project contracts
  const title = contract.job_title || contract.project_title || `Contract #${contract.id}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/contracts')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Contracts
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {showReviewSuccess && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
              Review submitted successfully! You can see it under Reviews & Ratings.
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              <p className="text-gray-600">Contract ID: #{contract.id}</p>
              {canClientEdit && (
                <p className="mt-2 text-xs text-gray-500">
                  You can edit terms and upload an attachment until either party signs this contract.
                </p>
              )}
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                contract.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : contract.status === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : contract.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
            </span>
          </div>

          {/* Parties */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={20} className="text-purple-600" />
                <h3 className="font-semibold text-purple-900">Client</h3>
              </div>
              <p className="text-gray-900 font-medium">{contract.client_name}</p>
              <div className="flex items-center gap-2 mt-3">
                {contract.client_signed ? (
                  <>
                    <CheckCircle className="text-green-500" size={18} />
                    <span className="text-sm text-green-700 font-medium">Signed</span>
                  </>
                ) : (
                  <>
                    <Clock className="text-yellow-500" size={18} />
                    <span className="text-sm text-yellow-700 font-medium">Pending Signature</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={20} className="text-blue-600" />
                <h3 className="font-semibold text-blue-900">Freelancer</h3>
              </div>
              <p className="text-gray-900 font-medium">{contract.freelancer_name}</p>
              <div className="flex items-center gap-2 mt-3">
                {contract.freelancer_signed ? (
                  <>
                    <CheckCircle className="text-green-500" size={18} />
                    <span className="text-sm text-green-700 font-medium">Signed</span>
                  </>
                ) : (
                  <>
                    <Clock className="text-yellow-500" size={18} />
                    <span className="text-sm text-yellow-700 font-medium">Pending Signature</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          {contract.start_date && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={20} />
                Timeline
              </h3>
              <div className="flex gap-6 text-sm flex-wrap">
                <div>
                  <p className="text-gray-600">Start Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(contract.start_date).toLocaleDateString()}
                  </p>
                </div>
                {contract.end_date && (
                  <div>
                    <p className="text-gray-600">End Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(contract.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Terms + Edit controls */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} />
                Contract Terms
              </h3>
              {canClientEdit && (
                <button
                  type="button"
                  onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {isEditing ? (
                    <>
                      <X size={14} />
                      Cancel edit
                    </>
                  ) : (
                    <>
                      <Edit2 size={14} />
                      Edit terms
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              {isEditing ? (
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  rows={6}
                  value={editTerms}
                  onChange={(e) => setEditTerms(e.target.value)}
                  placeholder="Describe the full scope of work, responsibilities, and deliverables..."
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {contract.terms || 'No terms have been added yet.'}
                </p>
              )}
            </div>
          </div>

          {/* Payment Terms */}
          {(isEditing || contract.payment_terms) && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <IndianRupee size={20} />
                Payment Terms
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {isEditing ? (
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                    rows={4}
                    value={editPaymentTerms}
                    onChange={(e) => setEditPaymentTerms(e.target.value)}
                    placeholder="Specify milestones, amounts, schedules, and any special payment conditions..."
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {contract.payment_terms || 'No payment terms have been added yet.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Attachment section */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Paperclip size={20} />
              Contract Attachment
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {contract.attachment ? (
                <a
                  href={contract.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
                >
                  <Paperclip size={16} />
                  <span>View / Download attached file</span>
                </a>
              ) : (
                <p className="text-sm text-gray-600">
                  No attachment has been uploaded for this contract yet.
                </p>
              )}

              {isEditing && (
                <div className="pt-3 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload attachment (optional)
                  </label>
                  <input
                    type="file"
                    className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    You can upload a single file (PDF, DOCX, image, etc.). Uploading a new file will replace the existing one.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save / Cancel buttons for edit mode */}
          {isEditing && (
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-6 border-t">
            <div className="flex gap-4 flex-wrap">
              {canSign && (
                <button
                  onClick={handleSignContract}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} />
                  {actionLoading ? 'Signing...' : 'Sign Contract'}
                </button>
              )}


              {contract.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={24} />
                  <span className="font-semibold">This contract has been completed</span>
                </div>
              )}

              {/* Workspace Link for Active Contracts*/}
              {contract.status === 'active' && (
                <Link
                  to={`/workspace`}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  <FileText size={20} />
                  Go to Workspace
                </Link>
              )}
            </div>

            {showReviewButton && (
              <Link
                to={`/contracts/${contract.id}/review`}
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition w-full sm:w-auto text-center"
              >
                {reviewButtonLabel}
              </Link>
            )}

            {contract.status === 'completed' && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Client review:</span>{' '}
                {contract.has_client_reviewed ? 'Submitted' : 'Pending'} •{' '}
                <span className="font-medium">Freelancer review:</span>{' '}
                {contract.has_freelancer_reviewed ? 'Submitted' : 'Pending'}
              </div>
            )}
          </div>
        </div>

        {/* Related Links */}
        {(contract.proposal?.project || contract.job_application?.job) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Related Work</h3>
            {contract.proposal?.project ? (
              <Link
                to={`/projects/${contract.proposal.project}`}
                className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
              >
                View Project Details →
              </Link>
            ) : (
              <Link
                to={`/jobs/${contract.job_application.job}`}
                className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
              >
                View Job Details →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
