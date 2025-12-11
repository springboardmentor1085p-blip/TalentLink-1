// frontend/src/pages/FreelancerDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, IndianRupee, FileText, TrendingUp, User, CheckCircle, 
  AlertCircle, Edit2, Layers, Clock, Star, ArrowRight, DollarSign,
  Target, Award, Zap
} from 'lucide-react';
import { authAPI } from '../api/auth';
import { jobApplicationsAPI } from '../api/jobApplications';
import { workspacesAPI } from '../api/workspaces';
import { calculateProfileCompletion, getCompletionColor, getCompletionMessage } from '../api/profileCompletionUtils';

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

export default function FreelancerDashboard({ user }) {
  const [stats, setStats] = useState({
    activeJobs: 0,
    proposalsSent: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    completedProjects: 0,
    activeProjects: 0,
  });
  const [proposals, setProposals] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('projects');
  const [contracts, setContracts] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [missingItems, setMissingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [freelancerProfile, setFreelancerProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch profile
        const prof = await authAPI.getFreelancerProfile();
        const p = prof.data || {};
        
        if (mounted) {
          setFreelancerProfile(p);
          
          // Calculate profile completion using unified utility
          const completion = calculateProfileCompletion(user, p);
          setProfileCompletion(completion.percentage);
          setMissingItems(completion.missingItems);
        }
        
        let prop = [], contr = [], jobApps = [], workspaces = [];
        
        // Fetch proposals
        if (authAPI.getMyProposals) {
          try { 
            const r = await authAPI.getMyProposals(); 
            prop = Array.isArray(r.data) ? r.data : (r.data?.results || []);
          } catch (err) {
            console.error('Error fetching proposals:', err);
          }
        }
        
        // Fetch job applications
        try {
          const r = await jobApplicationsAPI.list();
          jobApps = Array.isArray(r.data) ? r.data : (r.data?.results || []);
        } catch (err) {
          console.error('Error fetching job applications:', err);
        }
        
        // Fetch contracts
        if (authAPI.getMyContracts) {
          try { 
            const r = await authAPI.getMyContracts(); 
            contr = Array.isArray(r.data) ? r.data : (r.data?.results || []);
          } catch (err) {
            console.error('Error fetching contracts:', err);
          }
        }

        // Fetch workspaces for real-time earnings
        try {
          const wsRes = await workspacesAPI.list();
          const workspacesData = Array.isArray(wsRes.data) 
            ? wsRes.data 
            : wsRes.data.results || wsRes.data.workspaces || [];
          workspaces = workspacesData;

          // Fetch payments from all workspaces
          const paymentsPromises = workspacesData.map(ws => 
            workspacesAPI.getPayments(ws.id).catch(() => ({ data: [] }))
          );
          
          const paymentsResults = await Promise.all(paymentsPromises);
          
          // Calculate real earnings from confirmed payments
          const allPayments = paymentsResults.flatMap(res => {
            const data = Array.isArray(res.data) ? res.data : res.data.results || [];
            return data.filter(payment => payment.freelancer_confirmed);
          });

          const totalEarnings = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
          
          // Calculate pending earnings from active workspaces
          const pendingEarnings = workspacesData
            .filter(ws => ws.contract_status === 'active')
            .reduce((sum, ws) => sum + (ws.remaining_amount || 0), 0);

          const completedProjects = workspacesData.filter(ws => ws.is_fully_completed).length;
          const activeProjects = workspacesData.filter(ws => ws.contract_status === 'active').length;

          if (!mounted) return;

          setStats({
            activeJobs: contr.filter(c => c.status === 'active').length || 0,
            proposalsSent: (prop.length + jobApps.length) || 0,
            totalEarnings: totalEarnings || 0,
            pendingEarnings: pendingEarnings || 0,
            completedProjects: completedProjects || 0,
            activeProjects: activeProjects || 0,
          });

        } catch (err) {
          console.error('Error fetching workspaces/payments:', err);
          
          if (!mounted) return;
          
          setStats({
            activeJobs: contr.filter(c => c.status === 'active').length || 0,
            proposalsSent: (prop.length + jobApps.length) || 0,
            totalEarnings: p.total_earnings || 0,
            pendingEarnings: 0,
            completedProjects: p.projects_completed || 0,
            activeProjects: contr.filter(c => c.status === 'active').length || 0,
          });
        }
        
        if (!mounted) return;
        
        setProposals(Array.isArray(prop) ? prop : []);
        setJobApplications(Array.isArray(jobApps) ? jobApps : []);
        setContracts(Array.isArray(contr) ? contr : []);
        
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        if (mounted) setError('Failed to load dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { mounted = false; };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Get active and pending contracts for display
  const activeAndPendingContracts = Array.isArray(contracts) 
    ? contracts.filter(c => c.status === 'active' || c.status === 'pending') 
    : [];

  const completionColor = getCompletionColor(profileCompletion);
  const completionMessage = getCompletionMessage(profileCompletion);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-4 sm:py-6 px-3 sm:px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name || 'Freelancer'}! 👋
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Here's what's happening with your freelance business
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Profile Completion Alert */}
        {profileCompletion < 100 && (
          <div className={`mb-6 border-2 rounded-xl p-4 sm:p-5 ${
            completionColor === 'green' 
              ? 'bg-green-50 border-green-200' 
              : completionColor === 'yellow' 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${
                completionColor === 'green' 
                  ? 'bg-green-100' 
                  : completionColor === 'yellow' 
                  ? 'bg-yellow-100' 
                  : 'bg-red-100'
              }`}>
                <AlertCircle size={24} className={
                  completionColor === 'green' 
                    ? 'text-green-600' 
                    : completionColor === 'yellow' 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                } />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">
                  Profile {profileCompletion}% Complete
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 mb-3">
                  {completionMessage}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      completionColor === 'green' 
                        ? 'bg-green-500' 
                        : completionColor === 'yellow' 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {missingItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {missingItems.slice(0, 4).map((item, i) => (
                      <span 
                        key={i} 
                        className="text-xs px-2 py-1 bg-white rounded-full border border-gray-300 text-gray-700"
                      >
                        • {item}
                      </span>
                    ))}
                    {missingItems.length > 4 && (
                      <span className="text-xs px-2 py-1 bg-white rounded-full border border-gray-300 text-gray-700">
                        +{missingItems.length - 4} more
                      </span>
                    )}
                  </div>
                )}
                <Link 
                  to="/profile" 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  Complete Profile <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
          <DashboardCard
            title="Total Earnings"
            value={stats.totalEarnings}
            icon={IndianRupee}
            color="green"
            isCurrency
            subtitle="Confirmed payments"
          />
          <DashboardCard
            title="Pending Earnings"
            value={stats.pendingEarnings}
            icon={Clock}
            color="orange"
            isCurrency
            subtitle="From active projects"
          />
          <DashboardCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={Briefcase}
            color="blue"
            subtitle={`${stats.activeJobs} active contracts`}
          />
          <DashboardCard
            title="Completed Projects"
            value={stats.completedProjects}
            icon={CheckCircle}
            color="purple"
            subtitle={`${stats.proposalsSent} proposals sent`}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="text-purple-600" size={20} />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/projects"
                className="block w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium text-sm text-center"
              >
                Browse Projects
              </Link>
              <Link
                to="/jobs"
                className="block w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm text-center"
              >
                Browse Jobs
              </Link>
              <Link
                to="/workspace"
                className="block w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium text-sm text-center"
              >
                My Workspaces
              </Link>
              <Link
                to="/earnings"
                className="block w-full px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium text-sm text-center"
              >
                View Earnings
              </Link>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="text-purple-600" size={32} />
                    </div>
                  )}
                  {user?.rating_avg > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full px-2 py-0.5 border-2 border-white">
                      <div className="flex items-center gap-1">
                        <Star size={10} className="fill-white text-white" />
                        <span className="text-xs font-bold text-white">{user.rating_avg.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {freelancerProfile?.role_title || 'Freelancer'}
                  </p>
                  {user?.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <span>📍</span> {user.location}
                    </p>
                  )}
                </div>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                <Edit2 size={14} />
                Edit
              </Link>
            </div>

            {/* Skills preview */}
            {freelancerProfile?.skills && freelancerProfile.skills.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">TOP SKILLS</p>
                <div className="flex flex-wrap gap-2">
                  {freelancerProfile.skills.slice(0, 6).map((skill, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {skill.name}
                    </span>
                  ))}
                  {freelancerProfile.skills.length > 6 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      +{freelancerProfile.skills.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  ₹{freelancerProfile?.hourly_rate || 0}
                </p>
                <p className="text-xs text-gray-600">Hourly Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {freelancerProfile?.skills?.length || 0}
                </p>
                <p className="text-xs text-gray-600">Skills</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {profileCompletion}%
                </p>
                <p className="text-xs text-gray-600">Complete</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Proposals & Applications Tabs */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition">
            <div className="p-4 sm:p-5 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  My Submissions
                </h2>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      activeTab === 'projects'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="hidden sm:inline">Project </span>Proposals ({proposals.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      activeTab === 'jobs'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Job Apps ({jobApplications.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 max-h-96 overflow-y-auto">
              {activeTab === 'projects' ? (
                <>
                  {Array.isArray(proposals) && proposals.length > 0 ? (
                    <div className="space-y-3">
                      {proposals.slice(0, 5).map((proposal) => (
                        <Link
                          key={proposal.id}
                          to={`/proposals/${proposal.id}`}
                          className="block border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-sm transition group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-purple-600 transition">
                              {proposal.project_title || 'Untitled Project'}
                            </h3>
                            <ArrowRight size={16} className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                          </div>
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span className="text-sm text-gray-600 font-medium">
                              ₹{Number(proposal.bid_amount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              proposal.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {proposal.status}
                            </span>
                          </div>
                        </Link>
                      ))}
                      {proposals.length > 5 && (
                        <Link 
                          to="/proposals" 
                          className="block text-center text-sm text-purple-600 hover:text-purple-700 hover:underline py-2 font-medium"
                        >
                          View all {proposals.length} proposals →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <FileText className="mx-auto text-gray-300 mb-3" size={40} />
                      <p className="text-gray-600 mb-4 text-sm font-medium">No project proposals yet</p>
                      <Link 
                        to="/projects" 
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm shadow-md transition"
                      >
                        Browse Projects <ArrowRight size={16} />
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {Array.isArray(jobApplications) && jobApplications.length > 0 ? (
                    <div className="space-y-3">
                      {jobApplications.slice(0, 5).map((app) => (
                        <Link
                          key={app.id}
                          to={`/jobs/${app.job_id || app.job}`}
                          className="block border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-600 transition">
                              {app.job_title || 'Untitled Job'}
                            </h3>
                            <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                          </div>
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span className="text-sm text-gray-600 font-medium">
                              ₹{Number(app.bid_amount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                        </Link>
                      ))}
                      {jobApplications.length > 5 && (
                        <p className="text-center text-sm text-blue-600 py-2 font-medium">
                          {jobApplications.length - 5} more job applications
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <FileText className="mx-auto text-gray-300 mb-3" size={40} />
                      <p className="text-gray-600 mb-4 text-sm font-medium">No job applications yet</p>
                      <Link 
                        to="/jobs" 
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-md transition"
                      >
                        Browse Jobs <ArrowRight size={16} />
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Contracts */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 hover:shadow-lg transition">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="text-purple-600" size={20} />
                Active & Pending Contracts
              </h2>
              <Link 
                to="/contracts" 
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold whitespace-nowrap hover:underline"
              >
                View All →
              </Link>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {activeAndPendingContracts.length > 0 ? (
                <div className="space-y-3">
                  {activeAndPendingContracts.slice(0, 5).map((contract) => (
                    <Link
                      key={contract.id}
                      to={`/contracts/${contract.id}`}
                      className="block border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-sm transition group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-purple-600 transition">
                          {contract.job_title || contract.project_title || `Contract #${contract.id}`}
                        </h3>
                        <ArrowRight size={16} className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                        Client: {contract.client_name || 'Unknown'}
                      </p>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        contract.status === 'active' 
                          ? 'bg-blue-100 text-blue-700' 
                          : contract.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {contract.status}
                      </span>
                    </Link>
                  ))}
                  {activeAndPendingContracts.length > 5 && (
                    <p className="text-center text-sm text-purple-600 py-2 font-medium">
                      {activeAndPendingContracts.length - 5} more contracts
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Briefcase className="mx-auto text-gray-300 mb-3" size={40} />
                  <p className="text-gray-600 text-sm font-medium mb-1">No active or pending contracts</p>
                  <p className="text-xs text-gray-500">Contracts will appear here once proposals are accepted</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Tips */}
        {profileCompletion < 100 && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 sm:p-6 shadow-md">
            <h3 className="font-bold text-blue-900 mb-4 text-base sm:text-lg flex items-center gap-2">
              <Target className="text-blue-600" size={20} />
              Tips to Boost Your Success
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="text-blue-600" size={18} />
                  <p className="font-semibold text-sm text-blue-900">Complete Profile</p>
                </div>
                <p className="text-xs text-blue-700">Get 40% more profile views</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="text-blue-600" size={18} />
                  <p className="font-semibold text-sm text-blue-900">Add Portfolio</p>
                </div>
                <p className="text-xs text-blue-700">Showcase your best work</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="text-blue-600" size={18} />
                  <p className="font-semibold text-sm text-blue-900">Get Reviews</p>
                </div>
                <p className="text-xs text-blue-700">Build client trust</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-blue-600" size={18} />
                  <p className="font-semibold text-sm text-blue-900">Stay Active</p>
                </div>
                <p className="text-xs text-blue-700">Apply to projects daily</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}