import { useState, useEffect } from 'react';
import { Star, Filter, Loader } from 'lucide-react';
import ReviewCard from './ReviewCard';
import RatingDisplay from './RatingDisplay';
import client from '../api/client';

export default function ReviewList({ userId, currentUserId = null }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, platform, external
  const [error, setError] = useState('');

  useEffect(() => {
    loadReviewsAndStats();
  }, [userId, filter]);

  const loadReviewsAndStats = async () => {
    setLoading(true);
    setError('');

    try {
      const [reviewsResponse, statsResponse] = await Promise.all([
        client.get(`/reviews/for_user/`, { 
          params: { 
            user_id: userId,
            ...(filter !== 'all' && { review_type: filter })
          } 
        }),
        client.get(`/review-stats/for_user/`, { params: { user_id: userId } })
      ]);

      setReviews(reviewsResponse.data.results || reviewsResponse.data);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {stats.average_rating?.toFixed(1) || '0.0'}
              </div>
              <RatingDisplay 
                rating={stats.average_rating || 0} 
                showNumber={false} 
                size="lg"
                className="justify-center mb-2"
              />
              <p className="text-sm text-gray-600">
                Based on {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Rating Distribution</h4>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.rating_distribution?.[rating] || 0;
                  const percentage = stats.total_reviews > 0 
                    ? (count / stats.total_reviews) * 100 
                    : 0;

                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-sm font-medium text-gray-700">{rating}</span>
                        <Star size={14} className="text-yellow-400" fill="currentColor" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Review Type Stats */}
          <div className="mt-4 pt-4 border-t border-purple-200 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-700">
                <strong>{stats.platform_reviews}</strong> Platform Reviews
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-700">
                <strong>{stats.external_reviews}</strong> Testimonials
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-gray-500" />
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Reviews' },
            { key: 'platform', label: 'Platform' },
            { key: 'external', label: 'Testimonials' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Star size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Reviews will appear here once received
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showResponse={true}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}