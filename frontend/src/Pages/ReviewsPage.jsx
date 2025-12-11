// frontend/src/pages/ReviewsPage.jsx
import { useState } from 'react';
import { Star, Link2, Copy } from 'lucide-react';
import ReviewList from '../components/ReviewList';

export default function ReviewsPage({ user }) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/submit-review`
      : '/submit-review';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view reviews</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Star className="text-purple-600" />
            My Reviews & Ratings
          </h1>
          <p className="text-gray-600">
            {user.role === 'client'
              ? 'View what freelancers say about working with you'
              : 'View and respond to client feedback'}
          </p>
        </div>

        {/* Share testimonial link */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-purple-100 p-4 md:p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Link2 className="text-purple-600" size={20} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-900">
                Share your testimonial link
              </h2>
              <p className="text-xs md:text-sm text-gray-600">
                Ask clients or collaborators outside TalentLink to leave a testimonial. These
                testimonials help showcase your work but do not affect your verified ratings from
                completed contracts.
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
            >
              <Copy size={16} />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        
        <ReviewList userId={user.id} currentUserId={user.id} />
      </div>
    </div>
  );
}
