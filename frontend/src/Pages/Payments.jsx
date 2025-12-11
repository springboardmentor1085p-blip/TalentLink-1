// frontend/src/pages/Payments.jsx
import { useState, useEffect } from 'react';
import { IndianRupee, CreditCard, Calendar, CheckCircle, Clock, User, FileText } from 'lucide-react';
import { workspacesAPI } from '../api/workspaces';
import { useNavigate } from 'react-router-dom';

export default function Payments({ user }) {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, confirmed, pending
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingConfirmation: 0,
    totalTransactions: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);

      // Get all workspaces where user is client
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

      // Flatten all payments
      const allPaymentsData = paymentsResults.flatMap(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        return data;
      });

      setAllPayments(allPaymentsData);

      // Calculate stats
      const totalPaid = allPaymentsData
        .filter(p => p.freelancer_confirmed)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const pendingConfirmation = allPaymentsData
        .filter(p => !p.freelancer_confirmed)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      setStats({
        totalPaid,
        pendingConfirmation,
        totalTransactions: allPaymentsData.length
      });

    } catch (err) {
      console.error('Failed to load payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter payments
  const filteredPayments = allPayments.filter(payment => {
    if (filter === 'confirmed') return payment.freelancer_confirmed;
    if (filter === 'pending') return !payment.freelancer_confirmed;
    return true;
  });

  // Sort by date (newest first)
  const sortedPayments = [...filteredPayments].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  // Get workspace for payment
  const getWorkspaceForPayment = (payment) => {
    return workspaces.find(ws => ws.id === payment.workspace);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment data...</p>
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
            <CreditCard size={32} className="text-purple-600" />
            Payment History
          </h1>
          <p className="text-gray-600">Track all payments made to freelancers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Total Paid</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{stats.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Confirmed payments</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Pending Confirmation</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{stats.pendingConfirmation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Awaiting freelancer confirmation</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
            <p className="text-xs text-gray-500 mt-1">All payments logged</p>
          </div>
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
              All ({allPayments.length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'confirmed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed ({allPayments.filter(p => p.freelancer_confirmed).length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({allPayments.filter(p => !p.freelancer_confirmed).length})
            </button>
          </div>
        </div>

        {/* Payment List */}
        {sortedPayments.length > 0 ? (
          <div className="space-y-4">
            {sortedPayments.map((payment) => {
              const workspace = getWorkspaceForPayment(payment);
              const paymentDate = new Date(payment.created_at);
              const isConfirmed = payment.freelancer_confirmed;

              return (
                <div
                  key={payment.id}
                  className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden ${
                    !isConfirmed ? 'border-l-4 border-yellow-400' : ''
                  }`}
                >
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${isConfirmed ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            {isConfirmed ? (
                              <CheckCircle className="text-green-600" size={24} />
                            ) : (
                              <Clock className="text-yellow-600" size={24} />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              Payment #{payment.id}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {workspace?.contract_title || 'Unknown Project'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">
                          ₹{parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span
                          className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            isConfirmed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {isConfirmed ? 'Confirmed' : 'Pending Confirmation'}
                        </span>
                      </div>
                    </div>

                    {/* Payment Details Grid */}
                    <div className="grid md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                      {/* Left Column */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Calendar className="text-purple-600 mt-0.5" size={18} />
                          <div>
                            <p className="text-xs text-gray-600">Payment Date</p>
                            <p className="font-semibold text-gray-900">
                              {paymentDate.toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {paymentDate.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <User className="text-purple-600 mt-0.5" size={18} />
                          <div>
                            <p className="text-xs text-gray-600">Paid To</p>
                            <p className="font-semibold text-gray-900">
                              {payment.received_by_name || workspace?.freelancer_name || 'Freelancer'}
                            </p>
                          </div>
                        </div>

                        {payment.payment_method && (
                          <div className="flex items-start gap-3">
                            <CreditCard className="text-purple-600 mt-0.5" size={18} />
                            <div>
                              <p className="text-xs text-gray-600">Payment Method</p>
                              <p className="font-semibold text-gray-900">
                                {payment.payment_method}
                              </p>
                            </div>
                          </div>
                        )}

                        {isConfirmed && payment.confirmed_at && (
                          <div className="flex items-start gap-3">
                            <CheckCircle className="text-green-600 mt-0.5" size={18} />
                            <div>
                              <p className="text-xs text-gray-600">Confirmed On</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(payment.confirmed_at).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3">
                        {payment.transaction_id && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                            <p className="font-mono text-sm bg-white px-3 py-2 rounded border border-gray-200 text-gray-900">
                              {payment.transaction_id}
                            </p>
                          </div>
                        )}

                        {payment.description && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Description</p>
                            <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                              {payment.description}
                            </p>
                          </div>
                        )}

                        {workspace && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Project Status</p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  workspace.is_fully_completed
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {workspace.is_fully_completed ? 'Completed' : workspace.contract_status}
                              </span>
                              <button
                                onClick={() => navigate(`/workspace/${workspace.id}`)}
                                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                              >
                                View Workspace →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      {!isConfirmed && (
                        <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
                          <Clock size={16} />
                          <span>Waiting for freelancer to confirm receipt</span>
                        </div>
                      )}
                      {isConfirmed && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                          <CheckCircle size={16} />
                          <span>Payment confirmed by freelancer</span>
                        </div>
                      )}
                      {workspace && (
                        <button
                          onClick={() => navigate(`/workspace/${workspace.id}`)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
                        >
                          View Project
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <CreditCard className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No Payments Yet' : `No ${filter} Payments`}
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Once you log payments in your workspaces, they will appear here.'
                : `Try selecting a different filter or log payments in your workspaces.`}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                View All Payments
              </button>
            )}
          </div>
        )}

        {/* Summary Note */}
        {allPayments.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
            <div className="flex items-start gap-3">
              <IndianRupee className="text-blue-600 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Payment Information</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• All payments are logged in Indian Rupees (₹ INR)</li>
                  <li>• Payments must be confirmed by freelancers to be considered complete</li>
                  <li>• You can manage payments for each project in the Workspace section</li>
                  <li>• Payment history is available for all your completed and active projects</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}