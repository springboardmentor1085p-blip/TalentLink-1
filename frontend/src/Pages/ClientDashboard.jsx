import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Users,
  IndianRupee,
  Clock,
  MapPin,
  Award,
  Layers,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Star,
  MessageCircle,
  ArrowRight,
  Zap,
  Shield
} from 'lucide-react';

import Card from '../components/Card';
import { projectsAPI } from '../api/projects';
import { jobsAPI } from '../api/jobs';
import { jobApplicationsAPI } from '../api/jobApplications';

const DashboardCard = ({ title, value, icon: Icon, color, isCurrency, subtitle, trend }) => {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 hover:shadow-lg transition-all duration-200 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            {isCurrency ? `₹${Number(value || 0).toLocaleString('en-IN')}` : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl ${colorClasses[color]} flex-shrink-0`}>
          <Icon size={20} className="sm:w-[24px] sm:h-[24px]" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <TrendingUp size={12} className="text-green-500" />
          <span className="text-green-600 font-medium">{trend}</span>
        </div>
      )}
    </div>
  );
};

export default function ClientDashboard({ user }) {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalProposals: 0,
  });

  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applicationCounts, setApplicationCounts] = useState({});
  const [activeTab, setActiveTab] = useState('projects');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

    const loadDashboardData = async () => {
    try {
      const projectsRes = await projectsAPI.list({ my_projects: true });
      const myProjects = projectsRes.data.results || projectsRes.data;
      
      console.log('✅ Loaded my projects:', myProjects.length);
      setProjects(myProjects);

      const projectProposalCount = myProjects.reduce(
        (sum, p) => sum + (p.proposal_count || 0),
        0
      );

      const jobsRes = await jobsAPI.list({ my_jobs: true });
      const myJobs = jobsRes.data.results || jobsRes.data;
      
      console.log('✅ Loaded my jobs:', myJobs.length);
      setJobs(myJobs);

      let jobApplicationCount = 0;
      const counts = {};

      for (const job of myJobs) {
        try {
          const appsResponse = await jobApplicationsAPI.list({ job: job.id });
          const count = appsResponse.data.results?.length || 0;
          counts[job.id] = count;
          jobApplicationCount += count;
        } catch {
          counts[job.id] = 0;
        }
      }

      setApplicationCounts(counts);

      const totalProposals = projectProposalCount + jobApplicationCount;

      const activeProjectCount = myProjects.filter((p) =>
        ['open', 'in_progress'].includes(p.status)
      ).length;
      const completedProjectCount = myProjects.filter(
        (p) => p.status === 'completed'
      ).length;

      const activeJobCount = myJobs.filter((j) =>
        ['open', 'in_progress'].includes(j.status)
      ).length;
      const completedJobCount = myJobs.filter(
        (j) => j.status === 'completed'
      ).length;

      setStats({
        totalProjects: myProjects.length,
        activeProjects: activeProjectCount,
        completedProjects: completedProjectCount,
        totalJobs: myJobs.length,
        activeJobs: activeJobCount,
        completedJobs: completedJobCount,
        totalProposals: totalProposals,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleCreateProject = () => navigate('/projects/create');
  const handleCreateJob = () => navigate('/jobs/create');

  const formatBudget = (project) => {
    if (project.job_type === 'hourly' && (project.hourly_min || project.hourly_max)) {
      return `₹${project.hourly_min || 0} - ₹${project.hourly_max || 0}/hr`;
    } else if (project.job_type === 'fixed' && project.fixed_payment) {
      return `₹${project.fixed_payment}`;
    } else {
      return `₹${project.budget_min} - ₹${project.budget_max}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const totalOpenWork = (stats.activeProjects || 0) + (stats.activeJobs || 0);
  const totalCompleted = (stats.completedProjects || 0) + (stats.completedJobs || 0);
  const isVerified = user?.client_profile?.is_verified;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="container mx-auto px-4">

        {/* PERSONALIZED WELCOME HEADER */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.first_name || 'Client'}! 👋
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Here's what's happening with your projects and jobs
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleCreateJob}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 font-semibold text-sm sm:text-base transition flex items-center justify-center gap-2"
              >
                <Briefcase size={18} />
                Post New Job
              </button>
              <button
                onClick={handleCreateProject}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 font-semibold text-sm sm:text-base transition flex items-center justify-center gap-2"
              >
                <Layers size={18} />
                Post New Project
              </button>
            </div>
          </div>

          {/* Verification Status Banner */}
          {!isVerified && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 sm:p-5 shadow-md">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg flex-shrink-0">
                  <Shield className="text-yellow-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 mb-1 text-base sm:text-lg">
                    Get Verified to Build Trust
                  </h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Verified clients get 3x more quality proposals and attract top-rated freelancers
                  </p>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold text-sm shadow-md transition"
                  >
                    <CheckCircle size={16} />
                    Complete Verification
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KEY STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <DashboardCard
            title="Total Work Posted"
            value={(stats.totalProjects || 0) + (stats.totalJobs || 0)}
            icon={Layers}
            color="purple"
            subtitle={`${stats.totalProjects} projects • ${stats.totalJobs} jobs`}
          />
          <DashboardCard
            title="Active Work"
            value={totalOpenWork}
            icon={Zap}
            color="blue"
            subtitle="Currently in progress"
          />
          <DashboardCard
            title="Total Proposals"
            value={stats.totalProposals || 0}
            icon={Users}
            color="orange"
            subtitle="Across all your projects and jobs"
          />
          <DashboardCard
            title="Completed"
            value={totalCompleted}
            icon={CheckCircle}
            color="green"
            subtitle="Successfully finished"
          />
        </div>

        {/* DETAILED STATS OVERVIEW */}
        <Card className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="text-purple-600" size={22} />
              Detailed Overview
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">
              <CheckCircle size={14} />
              At a glance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {/* Projects Breakdown */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={18} className="text-purple-600" />
                <h3 className="font-semibold text-gray-900">Projects</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Posted:</span>
                  <span className="font-bold text-gray-900">{stats.totalProjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-bold text-blue-600">{stats.activeProjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-bold text-green-600">{stats.completedProjects}</span>
                </div>
              </div>
            </div>

            {/* Jobs Breakdown */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-indigo-50 to-white">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Jobs</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Posted:</span>
                  <span className="font-bold text-gray-900">{stats.totalJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-bold text-blue-600">{stats.activeJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-bold text-green-600">{stats.completedJobs}</span>
                </div>
              </div>
            </div>


          </div>
        </Card>

        {/* TABS FOR PROJECTS & JOBS */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2 sm:gap-4 px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-all ${
                  activeTab === 'projects'
                    ? 'text-purple-600 border-b-3 border-purple-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Layers size={18} />
                <span>Projects ({stats.totalProjects})</span>
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-all ${
                  activeTab === 'jobs'
                    ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Briefcase size={18} />
                <span>Jobs ({stats.totalJobs})</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'projects' ? (
              // PROJECTS VIEW
              projects.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block border-2 border-gray-200 rounded-xl p-4 sm:p-5 hover:border-purple-400 hover:shadow-lg transition-all group"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-base sm:text-lg line-clamp-2 group-hover:text-purple-600 transition flex-1">
                          {project.title}
                        </h3>
                        <span
                          className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border ml-2 flex-shrink-0 ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      {/* Skills */}
                      {project.skills_required && project.skills_required.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {project.skills_required.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 sm:px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-100"
                            >
                              {typeof skill === 'string' ? skill : skill.name || skill}
                            </span>
                          ))}
                          {project.skills_required.length > 3 && (
                            <span className="px-2 sm:px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{project.skills_required.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Info Box */}
                      <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <IndianRupee size={14} />
                            Budget:
                          </div>
                          <span className="font-bold">{formatBudget(project)}</span>
                        </div>
                        {project.experience_level && (
                          <div className="flex justify-between">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Award size={14} /> Level:
                            </div>
                            <span className="font-semibold capitalize">{project.experience_level}</span>
                          </div>
                        )}
                        {project.location_type && (
                          <div className="flex justify-between">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <MapPin size={14} /> Type:
                            </div>
                            <span className="font-semibold capitalize">{project.location_type}</span>
                          </div>
                        )}
                        {project.duration && (
                          <div className="flex justify-between">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Clock size={14} /> Duration:
                            </div>
                            <span className="font-semibold">
                              {project.duration.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center border-t pt-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-purple-600" />
                          <span className="font-semibold text-purple-700">
                            {project.proposal_count || 0}
                          </span>
                          <span className="text-gray-600">proposals</span>
                        </div>
                        <ArrowRight size={16} className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <Layers size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    No projects posted yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                    Start your journey by posting your first project and connect with talented freelancers
                  </p>
                  <button
                    onClick={handleCreateProject}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shadow-md transition"
                  >
                    <Layers size={18} />
                    Post Your First Project
                  </button>
                </div>
              )
            ) : (
              // JOBS VIEW
              jobs.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      className="block border-2 border-gray-200 rounded-xl p-4 sm:p-5 hover:border-indigo-400 hover:shadow-lg transition-all group"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-base sm:text-lg line-clamp-2 group-hover:text-indigo-600 transition flex-1">
                          {job.title}
                        </h3>
                        <span
                          className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border ml-2 flex-shrink-0 ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Type Badge */}
                      <div className="mb-3">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full capitalize font-medium">
                          {job.job_type === 'hourly' ? 'Hourly' : 'Fixed Price'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Info Box */}
                      <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <div className="flex gap-1.5 items-center text-gray-600">
                            <IndianRupee size={14} /> Payment:
                          </div>
                          <span className="font-bold text-green-600">
                            {job.job_type === 'hourly' && job.hourly_min && job.hourly_max
                              ? `₹${job.hourly_min}-${job.hourly_max}/hr`
                              : job.job_type === 'fixed' && job.fixed_amount
                              ? `₹${job.fixed_amount}`
                              : 'Not specified'}
                          </span>
                        </div>
                        {job.experience_level && (
                          <div className="flex justify-between">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Award size={14} /> Level:
                            </div>
                            <span className="font-semibold capitalize">{job.experience_level}</span>
                          </div>
                        )}
                        {job.location_type && (
                          <div className="flex justify-between">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <MapPin size={14} /> Type:
                            </div>
                            <span className="font-semibold capitalize">{job.location_type}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center pt-3 border-t text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-indigo-600" />
                          <span className="font-semibold text-indigo-700">
                            {applicationCounts[job.id] || 0}
                          </span>
                          <span className="text-gray-600">
                            application{(applicationCounts[job.id] || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <ArrowRight size={16} className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    No jobs posted yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                    Post your first job listing and start receiving applications from qualified candidates
                  </p>
                  <button
                    onClick={handleCreateJob}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition"
                  >
                    <Briefcase size={18} />
                    Post Your First Job
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* SUCCESS TIPS SECTION */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-5 sm:p-6 shadow-md">
          <h3 className="font-bold text-purple-900 mb-4 text-base sm:text-lg flex items-center gap-2">
            <Target className="text-purple-600" size={20} />
            Tips to Attract Top Talent
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-purple-600" size={18} />
                <p className="font-semibold text-sm text-purple-900">Clear Descriptions</p>
              </div>
              <p className="text-xs text-purple-700">Detailed project briefs get 2x more proposals</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="text-purple-600" size={18} />
                <p className="font-semibold text-sm text-purple-900">Fair Budgets</p>
              </div>
              <p className="text-xs text-purple-700">Market-rate budgets attract quality freelancers</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="text-purple-600" size={18} />
                <p className="font-semibold text-sm text-purple-900">Quick Responses</p>
              </div>
              <p className="text-xs text-purple-700">Reply within 24 hours to keep freelancers engaged</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Star className="text-purple-600" size={18} />
                <p className="font-semibold text-sm text-purple-900">Leave Reviews</p>
              </div>
              <p className="text-xs text-purple-700">Build reputation and attract better talent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
