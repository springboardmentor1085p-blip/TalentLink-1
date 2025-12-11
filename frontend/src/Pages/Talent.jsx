import { useState, useEffect } from 'react';
import { Search, MapPin, Star, IndianRupee, X, Award, TrendingUp } from 'lucide-react';
import FreelancerCard from '../components/FreelancerCard';
import { freelancersAPI } from '../api/freelancers';

export default function Talent() {
  const [freelancers, setFreelancers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [locationFilter, setLocationFilter] = useState('');
  const [topRated, setTopRated] = useState(false);
  const [risingTalent, setRisingTalent] = useState(false);
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [availability, setAvailability] = useState('');
  const [successRate, setSuccessRate] = useState('');

  useEffect(() => {
    loadFreelancers();
  }, []);

  const [filtersInitialized, setFiltersInitialized] = useState(false);
  
  useEffect(() => {
    if (filtersInitialized) {
      const timeoutId = setTimeout(() => {
        loadFreelancers();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setFiltersInitialized(true);
    }
  }, [locationFilter, topRated, risingTalent, minRate, maxRate, experienceLevel, availability, successRate]);

  const loadFreelancers = () => {
    setLoading(true);
    const params = {};
    
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    if (locationFilter) {
      params.location = locationFilter;
    }
    
    if (topRated) {
      params.top_rated = 'true';
    }
    
    if (risingTalent) {
      params.rising_talent = 'true';
    }
    
    if (minRate) {
      params.min_rate = minRate;
    }
    
    if (maxRate) {
      params.max_rate = maxRate;
    }
    
    if (experienceLevel) {
      params.experience_level = experienceLevel;
    }
    
    if (availability) {
      params.availability = availability;
    }
    
    if (successRate) {
      params.success_rate = successRate;
    }

    freelancersAPI
      .list(params)
      .then((res) => {
        const data = res.data.results || res.data;
        setFreelancers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load freelancers:', err);
        setFreelancers([]);
      })
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadFreelancers();
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTopRated(false);
    setRisingTalent(false);
    setMinRate('');
    setMaxRate('');
    setExperienceLevel('');
    setAvailability('');
    setSuccessRate('');
    setTimeout(() => {
      loadFreelancers();
    }, 100);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Talent</h1>
          <p className="text-gray-600">Discover skilled freelancers for your projects</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, skills, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </form>
        </div>

        <div className="flex gap-6">
          {/* Filter Section - Left Sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-5 sticky top-20">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Talent Type */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Talent Type
                </label>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={topRated}
                    onChange={(e) => setTopRated(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <Award size={16} className="text-yellow-500" />
                    <span className="text-sm text-gray-700">Top Rated (4.5+ ★)</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={risingTalent}
                    onChange={(e) => setRisingTalent(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-green-500" />
                    <span className="text-sm text-gray-700">Rising Talent</span>
                  </div>
                </label>
              </div>

              <div className="border-t border-gray-200 my-4" />

              {/* Hourly Rate */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <IndianRupee size={16} className="inline mr-1" />
                  Hourly Rate (₹/hr)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minRate}
                    onChange={(e) => setMinRate(e.target.value)}
                    className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxRate}
                    onChange={(e) => setMaxRate(e.target.value)}
                    className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 my-4" />

              {/* Experience Level */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div className="border-t border-gray-200 my-4" />

              {/* Availability */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Availability
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Any Availability</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              <div className="border-t border-gray-200 my-4" />

              {/* Location */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <MapPin size={16} className="inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="border-t border-gray-200 my-4" />

              {/* Project Success Rate */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Star size={16} className="inline mr-1 text-yellow-400 fill-yellow-400" />
                  Success Rate
                </label>
                <select
                  value={successRate}
                  onChange={(e) => setSuccessRate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Any Rate</option>
                  <option value="90">90%+ Success</option>
                  <option value="80">80%+ Success</option>
                  <option value="70">70%+ Success</option>
                </select>
              </div>
            </div>
          </div>

          {/* Freelancers Grid - Right Side */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600">Loading talent...</p>
              </div>
            ) : freelancers.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{freelancers.length}</span> freelancer{freelancers.length !== 1 ? 's' : ''} found
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {freelancers.map((freelancer) => (
                    <FreelancerCard key={freelancer.user?.id || freelancer.id} freelancer={freelancer} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No freelancers found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
