// frontend/src/components/ProjectCard.jsx (REPLACE ENTIRE FILE)
import { Link } from 'react-router-dom';
import { Briefcase, Clock, Calendar, Users, IndianRupee, MapPin, Award, Bookmark } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useState, useEffect } from 'react';
import { savedItemsAPI } from '../api/savedItems';

export default function ProjectCard({ project, showSaveButton = true }) {
  const [isSaved, setIsSaved] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);

  useEffect(() => {
    if (showSaveButton) {
      checkIfSaved();
    }
  }, [project.id, showSaveButton]);

  const checkIfSaved = async () => {
    try {
      const res = await savedItemsAPI.isProjectSaved(project.id);
      setIsSaved(res.data.is_saved || false);
    } catch {
      setIsSaved(false);
    }
  };

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (savingInProgress) return;

    try {
      setSavingInProgress(true);
      if (isSaved) {
        await savedItemsAPI.unsaveProject(project.id);
        setIsSaved(false);
      } else {
        await savedItemsAPI.saveProject(project.id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      alert('Failed to update saved status');
    } finally {
      setSavingInProgress(false);
    }
  };

  // Helper to format duration
  const formatDuration = (duration) => {
    const durationMap = {
      'less_1_month': 'Less than 1 month',
      '1_3_months': '1-3 months',
      '3_6_months': '3-6 months',
      '6_plus_months': '6+ months'
    };
    return durationMap[duration] || duration;
  };

  // Helper to format hours per week
  const formatHours = (hours) => {
    const hoursMap = {
      'less_30': 'Less than 30 hrs/week',
      'more_30': 'More than 30 hrs/week'
    };
    return hoursMap[hours] || hours;
  };

  // Helper to format job type
  const formatJobType = (jobType) => {
    return jobType === 'hourly' ? 'Hourly' : 'Fixed Price';
  };

  // Helper to format experience level
  const formatExperience = (level) => {
    const expMap = {
      'entry': 'Entry Level',
      'intermediate': 'Intermediate',
      'expert': 'Expert'
    };
    return expMap[level] || level;
  };

  // Helper to format location type
  const formatLocationType = (type) => {
    const locationMap = {
      'remote': 'Remote',
      'hybrid': 'Hybrid',
      'onsite': 'Onsite'
    };
    return locationMap[type] || type;
  };

  // Helper to format budget
  const formatBudget = () => {
    if (project.job_type === 'hourly' && (project.hourly_min || project.hourly_max)) {
      return `${formatCurrency(project.hourly_min || 0)} - ${formatCurrency(project.hourly_max || 0)}/hr`;
    } else if (project.job_type === 'fixed' && project.fixed_payment) {
      return formatCurrency(project.fixed_payment);
    } else {
      return `${formatCurrency(project.budget_min)} - ${formatCurrency(project.budget_max)}`;
    }
  };

  return (
    <Link to={`/projects/${project.id}`} className="relative block">
      {showSaveButton && (
        <button
          onClick={handleSaveToggle}
          disabled={savingInProgress}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition disabled:opacity-50"
          title={isSaved ? 'Remove from saved' : 'Save for later'}
        >
          <Bookmark
            size={18}
            className={isSaved ? 'text-purple-600 fill-purple-600' : 'text-gray-400'}
          />
        </button>
      )}
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 hover:shadow-xl hover:border-purple-400 transition-all cursor-pointer">
        {/* Header with Title and Category */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{project.title}</h3>
          
          {/* Category and Location Type Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {project.category && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                {project.category}
              </span>
            )}
            {project.location_type && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 capitalize">
                {formatLocationType(project.location_type)}
              </span>
            )}
            {project.experience_level && (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                {formatExperience(project.experience_level)}
              </span>
            )}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{project.description}</p>
        
        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.skills_required?.slice(0, 4).map((skill) => (
            <span
              key={skill.id}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
            >
              {skill.name}
            </span>
          ))}
          {project.skills_required?.length > 4 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              +{project.skills_required.length - 4} more
            </span>
          )}
        </div>

        {/* Project Details Grid */}
        <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          {/* Budget - Most Important */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <IndianRupee className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Budget:</span>
            </div>
            <span className="text-base font-bold text-green-600">
              {formatBudget()}
            </span>
          </div>

          {/* Job Type */}
          {project.job_type && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-medium">Type:</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatJobType(project.job_type)}
              </span>
            </div>
          )}

          {/* Duration */}
          {project.duration_estimate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Duration:</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatDuration(project.duration_estimate)}
              </span>
            </div>
          )}

          {/* Hours per week */}
          {project.hours_per_week && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Time:</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatHours(project.hours_per_week)}
              </span>
            </div>
          )}

          {/* Location */}
          {project.client_location && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Location:</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {project.client_location}
              </span>
            </div>
          )}
        </div>

        {/* Footer with Proposals and Date */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-600">
              <span className="font-bold text-purple-600">{project.proposal_count || 0}</span> proposals
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Client Name */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Posted by: <span className="font-semibold text-gray-700">{project.client_name || 'Client'}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}