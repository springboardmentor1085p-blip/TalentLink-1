import { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import client from '../api/client';

export default function ReviewForm({
  contract,
  onSuccess,
  onCancel,
  title = 'Leave a Review',
  subtitle = '',
  submitLabel = 'Submit Review'
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await client.post('/reviews/', {
        contract: contract.id,
        rating,
        comment,
        review_type: 'platform'
      });

      onSuccess?.(response.data);
    } catch (err) {
      console.error('Review submission error:', err);
      setError(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Your Rating *
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={40}
                  className={
                    value <= (hover || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }
                  fill={value <= (hover || rating) ? 'currentColor' : 'none'}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-3 text-lg font-semibold text-gray-700">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Share your experience working on this project..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length} / 1000 characters
          </p>
        </div>

        {/* Project Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Project:</span> {contract.project_title || contract.job_title}
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {loading ? 'Submitting...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}