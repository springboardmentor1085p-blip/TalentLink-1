import { useState, useEffect } from 'react';
import { Search, X, MapPin, Star, Briefcase, MessageCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { messagesAPI } from '../api/messages';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minProjects, setMinProjects] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, [location, verifiedOnly, minProjects, searchTerm]);

  const loadClients = () => {
    setLoading(true);
    const params = {
      role: 'client',
      search: searchTerm,
      location: location,
    };

    if (verifiedOnly) params.verified = 'true';
    if (minProjects) params.min_projects = minProjects;

    client
      .get('/users/', { params })
      .then((res) => {
        const data = res.data.results || res.data;
        setClients(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load clients:', err);
        setClients([]);
      })
      .finally(() => setLoading(false));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocation('');
    setVerifiedOnly(false);
    setMinProjects('');
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleStartConversation = (clientId) => {
    // Messages.jsx listens to ?user= or ?userId= and opens that user's chat
    navigate(`/messages?user=${clientId}`);
  };
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Clients</h1>
          <p className="text-gray-600">Connect with clients and build relationships</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search clients by name, company, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters */}
          <aside className="w-72 bg-white rounded-lg shadow-md p-5 shrink-0 h-fit sticky top-20">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
              <h3 className="font-semibold text-base text-gray-900">Filters</h3>
              <button
                onClick={clearAllFilters}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-3 py-1.5 rounded-md transition"
              >
                Clear All
              </button>
            </div>

            {/* Verified Clients */}
            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm font-semibold text-gray-700">Verified Clients Only</span>
                </div>
              </label>
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Minimum Projects */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                <Briefcase size={16} className="inline mr-1" />
                Minimum Projects Posted
              </div>
              <input
                type="number"
                placeholder="e.g., 5"
                value={minProjects}
                onChange={(e) => setMinProjects(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
              />
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Location */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                <MapPin size={16} className="inline mr-1" />
                Location
              </div>
              <input
                type="text"
                placeholder="Enter location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </aside>

          {/* Clients Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600">Loading clients...</p>
              </div>
            ) : clients.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{clients.length}</span> client{clients.length !== 1 ? 's' : ''} found
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {clients.map((clientData) => (
                    <div key={clientData.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {clientData.avatar ? (
                            <img
                              src={clientData.avatar}
                              alt={`${clientData.first_name} ${clientData.last_name}`}
                              className="w-14 h-14 rounded-full object-cover border-2 border-purple-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-200">
                              <span className="text-purple-600 font-semibold text-lg">
                                {clientData.first_name?.[0]}{clientData.last_name?.[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {clientData.first_name} {clientData.last_name}
                            </h3>
                            {clientData.client_profile?.company_name && (
                              <p className="text-sm text-gray-600">{clientData.client_profile.company_name}</p>
                            )}
                          </div>
                        </div>
                        {clientData.client_profile?.is_verified && (
                          <CheckCircle size={20} className="text-green-500" title="Verified Client" />
                        )}
                      </div>

                      {clientData.bio && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-3">{clientData.bio}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{clientData.rating_avg?.toFixed(1) || '0.0'}</span>
                        </div>
                        {clientData.location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={16} />
                            <span>{clientData.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Briefcase size={16} />
                          <span>
                            {(clientData.client_profile?.projects_posted ?? 0)} projects
                            {' · '}
                            {(clientData.client_profile?.jobs_posted ?? 0)} jobs
                          </span>
                        </div>

                      </div>

                      <button
                        onClick={() => handleStartConversation(clientData.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
                      >
                        <MessageCircle size={16} />
                        Start Conversation
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}