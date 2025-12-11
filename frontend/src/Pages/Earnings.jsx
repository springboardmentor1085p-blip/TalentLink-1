// frontend/src/pages/Earnings.jsx
import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Briefcase, CheckCircle, Calendar } from 'lucide-react';
import { workspacesAPI } from '../api/workspaces';
import { useNavigate } from 'react-router-dom';

export default function Earnings({ user }) {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedProjects: 0,
    activeProjects: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);

      // Get all workspaces where user is freelancer
      const wsRes = await workspacesAPI.list();
      const workspacesData = Array.isArray(wsRes.data) 
        ? wsRes.data 
        : wsRes.data.results || wsRes.data.workspaces || [];
      
      setWorkspaces(workspacesData);

      // Fetch payments from all workspaces
      const paymentsPromises = workspacesData.map(ws => 
        workspacesAPI.getPayments(ws.id).catch(() => ({ data: [] }))
      );
      
      const paymentsResults = await Promise.all(paymentsPromises);
      
      // Flatten and filter confirmed payments only
      const allPaymentsData = paymentsResults.flatMap(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        return data.filter(payment => payment.freelancer_confirmed);
      });

      setAllPayments(allPaymentsData);

      // Calculate stats
      const totalEarnings = allPaymentsData.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      // Get pending earnings from active workspaces
      const pendingEarnings = workspacesData
        .filter(ws => ws.contract_status === 'active')
        .reduce((sum, ws) => sum + (ws.remaining_amount || 0), 0);

      const completedProjects = workspacesData.filter(ws => ws.is_fully_completed).length;
      const activeProjects = workspacesData.filter(ws => ws.contract_status === 'active').length;

      setStats({
        totalEarnings,
        pendingEarnings,
        completedProjects,
        activeProjects
      });

    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group payments by workspace
  const paymentsByWorkspace = workspaces.map(ws => {
    const wsPayments = allPayments.filter(p => p.workspace === ws.id);
    const total = wsPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    return {
      workspace: ws,
      payments: wsPayments,
      total
    };
  }).filter(item => item.total > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3">
            <IndianRupee size={32} className="text-purple-600" />
            Earnings Overview
          </h1>
          <p className="text-gray-600">Track your confirmed payments and earnings history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <IndianRupee className="text-green-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Total Earnings</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{stats.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Confirmed payments only</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Pending Earnings</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{stats.pendingEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">From active contracts</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="text-blue-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Active Projects</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="text-purple-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Completed Projects</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.completedProjects}</p>
            <p className="text-xs text-gray-500 mt-1">Total completed</p>
          </div>
        </div>

        {/* Earnings by Project */}
        {paymentsByWorkspace.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Earnings by Project</h2>
            <div className="space-y-4">
              {paymentsByWorkspace.map(({ workspace, payments, total }) => (
                <div
                  key={workspace.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition cursor-pointer"
                  onClick={() => navigate(`/workspace/${workspace.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {workspace.contract_title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Client: {workspace.client_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">{payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  {/* Payment breakdown */}
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Payment History:</p>
                    <div className="space-y-2">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            {new Date(payment.confirmed_at || payment.created_at).toLocaleDateString('en-IN')}
                            {payment.description && ` - ${payment.description}`}
                          </span>
                          <span className="font-semibold text-gray-900">
                            ₹{parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Project Progress</span>
                      <span>
                        ₹{workspace.paid_amount?.toLocaleString('en-IN')} / ₹{workspace.total_amount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${workspace.total_amount > 0 ? (workspace.paid_amount / workspace.total_amount) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <IndianRupee className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Earnings Yet</h2>
            <p className="text-gray-600 mb-6">
              Once clients confirm payments in your workspaces, they'll appear here.
            </p>
            <button
              onClick={() => navigate('/workspace')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
            >
              View Workspaces
            </button>
          </div>
        )}

        {/* Recent Payments Timeline */}
        {allPayments.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
              <Calendar size={24} className="text-purple-600" />
              Recent Payments
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allPayments
                .sort((a, b) => new Date(b.confirmed_at || b.created_at) - new Date(a.confirmed_at || a.created_at))
                .slice(0, 20)
                .map((payment) => {
                  const workspace = workspaces.find(ws => ws.id === payment.workspace);
                  return (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {workspace?.contract_title || 'Unknown Project'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {payment.description || 'Payment received'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar size={12} />
                          {new Date(payment.confirmed_at || payment.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          ₹{parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}