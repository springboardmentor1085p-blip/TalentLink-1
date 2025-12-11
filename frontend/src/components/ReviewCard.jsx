import { useState } from 'react';
import { Calendar, Building, Briefcase, MessageCircle, Shield, ExternalLink } from 'lucide-react';
import RatingDisplay from './RatingDisplay';
import client from '../api/client';

export default function ReviewCard({ review, showResponse = true, currentUserId = null }) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [localReview, setLocalReview] = useState(review);

  const canRespond = currentUserId && currentUserId === review.reviewee && !localReview.response;

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      setError('Please enter a response');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await client.post(`/reviews/${localReview.id}/respond/`, {
        response_text: responseText
      });

      setLocalReview({
        ...localReview,
        response: response.data
      });

      setShowResponseForm(false);
      setResponseText('');
    } catch (err) {
      console.error('Response submission error:', err);
      setError(err.response?.data?.detail || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const isExternal = localReview.review_type === 'external';

  // 🔒 Anonymise who gave the review – no real names shown publicly
  const reviewerLabel = isExternal
    ? 'Testimonial'
    : 'Verified TalentLink user';


  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Reviewer Avatar/Initial */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {reviewerLabel.charAt(0).toUpperCase()}
          </div>

          {/* Reviewer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{reviewerLabel}</h3>
              {isExternal && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                  <ExternalLink size={12} />
                  Testimonial
                </span>
              )}
              {localReview.is_verified && (
                <Shield size={16} className="text-green-500" title="Verified Review" />
              )}
            </div>

            {localReview.reviewer_company && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Building size={14} />
                {localReview.reviewer_company}
              </p>
            )}

            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Calendar size={12} />
              {new Date(localReview.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Rating */}
        <RatingDisplay rating={localReview.rating} showNumber={false} />
      </div>

      {/* Engagement Info (no project name shown) */}
      {localReview.work_period && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <Calendar size={14} className="text-gray-500" />
            <span className="font-medium">Engagement period:</span>
            <span>{localReview.work_period}</span>
          </p>
        </div>
      )}


      {/* Review Comment */}
      {localReview.comment && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{localReview.comment}</p>
        </div>
      )}

      {isExternal && (
        <p className="text-xs text-gray-500 mb-2">
          This is a testimonial from outside TalentLink. It is not verified.
        </p>
      )}

      {/* Response Section */}
      {showResponse && (
        <>
          {localReview.response && (
            <div className="mt-4 pl-4 border-l-4 border-purple-200 bg-purple-50 rounded-r-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={16} className="text-purple-600" />
                <span className="font-semibold text-purple-900 text-sm">Response from {localReview.reviewee_name}</span>
              </div>
              <p className="text-gray-700 text-sm">{localReview.response.response_text}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(localReview.response.created_at).toLocaleDateString()}
              </p>
            </div>
          )}

          {canRespond && !showResponseForm && (
            <button
              onClick={() => setShowResponseForm(true)}
              className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-2"
            >
              <MessageCircle size={16} />
              Respond to this review
            </button>
          )}

          {showResponseForm && (
            <div className="mt-4 border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                  {error}
                </div>
              )}
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                placeholder="Thank you for your feedback..."
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseText('');
                    setError('');
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}