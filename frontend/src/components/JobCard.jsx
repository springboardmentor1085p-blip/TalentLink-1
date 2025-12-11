import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IndianRupee, 
  MapPin, 
  Calendar, 
  Bookmark,
  Clock
} from 'lucide-react';
import { savedItemsAPI } from '../api/savedItems';

const EXPERIENCE_MAP = {
  entry: 'Entry Level',
  intermediate: 'Intermediate',
  expert: 'Expert',
};

const LOCATION_MAP = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'Onsite',
};

export default function JobCard({ job, user, showSaveButton = true }) {
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ CHECK IF JOB IS SAVED ON MOUNT - Just like ProjectCard
  useEffect(() => {
    if (showSaveButton && user?.role === 'freelancer') {
      checkIfSaved();
    }
  }, [job.id, showSaveButton, user]);

  const checkIfSaved = async () => {
    try {
      const res = await savedItemsAPI.isJobSaved(job.id);
      setIsSaved(res.data.is_saved || false);
    } catch (err) {
      console.error('Error checking if job is saved:', err);
      setIsSaved(false);
    }
  };

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('Please sign in to save jobs');
      return;
    }

    if (saving) return; // Prevent double-clicks

    setSaving(true);
    try {
      if (isSaved) {
        await savedItemsAPI.unsaveJob(job.id);
        setIsSaved(false);
      } else {
        await savedItemsAPI.saveJob(job.id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      alert('Failed to update saved status');
    } finally {
      setSaving(false);
    }
  };

  const getPaymentDisplay = () => {
    if (job.job_type === 'hourly' && job.hourly_min && job.hourly_max) {
      return `₹${job.hourly_min}-${job.hourly_max}/hr`;
    }
    if (job.job_type === 'fixed' && job.fixed_amount) {
      return `₹${job.fixed_amount}`;
    }
    return 'Not specified';
  };

  return (
    <Link to={`/jobs/${job.id}`} className="relative block">
      {/* ✅ Save Button - Positioned EXACTLY like ProjectCard */}
      {showSaveButton && user?.role === 'freelancer' && (
        <button
          onClick={handleSaveToggle}
          disabled={saving}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition disabled:opacity-50"
          title={isSaved ? 'Remove from saved' : 'Save for later'}
        >
          <Bookmark
            size={18}
            className={isSaved ? 'text-purple-600 fill-purple-600' : 'text-gray-400'}
          />
        </button>
      )}

      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-purple-300 overflow-hidden group">
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition truncate mb-1.5">
                {job.title}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                  Open
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200 capitalize">
                  {job.job_type === 'hourly' ? 'Hourly' : 'Fixed'}
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded border border-amber-200">
                  {EXPERIENCE_MAP[job.experience_level]}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {job.description}
          </p>

          {/* Job Details Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <IndianRupee size={14} className="text-green-600 flex-shrink-0" />
              <span className="font-semibold text-green-700 truncate">
                {getPaymentDisplay()}
              </span>
            </div>

            {job.location && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin size={14} className="flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            )}

            {job.location_type && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Clock size={14} className="flex-shrink-0" />
                <span className="capitalize">{LOCATION_MAP[job.location_type]}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Calendar size={14} className="flex-shrink-0" />
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              by <span className="font-medium text-gray-700">{job.client_name || 'Client'}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}