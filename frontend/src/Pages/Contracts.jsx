import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, FileText, Clock, ArrowRight, Briefcase, Layers } from 'lucide-react';
import { contractsAPI } from '../api/contracts';

export default function Contracts({ user }) {
  const [contracts, setContracts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const res = await contractsAPI.list();
      setContracts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter((contract) =>
    filter === 'all' ? true : contract.status === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Contracts</h1>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            {['all', 'pending', 'active', 'completed'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} (
                {contracts.filter((c) => (type === 'all' ? true : c.status === type)).length})
              </button>
            ))}
          </div>
        </div>

        {/* Contracts List */}
        {filteredContracts.length > 0 ? (
          <div className="space-y-4">
            {filteredContracts.map((contract) => {
              const isJobContract = !!contract.job_title;
              const title = contract.job_title || contract.project_title || `Contract #${contract.id}`;
              const labelColor = isJobContract
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700';

              return (
                <Link
                  key={contract.id}
                  to={`/contracts/${contract.id}`}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        {/* Title and Type */}
                        <div className="flex items-start justify-between">
                          <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-purple-600 transition">
                            {title}
                          </h2>
                          <ArrowRight
                            className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4"
                            size={24}
                          />
                        </div>

                        {/* Contract Type Tag */}
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${labelColor}`}
                          >
                            {isJobContract ? (
                              <>
                                <Briefcase size={14} />
                                Job Contract
                              </>
                            ) : (
                              <>
                                <Layers size={14} />
                                Project Contract
                              </>
                            )}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="mt-3 space-y-1.5">
                          <p className="text-gray-600 text-sm">
                            <strong>Client:</strong> {contract.client_name}
                          </p>
                          <p className="text-gray-600 text-sm">
                            <strong>Freelancer:</strong> {contract.freelancer_name}
                          </p>
                          <p className="text-gray-600 text-sm">
                            <strong>Created:</strong>{' '}
                            {new Date(contract.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <span
                        className={`ml-4 px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ${
                          contract.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : contract.status === 'active'
                            ? 'bg-blue-100 text-blue-700'
                            : contract.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </div>

                    {/* Signature Status */}
                    <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        {contract.client_signed ? (
                          <CheckCircle className="text-green-500" size={18} />
                        ) : (
                          <Clock className="text-gray-400" size={18} />
                        )}
                        <span className="text-sm text-gray-600">
                          Client {contract.client_signed ? 'Signed' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {contract.freelancer_signed ? (
                          <CheckCircle className="text-green-500" size={18} />
                        ) : (
                          <Clock className="text-gray-400" size={18} />
                        )}
                        <span className="text-sm text-gray-600">
                          Freelancer {contract.freelancer_signed ? 'Signed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg mb-2">No contracts found</p>
            <p className="text-gray-500 text-sm">
              {filter !== 'all'
                ? `No ${filter} contracts at the moment.`
                : 'Contracts will appear here once proposals or job applications are accepted.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
