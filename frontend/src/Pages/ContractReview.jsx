import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { contractsAPI } from '../api/contracts';
import ReviewForm from '../components/ReviewForm';

export default function ContractReview({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const res = await contractsAPI.get(id);
      setContract(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load contract for review:', err);
      setError(err.response?.data?.detail || 'Unable to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate(`/contracts/${id}`, { state: { reviewSubmitted: true } });
  };

  const handleCancel = () => {
    navigate(`/contracts/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your review...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">We couldn't load this contract.</p>
            <p className="text-gray-600 mb-6">{error || 'Please try again later.'}</p>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
              Back to Contract
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';
  const isClientOnContract = contract.client === user?.id;
  const isFreelancerOnContract = contract.freelancer === user?.id;
  const isParticipant = isClientOnContract || isFreelancerOnContract;
  const alreadyReviewed = isClient
    ? contract.has_client_reviewed
    : contract.has_freelancer_reviewed;
  const canReview =
    contract.status === 'completed' &&
    isParticipant &&
    !alreadyReviewed;

  const targetName = isClient ? contract.freelancer_name : contract.client_name;
  const reviewTitle = isClient ? 'Review Your Freelancer' : 'Review Your Client';
  const subtitle = targetName
    ? `Share your experience working with ${targetName}.`
    : 'Share your experience working on this engagement.';

  const restrictionMessage = !isParticipant
    ? 'You are not authorized to review this contract.'
    : contract.status !== 'completed'
    ? 'This contract must be marked as completed before leaving a review.'
    : alreadyReviewed
    ? 'You have already submitted a review for this contract.'
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Contract
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">
              Contract #{contract.id}
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">
              {contract.job_title || contract.project_title || 'Contract Review'}
            </h1>
          </div>

          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              Please sign in to leave a review.
            </div>
          )}

          {user && restrictionMessage && (
            <div className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-3 rounded-lg">
              {restrictionMessage}
            </div>
          )}

          {user && canReview && (
            <ReviewForm
              contract={contract}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              title={reviewTitle}
              subtitle={subtitle}
              submitLabel={isClient ? 'Submit Freelancer Review' : 'Submit Client Review'}
            />
          )}
        </div>
      </div>
    </div>
  );
}

