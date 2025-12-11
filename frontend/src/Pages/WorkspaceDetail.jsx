// frontend/src/pages/WorkspaceDetail.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, CheckCircle, Clock, AlertCircle, Trash2,
  Edit, Send, IndianRupee, TrendingUp, Calendar, User,
  MessageSquare, Filter, Download, FileText, DollarSign
} from 'lucide-react';
import { workspacesAPI } from '../api/workspaces';
import { contractsAPI } from '../api/contracts';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import CalendarInput from '../components/CalendarInput';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function WorkspaceDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentRequestModal, setShowPaymentRequestModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    deadline: '',
    assigned_to: null
  });

  const [newPayment, setNewPayment] = useState({
    amount: '',
    description: '',
    payment_method: '',
    transaction_id: ''
  });

  const [newPaymentRequest, setNewPaymentRequest] = useState({
    amount: '',
    message: ''
  });

  // related contract metadata for review
  const [contractMeta, setContractMeta] = useState(null);

  useEffect(() => {
    loadWorkspaceData();
  }, [id]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      setContractMeta(null);

      const [wsRes, tasksRes, paymentsRes, requestsRes, statsRes] = await Promise.all([
        workspacesAPI.get(id),
        workspacesAPI.getTasks(id),
        workspacesAPI.getPayments(id),
        workspacesAPI.getPaymentRequests(id),
        workspacesAPI.getPaymentStats(id)
      ]);

      const ws = wsRes.data;
      setWorkspace(ws);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data.results || []);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : paymentsRes.data.results || []);
      setPaymentRequests(
        Array.isArray(requestsRes.data) ? requestsRes.data : requestsRes.data.results || []
      );
      setPaymentStats(statsRes.data);

      const contractId = ws.contract || ws.contract_id;
      if (contractId) {
        try {
          const cRes = await contractsAPI.get(contractId);
          setContractMeta(cRes.data);
        } catch (err) {
          console.error('Failed to load contract metadata for workspace:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
      alert('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      alert('Task title is required');
      return;
    }

    try {
      const taskData = {
        ...newTask,
        workspace: id,
        assigned_to: workspace.freelancer_id
      };

      if (!taskData.deadline) {
        delete taskData.deadline;
      }

      await workspacesAPI.createTask(taskData);
      setShowTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        deadline: '',
        assigned_to: null
      });
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await workspacesAPI.updateTaskStatus(taskId, newStatus);
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await workspacesAPI.deleteTask(taskId);
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Failed to delete task');
    }
  };

  const taskTimelineData = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;

    const completed = tasks.filter((t) => t.status === 'completed' && t.completed_at);
    if (completed.length === 0) return null;

    const byDate = {};
    completed.forEach((t) => {
      const d = new Date(t.completed_at);
      const key = d.toISOString().slice(0, 10);
      byDate[key] = (byDate[key] || 0) + 1;
    });

    const sortedDates = Object.keys(byDate).sort();
    let cumulative = 0;
    const labels = [];
    const data = [];

    sortedDates.forEach((date) => {
      cumulative += byDate[date];
      labels.push(date);
      data.push(cumulative);
    });

    return {
      labels,
      data,
      totalTasks: tasks.length,
      completedCount: completed.length
    };
  }, [tasks]);

  const handleAddComment = async (taskId) => {
    if (!commentText.trim()) return;

    try {
      await workspacesAPI.addTaskComment(taskId, commentText);
      setCommentText('');
      loadWorkspaceData();
      if (selectedTask?.id === taskId) {
        const updated = tasks.find((t) => t.id === taskId);
        setSelectedTask(updated);
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment');
    }
  };

  const handleLogPayment = async () => {
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      await workspacesAPI.createPayment({
        ...newPayment,
        workspace: id,
        received_by: workspace.freelancer_id
      });

      setShowPaymentModal(false);
      setNewPayment({
        amount: '',
        description: '',
        payment_method: '',
        transaction_id: ''
      });
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to log payment:', err);
      alert('Failed to log payment');
    }
  };

  const handleConfirmPayment = async (paymentId) => {
    try {
      await workspacesAPI.confirmPayment(paymentId);
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to confirm payment:', err);
      alert('Failed to confirm payment');
    }
  };

  const handleRequestPayment = async () => {
    if (!newPaymentRequest.amount || parseFloat(newPaymentRequest.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await workspacesAPI.createPaymentRequest({
        ...newPaymentRequest,
        workspace: id
      });

      setShowPaymentRequestModal(false);
      setNewPaymentRequest({ amount: '', message: '' });
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to request payment:', err);
      alert('Failed to request payment');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await workspacesAPI.approvePaymentRequest(requestId);
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to approve request:', err);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = window.prompt('Reason for rejection (optional):');
    try {
      await workspacesAPI.rejectPaymentRequest(requestId, reason || '');
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert('Failed to reject request');
    }
  };

  const handleMarkComplete = async () => {
    if (!window.confirm('Are you sure you want to mark this project as complete?')) return;

    try {
      await workspacesAPI.markComplete(id);
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to mark complete:', err);
      alert('Failed to mark complete');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-700 border-gray-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      overdue: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[status] || colors.todo;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-50 text-green-600',
      medium: 'bg-yellow-50 text-yellow-600',
      high: 'bg-red-50 text-red-600'
    };
    return colors[priority] || colors.medium;
  };

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'my-tasks') {
      return task.assigned_to === user.id || task.created_by === user.id;
    }
    return task.status === taskFilter;
  });

  const paymentProgressData = paymentStats
    ? {
        labels: ['Paid', 'Remaining'],
        datasets: [
          {
            data: [paymentStats.paid_amount, paymentStats.remaining_amount],
            backgroundColor: ['#10b981', '#e5e7eb'],
            borderColor: ['#059669', '#d1d5db'],
            borderWidth: 2
          }
        ]
      }
    : null;

  const paymentTimelineData = paymentStats?.timeline
    ? {
        labels: paymentStats.timeline.map((p) =>
          new Date(p.date).toLocaleDateString()
        ),
        datasets: [
          {
            label: 'Cumulative Payment',
            data: paymentStats.timeline.map((p) => p.cumulative),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      }
    : null;

  const taskStatusData = {
    labels: ['To Do', 'In Progress', 'Completed', 'Overdue'],
    datasets: [
      {
        label: 'Tasks',
        data: [
          tasks.filter((t) => t.status === 'todo').length,
          tasks.filter((t) => t.status === 'in_progress').length,
          tasks.filter((t) => t.status === 'completed').length,
          tasks.filter((t) => t.status === 'overdue').length
        ],
        backgroundColor: ['#9ca3af', '#3b82f6', '#10b981', '#ef4444']
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-red-700 text-lg font-semibold">Workspace not found</p>
            <button
              onClick={() => navigate('/workspace')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Workspaces
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isClient = user.id === workspace.client_id;
  const isFreelancer = user.id === workspace.freelancer_id;

  const canClientReview =
    isClient &&
    workspace.is_fully_completed &&
    contractMeta?.client_can_review &&
    user.id === contractMeta.client;

  const canFreelancerReview =
    isFreelancer &&
    workspace.is_fully_completed &&
    contractMeta?.freelancer_can_review &&
    user.id === contractMeta.freelancer;

  const showReviewButton = !!contractMeta && (canClientReview || canFreelancerReview);
  const reviewButtonLabel = isClient
    ? 'Review Freelancer'
    : isFreelancer
    ? 'Review Client'
    : 'Leave Review';

  const workspaceTypeLabel =
    workspace.workspace_type === 'job' ? 'Job Workspace' : 'Project Workspace';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/workspace')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Workspaces
          </button>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                {/* NEW: explicit Job / Project label */}
                <p className="text-sm font-semibold text-purple-600 mb-1">
                  {workspaceTypeLabel}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {workspace.contract_title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User size={16} />
                    Client: {workspace.client_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={16} />
                    Freelancer: {workspace.freelancer_name}
                  </span>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  workspace.is_fully_completed
                    ? 'bg-green-100 text-green-700'
                    : workspace.contract_status === 'active'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {workspace.is_fully_completed ? 'Completed' : workspace.contract_status}
              </span>
            </div>

            {/* Progress Overview */}
            <div className="grid md:grid-cols-4 gap-4 mt-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 mb-1">Total Tasks</p>
                <p className="text-2xl font-bold text-purple-900">
                  {workspace.total_tasks}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {workspace.completed_tasks}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-blue-900">
                  {workspace.pending_tasks}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-900">
                  {workspace.overdue_tasks}
                </p>
              </div>
            </div>

            {/* Completion Status */}
            {!workspace.is_fully_completed && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="text-yellow-600" size={20} />
                  <p className="font-semibold text-yellow-900">
                    {workspace.workspace_type === 'job'
                      ? 'Job Completion Status'
                      : 'Project Completion Status'}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    {workspace.client_marked_complete ? (
                      <CheckCircle className="text-green-500" size={18} />
                    ) : (
                      <Clock className="text-gray-400" size={18} />
                    )}
                    <span className="text-sm">
                      Client{' '}
                      {workspace.client_marked_complete
                        ? 'confirmed completion'
                        : 'pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {workspace.freelancer_marked_complete ? (
                      <CheckCircle className="text-green-500" size={18} />
                    ) : (
                      <Clock className="text-gray-400" size={18} />
                    )}
                    <span className="text-sm">
                      Freelancer{' '}
                      {workspace.freelancer_marked_complete
                        ? 'confirmed completion'
                        : 'pending'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleMarkComplete}
                  disabled={
                    (isClient && workspace.client_marked_complete) ||
                    (isFreelancer && workspace.freelancer_marked_complete)
                  }
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isClient && workspace.client_marked_complete
                    ? 'You marked as complete'
                    : isFreelancer && workspace.freelancer_marked_complete
                    ? 'You marked as complete'
                    : 'Mark as Complete'}
                </button>
              </div>
            )}

            {/* ✅ NEW: Review button moves here – only after BOTH confirm completion */}
            {showReviewButton && (
              <div className="mt-6 flex justify-end">
                <Link
                  to={`/contracts/${contractMeta.id}/review`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-sm"
                >
                  {reviewButtonLabel}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        {/* ... REST OF FILE UNCHANGED ... */}
        {/* (Keep all existing tabs, modals, TaskCard, etc. exactly as they were) */}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'tasks'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'payments'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Payments & Earnings
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Task Controls */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTaskFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      taskFilter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTaskFilter('my-tasks')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      taskFilter === 'my-tasks'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    My Tasks
                  </button>
                  <button
                    onClick={() => setTaskFilter('todo')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      taskFilter === 'todo'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    To Do
                  </button>
                  <button
                    onClick={() => setTaskFilter('in_progress')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      taskFilter === 'in_progress'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => setTaskFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      taskFilter === 'completed'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Completed
                  </button>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  <Plus size={20} />
                  Add Task
                </button>
              </div>
            </div>

            {/* Task Board */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* To Do Column */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  To Do ({filteredTasks.filter(t => t.status === 'todo').length})
                </h3>
                <div className="space-y-3">
                  {filteredTasks
                    .filter(t => t.status === 'todo')
                    .map(task => (
                    <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onClick={() => {
                        setSelectedTask(task);
                        setShowAllComments(false);  // show only latest comment initially
                    }}
                    isClient={isClient}
                    />

                    ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  In Progress ({filteredTasks.filter(t => t.status === 'in_progress').length})
                </h3>
                <div className="space-y-3">
                  {filteredTasks
                    .filter(t => t.status === 'in_progress')
                    .map(task => (
                    <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onClick={() => {
                        setSelectedTask(task);
                        setShowAllComments(false);  // show only latest comment initially
                    }}
                    isClient={isClient}
                    />

                    ))}
                </div>
              </div>

              {/* Completed Column */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Completed ({filteredTasks.filter(t => t.status === 'completed').length})
                </h3>
                <div className="space-y-3">
                  {filteredTasks
                    .filter(t => t.status === 'completed')
                    .map(task => (
                    <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onClick={() => {
                        setSelectedTask(task);
                        setShowAllComments(false);  // show only latest comment initially
                    }}
                    isClient={isClient}
                    />

                    ))}
                </div>
              </div>
            </div>

            {/* Overdue Tasks */}
            {filteredTasks.filter(t => t.status === 'overdue').length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={20} />
                  Overdue Tasks ({filteredTasks.filter(t => t.status === 'overdue').length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredTasks
                    .filter(t => t.status === 'overdue')
                    .map(task => (
                    <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onClick={() => {
                        setSelectedTask(task);
                        setShowAllComments(false);  // show only latest comment initially
                    }}
                    isClient={isClient}
                    />

                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payment Summary */}
            {paymentStats && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold mb-6">Payment Overview</h3>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ₹{paymentStats.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-900">
                      ₹{paymentStats.paid_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-orange-900">
                      ₹{paymentStats.remaining_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 mb-1">Progress</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {paymentStats.payment_percentage}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${paymentStats.payment_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  {paymentProgressData && (
                    <div>
                      <h4 className="font-semibold mb-4">Payment Distribution</h4>
                      <Doughnut
                        data={paymentProgressData}
                        options={{
                          plugins: {
                            legend: { position: 'bottom' }
                          }
                        }}
                      />
                    </div>
                  )}
                  {paymentTimelineData && paymentStats.timeline.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-4">Payment Timeline</h4>
                      <Line
                        data={paymentTimelineData}
                        options={{
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            y: { beginAtZero: true }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-wrap gap-4">
                {isClient && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <DollarSign size={20} />
                    Log Payment
                  </button>
                )}
                {isFreelancer && (
                  <button
                    onClick={() => setShowPaymentRequestModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    <Send size={20} />
                    Request Payment
                  </button>
                )}
              </div>
            </div>

            {/* Payment Requests */}
            {paymentRequests.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">Payment Requests</h3>
                <div className="space-y-3">
                  {paymentRequests.map(request => (
                    <div
                      key={request.id}
                      className="border rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          ₹{parseFloat(request.amount).toLocaleString()}
                        </p>
                        {request.message && (
                          <p className="text-sm text-gray-600 mt-1">{request.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {request.status}
                        </span>
                        {isClient && request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Payment History</h3>
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map(payment => (
                    <div
                      key={payment.id}
                      className="border rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          ₹{parseFloat(payment.amount).toLocaleString()}
                        </p>
                        {payment.description && (
                          <p className="text-sm text-gray-600 mt-1">{payment.description}</p>
                        )}
                        {payment.payment_method && (
                          <p className="text-xs text-gray-500 mt-1">
                            Method: {payment.payment_method}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(payment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {payment.freelancer_confirmed ? (
                          <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            <CheckCircle size={16} />
                            Confirmed
                          </span>
                        ) : (
                          <>
                            <span className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                              <Clock size={16} />
                              Pending Confirmation
                            </span>
                            {isFreelancer && (
                              <button
                                onClick={() => handleConfirmPayment(payment.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                              >
                                Confirm Receipt
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No payments logged yet</p>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-6">Task Analytics</h3>
            <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Task distribution (same for client & freelancer) */}
                <div>
                <h4 className="font-semibold mb-4">Task Distribution by Status</h4>
                <Bar
                    data={taskStatusData}
                    options={{
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                    }}
                />
                </div>

                {/* Right: different metric for client vs freelancer */}
                {isClient ? (
                // ---------- CLIENT VIEW ----------
                <div>
                    <h4 className="font-semibold mb-2">
                    Freelancer Progress Over Time
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                    Each point shows the total number of tasks completed by that date.
                    </p>

                    {taskTimelineData ? (
                    <Line
                        data={{
                        labels: taskTimelineData.labels,
                        datasets: [
                            {
                            label: 'Cumulative Completed Tasks',
                            data: taskTimelineData.data,
                            fill: false,
                            tension: 0.3,
                            },
                        ],
                        }}
                        options={{
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                        },
                        scales: {
                            x: {
                            ticks: { font: { size: 10 } },
                        },
                            y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, font: { size: 10 } },
                            },
                        },
                        }}
                        height={240}
                    />
                    ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-xs text-gray-400">
                        <p>
                        Once tasks are completed, you’ll see a progress curve here
                        showing how work is moving over time.
                        </p>
                    </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sm">
                    <div>
                        <p className="text-gray-500">Total Tasks</p>
                        <p className="font-semibold text-gray-900">{tasks.length}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Completed</p>
                        <p className="font-semibold text-green-600">
                        {taskTimelineData?.completedCount || 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Completion %</p>
                        <p className="font-semibold text-purple-600">
                        {tasks.length
                            ? Math.round(
                                ((taskTimelineData?.completedCount || 0) /
                                tasks.length) *
                                100
                            )
                            : 0}
                        %
                        </p>
                    </div>
                    </div>
                </div>
                ) : (
                // ---------- FREELANCER VIEW----------
                <div>
                    <h4 className="font-semibold mb-4">Task Completion Rate</h4>
                    <div className="flex flex-col items-center justify-center h-64">
                    <div className="relative w-48 h-48">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="10"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="10"
                            strokeDasharray={`${
                            workspace.total_tasks > 0
                                ? (workspace.completed_tasks /
                                    workspace.total_tasks) *
                                251.2
                                : 0
                            } 251.2`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                        />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-900">
                            {workspace.total_tasks > 0
                                ? Math.round(
                                    (workspace.completed_tasks /
                                    workspace.total_tasks) *
                                    100
                                )
                                : 0}
                            %
                            </p>
                            <p className="text-sm text-gray-600">Complete</p>
                        </div>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-gray-600">
                        {workspace.completed_tasks} of {workspace.total_tasks} tasks
                        completed
                        </p>
                    </div>
                    </div>
                </div>
                )}
            </div>
            </div>
        </div>
        )}


        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Create New Task</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter task title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows="4"
                      placeholder="Enter task description"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={newTask.status}
                        onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline (Optional)
                </label>
                <CalendarInput
                    value={newTask.deadline}               // expects "YYYY-MM-DD"
                    onChange={(val) => setNewTask({ ...newTask, deadline: val })}
                    placeholder="Select deadline"
                    className=""                            // you already have styling inside the component
                />
                </div>

                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreateTask}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Create Task
                  </button>
                  <button
                    onClick={() => {
                      setShowTaskModal(false);
                      setNewTask({
                        title: '',
                        description: '',
                        priority: 'medium',
                        status: 'todo',
                        deadline: '',
                        assigned_to: null
                      });
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Log Payment</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newPayment.description}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, description: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows="3"
                      placeholder="Payment description or notes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <input
                      type="text"
                      value={newPayment.payment_method}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, payment_method: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Bank Transfer, UPI, PayPal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={newPayment.transaction_id}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, transaction_id: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Transaction reference number"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleLogPayment}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Log Payment
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setNewPayment({
                        amount: '',
                        description: '',
                        payment_method: '',
                        transaction_id: ''
                      });
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Request Modal */}
        {showPaymentRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Request Payment</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={newPaymentRequest.amount}
                      onChange={(e) =>
                        setNewPaymentRequest({ ...newPaymentRequest, amount: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter requested amount"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newPaymentRequest.message}
                      onChange={(e) =>
                        setNewPaymentRequest({ ...newPaymentRequest, message: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows="4"
                      placeholder="Add a message explaining your payment request"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleRequestPayment}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Send Request
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentRequestModal(false);
                      setNewPaymentRequest({ amount: '', message: '' });
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Task Details */}
                  <div className="flex flex-wrap gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority.toUpperCase()} Priority
                    </span>
                  </div>

                  {selectedTask.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                      <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                        {selectedTask.description}
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Created By</p>
                      <p className="text-gray-900">{selectedTask.created_by_name}</p>
                    </div>
                    {/* {selectedTask.assigned_to_name && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Assigned To</p>
                        <p className="text-gray-900">{selectedTask.assigned_to_name}</p>
                      </div>
                    )} */}
                  </div>

                  {selectedTask.deadline && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Deadline</p>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(selectedTask.deadline).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare size={18} />
                Comments ({selectedTask.comments?.length || 0})
                </h3>

                {/* Toggle between latest comment vs all comments */}
                {(selectedTask.comments?.length || 0) > 1 && (
                <button
                    type="button"
                    onClick={() => setShowAllComments(prev => !prev)}
                    className="text-xs text-purple-600 hover:text-purple-800 mb-2"
                >
                    {showAllComments
                    ? 'Hide older comments'
                    : `View all comments (${selectedTask.comments.length})`}
                </button>
                )}

                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {(showAllComments
                    ? (selectedTask.comments || [])
                    : (selectedTask.comments || []).slice(-1)
                    ).map(comment => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                        {comment.user_avatar && (
                            <img
                            src={comment.user_avatar}
                            alt={comment.user_name}
                            className="w-6 h-6 rounded-full"
                            />
                        )}
                        <span className="font-semibold text-sm">{comment.user_name}</span>
                        <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                        </span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.comment}</p>
                    </div>
                    ))}
                </div>


                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Add a comment..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(selectedTask.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(selectedTask.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                {!isClient && selectedTask.status !== 'completed' && (
                    <button
                    onClick={() => {
                        handleUpdateTaskStatus(selectedTask.id, 'completed');
                        setSelectedTask(null);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                    Mark Complete
                    </button>
                )}
                    <button
                      onClick={() => {
                        handleDeleteTask(selectedTask.id);
                        setSelectedTask(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Card Component

function TaskCard({ task, onStatusChange, onDelete, onClick, isClient }) {
  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-700 border-gray-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      overdue: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[status] || colors.todo;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-50 text-green-600',
      medium: 'bg-yellow-50 text-yellow-600',
      high: 'bg-red-50 text-red-600'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 hover:border-purple-200"
    >
      <div className="flex justify-between items-start mb-1.5">
        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
          {task.title}
        </h4>
        <span
          className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {task.deadline && (
        <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-2">
          <Calendar size={11} />
          {new Date(task.deadline).toLocaleDateString()}
        </div>
      )}

      {/* Assigned-to is always freelancer, so we hide it from card */}

      {task.comments_count > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-2">
          <MessageSquare size={11} />
          {task.comments_count} comments
        </div>
      )}

      <div className="flex gap-2">
        {/* Only freelancer sees the progress button */}
        {!isClient && task.status !== 'completed' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus =
                task.status === 'todo'
                  ? 'in_progress'
                  : task.status === 'in_progress'
                  ? 'completed'
                  : 'completed';
              onStatusChange(task.id, nextStatus);
            }}
            className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 font-medium"
          >
            {task.status === 'todo' ? 'Start' : 'Complete'}
          </button>
        )}
      </div>
    </div>
  );
}