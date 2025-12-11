import { MapPin, Star, MessageCircle, Briefcase, Award, Link as LinkIcon } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewsAPI } from '../api/reviews';

export default function FreelancerCard({ freelancer, showChatButton = true }) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReviewsPreview, setShowReviewsPreview] = useState(false);
  const [reviewsPreviewLoading, setReviewsPreviewLoading] = useState(false);
  const [reviewsPreviewError, setReviewsPreviewError] = useState('');
  const [reviewsPreview, setReviewsPreview] = useState({
    stats: null,
    platform: [],
    external: [],
  });

  const navigate = useNavigate();
  const profile = freelancer.user || {};
  const rating = profile.rating_avg || 0;
  const hourlyRate = freelancer.hourly_rate || 0;
  const isTopRated = rating >= 4.5;
  const isRisingTalent = freelancer.projects_completed > 0 && freelancer.projects_completed <= 5;

  const handleCardClick = (e) => {
    if (!e.target.closest('.chat-button') && !e.target.closest('.reviews-button')) {
      setShowProfileModal(true);
    }
  };

  const handleStartChat = (e) => {
    e.stopPropagation();
    navigate(`/messages?user=${profile.id}`);
  };

  const loadReviewsPreview = async () => {
    if (!profile.id) return;

    setReviewsPreviewLoading(true);
    setReviewsPreviewError('');

    try {
      const [statsRes, platformRes, externalRes] = await Promise.all([
        reviewsAPI.getStats(profile.id),
        reviewsAPI.getForUser(profile.id, { review_type: 'platform', page_size: 3 }),
        reviewsAPI.getForUser(profile.id, { review_type: 'external', page_size: 3 }),
      ]);

      const platformReviews = platformRes.data?.results || platformRes.data || [];
      const externalReviews = externalRes.data?.results || externalRes.data || [];

      setReviewsPreview({
        stats: statsRes.data,
        platform: Array.isArray(platformReviews) ? platformReviews : [],
        external: Array.isArray(externalReviews) ? externalReviews : [],
      });
    } catch (err) {
      console.error('Failed to load reviews preview:', err);
      setReviewsPreviewError('Unable to load reviews at the moment.');
    } finally {
      setReviewsPreviewLoading(false);
    }
  };

  const handleViewReviews = async (e) => {
    e.stopPropagation();
    const next = !showReviewsPreview;
    setShowReviewsPreview(next);
    if (
      next &&
      !reviewsPreview.stats &&
      !reviewsPreview.platform.length &&
      !reviewsPreview.external.length
    ) {
      await loadReviewsPreview();
    }
  };

  // Extract social links if available (helps client judge freelancer credibility)
  const socialLinks = freelancer.social_links || {};
  const hasAnySocial =
    !!socialLinks.linkedin ||
    !!socialLinks.github ||
    !!socialLinks.website ||
    !!socialLinks.other;

  return (
    <>
      <div onClick={handleCardClick}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-purple-300">
          <div className="flex items-start gap-4 mb-4">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={`${profile.first_name} ${profile.last_name}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-200">
                <span className="text-purple-600 font-semibold text-lg">
                  {profile.first_name?.[0] || 'U'}
                  {profile.last_name?.[0] || ''}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {profile.first_name} {profile.last_name}
                </h3>
                {isTopRated && (
                  <Award size={16} className="text-yellow-500" title="Top Rated" />
                )}
              </div>
              {freelancer.role_title && (
                <p className="text-sm text-gray-600 mb-2">{freelancer.role_title}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                </div>
                {isRisingTalent && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    Rising Talent
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{profile.bio}</p>
          )}

          {freelancer.skills && freelancer.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {freelancer.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill.id}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                >
                  {skill.name}
                </span>
              ))}
              {freelancer.skills.length > 4 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  +{freelancer.skills.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Briefcase size={14} />
              <span>{freelancer.projects_completed || 0} projects</span>
            </div>
            {freelancer.availability && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                {freelancer.availability.replace('-', ' ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <div className="flex-1 flex items-center gap-1 text-green-600 font-semibold">
              <span className="text-base">{formatCurrency(hourlyRate)}/hr</span>
            </div>
            {showChatButton && (
              <button
                onClick={handleStartChat}
                className="chat-button flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
              >
                <MessageCircle size={16} />
                Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Freelancer Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 text-sm">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6 pb-6 border-b border-gray-200">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-4 border-purple-200 flex-shrink-0">
                    <span className="text-purple-600 font-semibold text-3xl">
                      {profile.first_name?.[0]}
                      {profile.last_name?.[0]}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    {isTopRated && (
                      <Award size={20} className="text-yellow-500" title="Top Rated" />
                    )}
                  </div>

                  {freelancer.role_title && (
                    <p className="text-lg text-gray-600 mb-2">{freelancer.role_title}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-2">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold">{rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase size={16} />
                      <span>{freelancer.projects_completed || 0} projects completed</span>
                    </div>
                    {freelancer.availability && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                        {freelancer.availability.replace('-', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(hourlyRate)}/hr
                    </div>
                    {/* Total earnings removed from UI as per latest requirement
                    {typeof freelancer.total_earnings !== 'undefined' && (
                      <div className="text-sm text-gray-600">
                        Total earnings:{' '}
                        <span className="font-semibold">
                          {formatCurrency(freelancer.total_earnings || 0)}
                        </span>
                      </div>
                    )} */}
                  </div>

                  {/* View reviews & testimonials */}
                  <button
                    onClick={handleViewReviews}
                    className="reviews-button mt-3 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    <Star size={14} className="text-purple-600" />
                    View platform reviews &amp; testimonials
                  </button>
                </div>
              </div>

              {/* Compact Reviews & Testimonials Preview */}
              {showReviewsPreview && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 max-h-64 overflow-y-auto">
                  {reviewsPreviewLoading && (
                    <p className="text-xs text-gray-500">Loading reviews...</p>
                  )}

                  {reviewsPreviewError && (
                    <p className="text-xs text-red-500">{reviewsPreviewError}</p>
                  )}

                  {!reviewsPreviewLoading && !reviewsPreviewError && (
                    <>
                      {reviewsPreview.stats && (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                              Platform Rating (TalentLink)
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-purple-600">
                                {typeof reviewsPreview.stats.average_rating === 'number'
                                  ? reviewsPreview.stats.average_rating.toFixed(1)
                                  : '0.0'}
                              </span>
                              <span className="text-xs text-gray-500">
                                from {reviewsPreview.stats.total_reviews || 0}{' '}
                                {reviewsPreview.stats.total_reviews === 1
                                  ? 'review'
                                  : 'reviews'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-[11px] text-gray-500">
                            <p>
                              Testimonials shown here are from outside the platform and{' '}
                              <span className="font-semibold">do not affect</span> this rating.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-3 text-xs mt-3">
                        {/* Platform reviews */}
                        <div className="space-y-2">
                          <p className="font-semibold text-gray-700">Platform reviews</p>
                          {reviewsPreview.platform.length === 0 && (
                            <p className="text-gray-500">No platform reviews yet.</p>
                          )}
                          {reviewsPreview.platform.slice(0, 3).map((rev, idx) => (
                            <div
                              key={rev.id || idx}
                              className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-800 truncate">
                                  {/* Keep reviewers anonymous for public view */}
                                  Verified TalentLink user
                                </span>
                                {rev.created_at && (
                                  <span className="text-[11px] text-gray-500">
                                    {new Date(rev.created_at).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                <Star size={12} className="text-yellow-400" />
                                <span className="text-xs font-semibold text-gray-700">
                                  {typeof rev.rating === 'number'
                                    ? rev.rating.toFixed(1)
                                    : rev.rating}
                                </span>
                              </div>
                              {rev.comment && (
                                <p className="text-gray-600 text-xs line-clamp-3">
                                  {rev.comment}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* External testimonials */}
                        <div className="space-y-2">
                          <p className="font-semibold text-gray-700">
                            Testimonials (outside platform)
                          </p>
                          {reviewsPreview.external.length === 0 && (
                            <p className="text-gray-500">No testimonials added yet.</p>
                          )}
                          {reviewsPreview.external.slice(0, 3).map((rev, idx) => (
                            <div
                              key={rev.id || idx}
                              className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-800 truncate">
                                  External contact
                                </span>
                                {rev.created_at && (
                                  <span className="text-[11px] text-gray-500">
                                    {new Date(rev.created_at).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                <Star size={12} className="text-yellow-400" />
                                <span className="text-xs font-semibold text-gray-700">
                                  {typeof rev.rating === 'number'
                                    ? rev.rating.toFixed(1)
                                    : rev.rating}
                                </span>
                                <span className="text-[10px] text-gray-500 ml-2">
                                  Testimonial (not verified)
                                </span>
                              </div>
                              {rev.comment && (
                                <p className="text-gray-600 text-xs line-clamp-3">
                                  {rev.comment}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 2-column content layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                  {/* Bio / About */}
                  {profile.bio && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">About</h4>
                      <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {freelancer.skills && freelancer.skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {freelancer.skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {Array.isArray(freelancer.languages) && freelancer.languages.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {freelancer.languages.map((lang, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                          >
                            {typeof lang === 'string'
                              ? lang
                              : lang?.name || lang?.language || 'Language'}
                            {lang && (lang.level || lang.proficiency)
                              ? ` • ${lang.level || lang.proficiency}`
                              : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Links – useful for judging freelancer credibility */}
                  {hasAnySocial && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <LinkIcon size={16} />
                        Social Profiles
                      </h4>
                      <div className="flex flex-col gap-1 text-xs md:text-sm">
                        {socialLinks.linkedin && (
                          <a
                            href={socialLinks.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-600 hover:underline truncate"
                          >
                            LinkedIn
                          </a>
                        )}
                        {socialLinks.github && (
                          <a
                            href={socialLinks.github}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-600 hover:underline truncate"
                          >
                            GitHub
                          </a>
                        )}
                        {socialLinks.website && (
                          <a
                            href={socialLinks.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-600 hover:underline truncate"
                          >
                            Website
                          </a>
                        )}
                        {socialLinks.other && (
                          <a
                            href={socialLinks.other}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-600 hover:underline truncate"
                          >
                            Other
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                  {/* Portfolio text/links */}
                  {freelancer.portfolio && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Portfolio Summary</h4>
                      <p className="text-gray-700">{freelancer.portfolio}</p>
                    </div>
                  )}

                  {/* Portfolio Files (view/download) */}
                  {Array.isArray(freelancer.portfolio_files) &&
                    freelancer.portfolio_files.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Portfolio Files</h4>
                        <ul className="space-y-2">
                          {freelancer.portfolio_files.map((f) => (
                            <li
                              key={f.id}
                              className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-gray-50"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {f.file_name || 'File'}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {((f.file_size || 0) / 1024).toFixed(1)} KB
                                </div>
                              </div>
                              <a
                                href={f.file_url || (f.file && f.file)}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-semibold"
                              >
                                View / Download
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Experience */}
                  {freelancer.experiences && freelancer.experiences.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Experience</h4>
                      <div className="space-y-4">
                        {freelancer.experiences.map((exp, idx) => (
                          <div key={idx} className="border-l-2 border-purple-500 pl-4">
                            <h5 className="font-semibold text-gray-900">
                              {exp.title || exp.position}
                            </h5>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-gray-500 text-xs">
                              {exp.startDate || exp.start || '—'} →{' '}
                              {exp.endDate || exp.end || (exp.current ? 'Present' : '—')}
                            </p>
                            {exp.description && (
                              <p className="text-gray-700 mt-2">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {freelancer.education && freelancer.education.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Education</h4>
                      <div className="space-y-3">
                        {freelancer.education.map((edu, idx) => (
                          <div key={idx} className="border-l-2 border-purple-500 pl-4">
                            <h5 className="font-semibold text-gray-900">
                              {edu.degree || edu.title}
                            </h5>
                            <p className="text-gray-600">{edu.institution || edu.school}</p>
                            <p className="text-gray-500 text-xs">
                              {edu.field ? `${edu.field} • ` : ''}
                              {edu.year || edu.period}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleStartChat({ stopPropagation: () => {} });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
                >
                  <MessageCircle size={18} />
                  Start Conversation
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
