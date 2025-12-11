import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Send,
  Mail,
  User,
  Building,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import client from '../api/client';

export default function ExternalReviewForm() {
  const [formData, setFormData] = useState({
    reviewee_email: '',
    reviewer_name: '',
    reviewer_email: '',
    reviewer_company: '',
    rating: 0,
    comment: '',
    project_title: '',
    work_period: '',
  });

  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'rating' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reviewee_email || !formData.reviewer_name || !formData.reviewer_email || !formData.project_title || !formData.rating) {
      setError('Please fill all required fields and select a rating.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        ...formData,
        review_type: 'external',
      };

      await client.post('/reviews/', payload);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to submit external review:', err);
      const detail =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'string'
          ? err.response.data
          : 'Unable to submit testimonial. Please try again.');
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-3xl w-full mx-auto">
          {/* Simple brand header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white shadow-sm mb-4">
              <span className="text-sm font-semibold tracking-wide text-purple-700">
                TalentLink Testimonials
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Thank you for sharing your experience
            </h1>
            <p className="text-gray-600">
              Your testimonial helps TalentLink users build trust and showcase their work.
            </p>
          </div>

          {/* Success card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification email to{' '}
              <strong>{formData.reviewer_email}</strong>. Please check your inbox and click
              the verification link to confirm your review.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Once verified, your testimonial will appear on their TalentLink profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                Submit Another Testimonial
              </button>

              {/* CTA to join TalentLink */}
              <Link
                to="/"
                className="px-6 py-3 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 font-semibold"
              >
                Discover TalentLink
              </Link>
            </div>
          </div>

          {/* Tiny footer text */}
          <p className="mt-6 text-xs text-center text-gray-400">
            Powered by TalentLink – work that clicks, freelancers that stick.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-4xl w-full mx-auto">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white shadow-sm mb-4">
            <span className="text-sm font-semibold tracking-wide text-purple-700">
              TalentLink Testimonials
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Share a testimonial for someone on TalentLink
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Help freelancers and clients on TalentLink showcase their work by leaving a short,
            honest testimonial about your experience working together.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Submit Testimonial</h2>
            <p className="text-gray-600 text-sm">
              These testimonials are from outside the platform and are not verified; they are
              shown only for marketing and do{' '}
              <span className="font-semibold">not</span> affect main ratings.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
              <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Person to Review */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-3">
                Who are you reviewing?
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Their Email Address *
                </label>
                <input
                  type="email"
                  value={formData.reviewee_email}
                  onChange={(e) => handleChange('reviewee_email', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="user@example.com"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Enter the email they used to register on TalentLink
                </p>
              </div>
            </div>

            {/* Your Information */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Your Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline mr-2" size={16} />
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={formData.reviewer_name}
                    onChange={(e) => handleChange('reviewer_name', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline mr-2" size={16} />
                    Your Email *
                  </label>
                  <input
                    type="email"
                    value={formData.reviewer_email}
                    onChange={(e) => handleChange('reviewer_email', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="your@email.com"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">For verification purposes</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline mr-2" size={16} />
                    Your Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.reviewer_company}
                    onChange={(e) => handleChange('reviewer_company', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Company Name"
                  />
                </div>
              </div>
            </div>

            {/* Project Details (logic preserved, just used for backend / context) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Project Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline mr-2" size={16} />
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.project_title}
                    onChange={(e) => handleChange('project_title', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="E.g., Website Redesign"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-2" size={16} />
                    Work Period (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.work_period}
                    onChange={(e) => handleChange('work_period', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="E.g., Jan 2024 - Mar 2024"
                  />
                </div>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Your Rating *
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChange('rating', value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={40}
                      className={
                        value <= (hover || formData.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }
                      fill={value <= (hover || formData.rating) ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
                {formData.rating > 0 && (
                  <span className="ml-3 text-lg font-semibold text-gray-700">
                    {formData.rating === 1 && 'Poor'}
                    {formData.rating === 2 && 'Fair'}
                    {formData.rating === 3 && 'Good'}
                    {formData.rating === 4 && 'Very Good'}
                    {formData.rating === 5 && 'Excellent'}
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
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Share your experience working with this person..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.comment.length} / 1000 characters
            </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By submitting, you confirm that you have worked with this person and your review is
              honest and truthful.
            </p>
          </form>
        </div>

        {/* CTA to join TalentLink */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Want to manage all your projects and hire talented freelancers?
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 rounded-lg border border-purple-200 bg-white text-purple-700 text-sm font-semibold hover:bg-purple-50"
          >
            Explore TalentLink
          </Link>
        </div>

        <p className="mt-4 text-xs text-center text-gray-400">
          TalentLink – work that clicks, freelancers that stick.
        </p>
      </div>
    </div>
  );
}
