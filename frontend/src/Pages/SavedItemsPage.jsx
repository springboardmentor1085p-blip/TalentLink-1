// frontend/src/pages/SavedItemsPage.jsx
import { useState, useEffect } from 'react';
import { Bookmark, Briefcase, FolderOpen, MapPin, IndianRupee, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { savedItemsAPI } from '../api/savedItems';
import ProjectCard from '../components/ProjectCard';

export default function SavedItemsPage() {
  const [activeTab, setActiveTab] = useState('projects');
  const [savedProjects, setSavedProjects] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = async () => {
    try {
      setLoading(true);
      const [projectsRes, jobsRes] = await Promise.all([
        savedItemsAPI.getSavedProjects(),
        savedItemsAPI.getSavedJobs(),
      ]);

      // Extract the actual project/job data from saved items
      const projects = (projectsRes.data.results || projectsRes.data || []).map(item => item.project);
      const jobs = (jobsRes.data.results || jobsRes.data || []).map(item => item.job);

      setSavedProjects(projects);
      setSavedJobs(jobs);
    } catch (err) {
      console.error('Failed to load saved items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveProject = async (projectId) => {
    try {
      await savedItemsAPI.unsaveProject(projectId);
      setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error('Failed to unsave project:', err);
      alert('Failed to remove project');
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      await savedItemsAPI.unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error('Failed to unsave job:', err);
      alert('Failed to remove job');
    }
  };

  const formatJobType = (jobType) => {
    return jobType === 'hourly' ? 'Hourly' : 'Fixed Price';
  };

  const formatExperience = (level) => {
    const expMap = {
      'entry': 'Entry Level',
      'intermediate': 'Intermediate',
      'expert': 'Expert'
    };
    return expMap[level] || level;
  };

  const formatLocationType = (type) => {
    const locationMap = {
      'remote': 'Remote',
      'hybrid': 'Hybrid',
      'onsite': 'Onsite'
    };
    return locationMap[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading saved items...</p>
        </div>
      </div>
    );
  }

  const currentItems = activeTab === 'projects' ? savedProjects : savedJobs;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Bookmark className="text-purple-600" />
            Saved Items
          </h1>
          <p className="text-gray-600">Projects and jobs you've bookmarked for later</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition flex items-center justify-center gap-2 ${
                activeTab === 'projects'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <FolderOpen size={20} />
              Saved Projects ({savedProjects.length})
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition flex items-center justify-center gap-2 ${
                activeTab === 'jobs'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Briefcase size={20} />
              Saved Jobs ({savedJobs.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {currentItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bookmark size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No saved {activeTab === 'projects' ? 'projects' : 'jobs'} yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start bookmarking {activeTab === 'projects' ? 'projects' : 'jobs'} you're interested in to view them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeTab === 'projects' ? (
           
              savedProjects.map((project) => (
                <div key={project.id} className="relative">
                  <ProjectCard project={project} showSaveButton={false} />
                  <button
                    onClick={() => handleUnsaveProject(project.id)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition z-10"
                    title="Remove from saved"
                  >
                    <Bookmark size={18} className="text-purple-600 fill-purple-600" />
                  </button>
                </div>
              ))
            ) : (
            
              savedJobs.map((job) => (
                <div key={job.id} className="relative">
                  <Link to={`/jobs/${job.id}`}>
                    <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 hover:shadow-xl hover:border-purple-400 transition-all cursor-pointer">
                      {/* Job Card Content */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{job.title}</h3>
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                            {job.status === 'open' ? 'Open' : job.status}
                          </span>
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200 capitalize">
                            {formatJobType(job.job_type)}
                          </span>
                          {job.experience_level && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                              {formatExperience(job.experience_level)}
                            </span>
                          )}
                          {job.location_type && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 capitalize">
                              {formatLocationType(job.location_type)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{job.description}</p>

                      {/* Job Details */}
                      <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <IndianRupee className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">Payment:</span>
                          </div>
                          <span className="text-base font-bold text-green-600">
                            {job.job_type === 'hourly' && (job.hourly_min || job.hourly_max)
                              ? `₹${job.hourly_min || 0} - ₹${job.hourly_max || 0}/hr`
                              : job.job_type === 'fixed' && job.fixed_amount
                              ? `₹${job.fixed_amount}`
                              : 'Not specified'}
                          </span>
                        </div>

                        {job.location && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm font-medium">Location:</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{job.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Unsave Button */}
                  <button
                    onClick={() => handleUnsaveJob(job.id)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition z-10"
                    title="Remove from saved"
                  >
                    <Bookmark size={18} className="text-purple-600 fill-purple-600" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}