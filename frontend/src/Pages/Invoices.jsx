// frontend/src/pages/Invoices.jsx
import { useState, useEffect } from 'react';
import { FileText, IndianRupee, Download, Calendar, CheckCircle, User, CreditCard } from 'lucide-react';
import { workspacesAPI } from '../api/workspaces';
import { useNavigate } from 'react-router-dom';
// import html2pdf from 'html2pdf.js';

// Invoice Template Component for PDF Generation
function InvoiceTemplate({ payment, workspace, user }) {
  const paymentDate = new Date(payment.confirmed_at || payment.created_at);

  // ==== NEW: safe freelancer details (for on-screen invoice) ====
  const safeFirstName = user && user.first_name ? user.first_name : '';
  const safeLastName = user && user.last_name ? user.last_name : '';

  const freelancerName =
    `${safeFirstName} ${safeLastName}`.trim() ||
    workspace?.freelancer_name ||
    workspace?.freelancer_full_name ||
    workspace?.freelancer_username ||
    'Freelancer';

  const freelancerEmail =
    (user && user.email) ||
    workspace?.freelancer_email ||
    '';

  const freelancerPhone =
    (user && user.phone) ||
    workspace?.freelancer_phone ||
    '';
  // =============================================================

  return (
    <div className="invoice-template" style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #9333ea', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ margin: '0', color: '#9333ea', fontSize: '32px' }}>TalentLink</h1>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Professional Freelance Platform</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0', fontSize: '24px', color: '#333' }}>INVOICE</h2>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>#{payment.id}</p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
              {paymentDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* From/To Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '10px', textTransform: 'uppercase' }}>From (Client)</h3>
          <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
            {payment.paid_by_name || workspace?.client_name || 'Client'}
          </p>
          {workspace?.client_name && (
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>Client ID: {workspace.client_id}</p>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '10px', textTransform: 'uppercase' }}>To (Freelancer)</h3>
          <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
            {freelancerName}
          </p>
          {freelancerEmail && (
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>{freelancerEmail}</p>
          )}
          {freelancerPhone && (
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>{freelancerPhone}</p>
          )}
        </div>
      </div>

      {/* Project Details */}
      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '10px', textTransform: 'uppercase' }}>Project Details</h3>
        <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
          {workspace?.contract_title || 'Project'}
        </p>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
          Contract ID: {workspace?.contract_id}
        </p>
        {workspace && (
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
            Status: {workspace.is_fully_completed ? 'Completed' : workspace.contract_status}
          </p>
        )}
      </div>

      {/* Payment Details Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
              Description
            </th>
            <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '15px 12px', fontSize: '14px', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>
              {payment.description || 'Payment for services rendered'}
            </td>
            <td style={{ padding: '15px 12px', textAlign: 'right', fontSize: '14px', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>
              ₹{parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td style={{ padding: '15px 12px', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
              Total Amount
            </td>
            <td style={{ padding: '15px 12px', textAlign: 'right', fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
              ₹{parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Payment Information */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '15px', textTransform: 'uppercase' }}>Payment Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>Payment Date</p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#333' }}>
              {paymentDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {payment.confirmed_at && (
            <div>
              <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>Confirmed On</p>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#333' }}>
                {new Date(payment.confirmed_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}
          {payment.payment_method && (
            <div>
              <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>Payment Method</p>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#333' }}>{payment.payment_method}</p>
            </div>
          )}
          {payment.transaction_id && (
            <div>
              <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>Transaction ID</p>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#333', fontFamily: 'monospace' }}>
                {payment.transaction_id}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ 
        backgroundColor: '#d1fae5', 
        border: '1px solid #10b981',
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0', fontSize: '14px', color: '#065f46', fontWeight: '600' }}>
          ✓ PAYMENT CONFIRMED
        </p>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginTop: '40px' }}>
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          This is a computer-generated invoice and does not require a signature.
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          TalentLink • Professional Freelance Platform • Generated on {new Date().toLocaleDateString('en-IN')}
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          All amounts in Indian Rupees (₹ INR)
        </p>
      </div>
    </div>
  );
}

export default function Invoices({ user }) {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [downloading, setDownloading] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadInvoiceData();
  }, []);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);

      const wsRes = await workspacesAPI.list();
      const workspacesData = Array.isArray(wsRes.data)
        ? wsRes.data
        : wsRes.data.results || wsRes.data.workspaces || [];

      setWorkspaces(workspacesData);

      const paymentsPromises = workspacesData.map(ws =>
        workspacesAPI.getPayments(ws.id).catch(() => ({ data: [] }))
      );

      const paymentsResults = await Promise.all(paymentsPromises);

      const allPaymentsData = paymentsResults.flatMap(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        return data.filter(payment => payment.freelancer_confirmed);
      });

      setAllPayments(allPaymentsData);

    } catch (err) {
      console.error('Failed to load invoice data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Download invoice as PDF
  const downloadInvoice = async (payment, workspace) => {
    setDownloading(payment.id);
    
    try {
      // Create a temporary container for the invoice
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      // Render the invoice template
      const root = document.createElement('div');
      tempDiv.appendChild(root);
      
      // Create invoice HTML
      root.innerHTML = createInvoiceHTML(payment, workspace, user);

      // PDF options
      const opt = {
        margin: 10,
        filename: `Invoice_${payment.id}_${workspace?.contract_title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Payment'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate PDF
      await html2pdf().set(opt).from(root).save();

      // Cleanup
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate invoice PDF. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // Create invoice HTML string
  const createInvoiceHTML = (payment, workspace, user) => {
    const paymentDate = new Date(payment.confirmed_at || payment.created_at);

    // ==== NEW: safe freelancer details (for PDF HTML) ====
    const safeFirstName = user && user.first_name ? user.first_name : '';
    const safeLastName = user && user.last_name ? user.last_name : '';

    const freelancerName =
      `${safeFirstName} ${safeLastName}`.trim() ||
      (workspace && (workspace.freelancer_name || workspace.freelancer_full_name || workspace.freelancer_username)) ||
      'Freelancer';

    const freelancerEmail =
      (user && user.email) ||
      (workspace && workspace.freelancer_email) ||
      '';

    const freelancerPhone =
      (user && user.phone) ||
      (workspace && workspace.freelancer_phone) ||
      '';
    // =====================================================

    return `
      <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #9333ea; padding-bottom: 20px; margin-bottom: 30px;">
          <table style="width: 100%;">
            <tr>
              <td style="vertical-align: top;">
                <h1 style="margin: 0; color: #9333ea; font-size: 32px;">TalentLink</h1>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">Professional Freelance Platform</p>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <h2 style="margin: 0; font-size: 24px; color: #333;">INVOICE</h2>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">#${payment.id}</p>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">
                  ${paymentDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </td>
            </tr>
          </table>
        </div>

        <!-- From/To Section -->
        <table style="width: 100%; margin-bottom: 40px;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <h3 style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase;">From (Client)</h3>
              <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #333;">
                ${payment.paid_by_name || (workspace && workspace.client_name) || 'Client'}
              </p>
              ${workspace && workspace.client_name ? `<p style="margin: 5px 0; font-size: 14px; color: #666;">Client ID: ${workspace.client_id}</p>` : ''}
            </td>
            <td style="width: 50%; vertical-align: top;">
              <h3 style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase;">To (Freelancer)</h3>
              <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #333;">
                ${freelancerName}
              </p>
              ${freelancerEmail ? `<p style="margin: 5px 0; font-size: 14px; color: #666;">${freelancerEmail}</p>` : ''}
              ${freelancerPhone ? `<p style="margin: 5px 0; font-size: 14px; color: #666;">${freelancerPhone}</p>` : ''}
            </td>
          </tr>
        </table>

        <!-- Project Details -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase;">Project Details</h3>
          <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #333;">
            ${(workspace && workspace.contract_title) || 'Project'}
          </p>
          <p style="margin: 5px 0; font-size: 14px; color: #666;">Contract ID: ${workspace ? workspace.contract_id : ''}</p>
          ${workspace ? `<p style="margin: 5px 0; font-size: 14px; color: #666;">
            Status: ${workspace.is_fully_completed ? 'Completed' : workspace.contract_status}
          </p>` : ''}
        </div>

        <!-- Payment Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                Description
              </th>
              <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 15px 12px; font-size: 14px; color: #4b5563; border-bottom: 1px solid #e5e7eb;">
                ${payment.description || 'Payment for services rendered'}
              </td>
              <td style="padding: 15px 12px; text-align: right; font-size: 14px; color: #4b5563; border-bottom: 1px solid #e5e7eb;">
                ₹${parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 15px 12px; font-size: 16px; font-weight: bold; color: #111827;">
                Total Amount
              </td>
              <td style="padding: 15px 12px; text-align: right; font-size: 18px; font-weight: bold; color: #059669;">
                ₹${parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Payment Information -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 14px; color: #666; margin-bottom: 15px; text-transform: uppercase;">Payment Information</h3>
          <table style="width: 100%;">
            <tr>
              <td style="width: 50%; padding: 5px 0;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">Payment Date</p>
                <p style="margin: 5px 0; font-size: 14px; color: #333;">
                  ${paymentDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </td>
              ${payment.confirmed_at ? `
              <td style="width: 50%; padding: 5px 0;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">Confirmed On</p>
                <p style="margin: 5px 0; font-size: 14px; color: #333;">
                  ${new Date(payment.confirmed_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </td>` : ''}
            </tr>
            <tr>
              ${payment.payment_method ? `
              <td style="width: 50%; padding: 5px 0;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">Payment Method</p>
                <p style="margin: 5px 0; font-size: 14px; color: #333;">${payment.payment_method}</p>
              </td>` : ''}
              ${payment.transaction_id ? `
              <td style="width: 50%; padding: 5px 0;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">Transaction ID</p>
                <p style="margin: 5px 0; font-size: 14px; color: #333; font-family: monospace;">${payment.transaction_id}</p>
              </td>` : ''}
            </tr>
          </table>
        </div>

        <!-- Status Badge -->
        <div style="background-color: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 600;">✓ PAYMENT CONFIRMED</p>
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 40px;">
          <p style="margin: 5px 0; font-size: 12px; color: #9ca3af; text-align: center;">
            This is a computer-generated invoice and does not require a signature.
          </p>
          <p style="margin: 5px 0; font-size: 12px; color: #9ca3af; text-align: center;">
            TalentLink • Professional Freelance Platform • Generated on ${new Date().toLocaleDateString('en-IN')}
          </p>
          <p style="margin: 5px 0; font-size: 12px; color: #9ca3af; text-align: center;">
            All amounts in Indian Rupees (₹ INR)
          </p>
        </div>
      </div>
    `;
  };

  const filteredPayments = allPayments.filter(payment => {
    const paymentDate = new Date(payment.confirmed_at || payment.created_at);
    const now = new Date();

    switch (selectedPeriod) {
      case 'this-month':
        return (
          paymentDate.getMonth() === now.getMonth() &&
          paymentDate.getFullYear() === now.getFullYear()
        );
      case 'last-month': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          paymentDate.getMonth() === lastMonth.getMonth() &&
          paymentDate.getFullYear() === lastMonth.getFullYear()
        );
      }
      case 'this-year':
        return paymentDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  const sortedPayments = [...filteredPayments].sort(
    (a, b) => new Date(b.confirmed_at || b.created_at) - new Date(a.confirmed_at || a.created_at)
  );

  const periodTotal = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const getWorkspaceForPayment = (payment) => {
    return workspaces.find(ws => ws.id === payment.workspace);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
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
            <FileText size={32} className="text-purple-600" />
            Invoices & Payment History
          </h1>
          <p className="text-gray-600">Detailed records of all confirmed payments</p>
        </div>

        {/* Period Filter & Stats */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPeriod === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setSelectedPeriod('this-month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPeriod === 'this-month'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setSelectedPeriod('last-month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPeriod === 'last-month'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setSelectedPeriod('this-year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPeriod === 'this-year'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Year
              </button>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Period Total</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{periodTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">{filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Payment Transactions */}
        {sortedPayments.length > 0 ? (
          <div className="space-y-4">
            {sortedPayments.map((payment) => {
              const workspace = getWorkspaceForPayment(payment);
              const paymentDate = new Date(payment.confirmed_at || payment.created_at);

              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
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
                        <p className="text-3xl font-bold text-green-600">
                          ₹{parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Confirmed
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
                            <p className="text-xs text-gray-600">Paid By</p>
                            <p className="font-semibold text-gray-900">
                              {payment.paid_by_name || workspace?.client_name || 'Client'}
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
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                      <button
                        onClick={() => downloadInvoice(payment, workspace)}
                        disabled={downloading === payment.id}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloading === payment.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download size={16} />
                            Download Invoice
                          </>
                        )}
                      </button>
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
            <FileText className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Invoices for This Period
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedPeriod === 'all'
                ? 'Once clients confirm payments, invoices will appear here.'
                : 'Try selecting a different time period or check back later.'}
            </p>
            {selectedPeriod !== 'all' && (
              <button
                onClick={() => setSelectedPeriod('all')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                View All Invoices
              </button>
            )}
          </div>
        )}

        {/* Summary Footer */}
        {sortedPayments.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Currency</p>
                <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  <IndianRupee size={24} />
                  INR
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{periodTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}