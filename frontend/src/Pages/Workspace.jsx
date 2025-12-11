// frontend/src/pages/Workspace.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, TrendingUp, ArrowRight, Layers } from 'lucide-react';
import { workspacesAPI } from '../api/workspaces';

export default function Workspace({ user }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await workspacesAPI.list();

      let data = res.data;

      // Normalize to always be an array
      if (Array.isArray(data)) {
        setWorkspaces(data);
      } else if (Array.isArray(data.results)) {
        // DRF paginated response
        setWorkspaces(data.results);
      } else if (Array.isArray(data.workspaces)) {
       
        setWorkspaces(data.workspaces);
      } else {
        console.error('Unexpected workspaces response:', data);
        setWorkspaces([]);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkspaces = workspaces.filter((ws) => {
    if (filter === 'active') return ws.contract_status === 'active';
    if (filter === 'completed') return ws.is_fully_completed;
    return true;
  });

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTaskProgressPercentage = (ws) => {
    if (ws.total_tasks === 0) return 0;
    return Math.round((ws.completed_tasks / ws.total_tasks) * 100);
  };

  const getPaymentProgressPercentage = (ws) => {
    if (ws.total_amount === 0) return 0;
    return Math.round((ws.paid_amount / ws.total_amount) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Layers className="text-purple-600" size={40} />
            Workspaces
          </h1>
          <p className="text-gray-600">
            Manage your active projects and jobs, and track progress in one place
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({workspaces.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({workspaces.filter((w) => w.contract_status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({workspaces.filter((w) => w.is_fully_completed).length})
            </button>
          </div>
        </div>

        {/* Workspace Cards */}
        {filteredWorkspaces.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Briefcase className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Workspaces Found</h2>
            <p className="text-gray-600 mb-6">
              Workspaces are created automatically when contracts become active.
            </p>
            <button
              onClick={() =>
                navigate(user?.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer')
              }
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((workspace) => {
              const taskProgress = getTaskProgressPercentage(workspace);
              const paymentProgress = getPaymentProgressPercentage(workspace);

              return (
                <div
                  key={workspace.id}
                  onClick={() => navigate(`/workspace/${workspace.id}`)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg line-clamp-2">
                        {workspace.contract_title}
                      </h3>
                      <ArrowRight
                        className="text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                        size={20}
                      />
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Briefcase size={14} />
                        {workspace.contract_status}
                      </span>

                      {/* NEW: show whether this is a Job or Project workspace */}
                      {workspace.workspace_type && (
                        <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                          <Layers size={12} />
                          {workspace.workspace_type === 'job'
                            ? 'Job Workspace'
                            : 'Project Workspace'}
                        </span>
                      )}

                      {workspace.is_fully_completed && (
                        <span className="flex items-center gap-1 bg-green-400 px-2 py-0.5 rounded-full">
                          <CheckCircle size={12} />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    {/* Participants */}
                    <div className="mb-4 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Client:</span>
                        <span className="font-medium text-gray-900">
                          {workspace.client_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Freelancer:</span>
                        <span className="font-medium text-gray-900">
                          {workspace.freelancer_name}
                        </span>
                      </div>
                    </div>

                    {/* Task Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock size={14} />
                          Tasks Progress
                        </span>
                        <span className="font-bold text-gray-900">{taskProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(
                            taskProgress
                          )} transition-all duration-500`}
                          style={{ width: `${taskProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{workspace.completed_tasks} completed</span>
                        <span>{workspace.total_tasks} total</span>
                      </div>
                    </div>

                    {/* Payment Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 flex items-center gap-1">
                          <TrendingUp size={14} />
                          Payment Progress
                        </span>
                        <span className="font-bold text-gray-900">
                          {paymentProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(
                            paymentProgress
                          )} transition-all duration-500`}
                          style={{ width: `${paymentProgress}%` }}
                        />
                      </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>₹{workspace.paid_amount.toLocaleString()} paid</span>
                      <span>₹{workspace.total_amount.toLocaleString()} total</span>
                    </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {workspace.pending_tasks}
                        </div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {workspace.overdue_tasks}
                        </div>
                        <div className="text-xs text-gray-500">Overdue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          ₹{workspace.remaining_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Remaining</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}