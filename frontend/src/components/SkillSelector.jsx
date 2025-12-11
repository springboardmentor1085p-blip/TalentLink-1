
import { useState, useEffect } from 'react';
import { Search, Plus, X, Loader } from 'lucide-react';
import client from '../api/client';

export default function SkillSelector({ selectedSkills = [], setSelectedSkills }) {
  const [allSkills, setAllSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadSkills(); }, []);
  useEffect(() => {
    if (searchTerm.length >= 2) searchSkills();
    else if (searchTerm.length === 0) loadSkills();
  }, [searchTerm]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const response = await client.get('/skills/');
      const skillsData = response.data.results || response.data;
      setAllSkills(Array.isArray(skillsData) ? skillsData : []);
    } catch (err) {
      console.error('Failed to load skills:', err);
      setAllSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const searchSkills = async () => {
    setLoading(true);
    try {
      const response = await client.get('/skills/', { params: { search: searchTerm } });
      const skillsData = response.data.results || response.data;
      setAllSkills(Array.isArray(skillsData) ? skillsData : []);
    } catch (err) {
      console.error('Search failed:', err);
      setAllSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    const safeSelected = Array.isArray(selectedSkills) ? selectedSkills : [];
    if (safeSelected.find((s) => s.id === skill.id)) {
      setSelectedSkills(safeSelected.filter((s) => s.id !== skill.id));
    } else {
      setSelectedSkills([...safeSelected, skill]);
    }
  };

  const createCustomSkill = async () => {
    if (!customSkillName.trim()) return setError('Please enter a skill name');
    if (customSkillName.length < 2) return setError('Skill name must be at least 2 characters');

    setCreating(true);
    setError('');
    try {
      const response = await client.post('/skills/create_custom/', { name: customSkillName.trim() });
      const newSkill = response.data;
      setAllSkills([newSkill, ...allSkills]);
      const safeSelected = Array.isArray(selectedSkills) ? selectedSkills : [];
      setSelectedSkills([...safeSelected, newSkill]);
      setCustomSkillName(''); setShowCustomInput(false); setSearchTerm('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create skill');
    } finally {
      setCreating(false);
    }
  };

  const safeSelectedSkills = Array.isArray(selectedSkills) ? selectedSkills : [];
  const filteredSkills = Array.isArray(allSkills)
    ? allSkills.filter(skill => !safeSelectedSkills.find(s => s.id === skill.id))
    : [];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search skills (e.g., React, Python, Design)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
        />

        {searchTerm && !loading && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
            title="Clear"
          >
            <X size={18} />
          </button>
        )}

        {/* Loader stays at the far right */}
        {loading && (
          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={20} />
        )}
      </div>

      {/* Selected Skills */}
      {safeSelectedSkills.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Skills ({safeSelectedSkills.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {safeSelectedSkills.map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-2 bg-purple-600 text-white rounded-full text-sm cursor-pointer hover:bg-purple-700 transition flex items-center gap-2"
                onClick={() => toggleSkill(skill)}
              >
                {skill.name}
                <X size={14} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Skill Button */}
      {!showCustomInput && (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
        >
          <Plus size={18} />
          Add Custom Skill
        </button>
      )}

      {/* Custom Skill Input */}
      {showCustomInput && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-purple-900">Add Custom Skill</h4>
            <button
              type="button"
              onClick={() => { setShowCustomInput(false); setCustomSkillName(''); setError(''); }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={customSkillName}
              onChange={(e) => setCustomSkillName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createCustomSkill()}
              placeholder="Enter skill name (e.g., Figma, Blender)"
              className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
              maxLength={50}
            />
            <button
              type="button"
              onClick={createCustomSkill}
              disabled={creating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating ? (<><Loader size={18} className="animate-spin" />Adding...</>) : (<><Plus size={18} />Add</>)}
            </button>
          </div>
          <p className="text-xs text-purple-700 mt-2">💡 If the skill doesn't exist, it will be created and added to your profile</p>
        </div>
      )}

      {/* Available Skills Grid */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Skills (click to add)
        </label>
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="animate-spin text-purple-600" size={32} />
            </div>
          ) : filteredSkills.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className="px-3 py-2 text-left rounded-lg bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition text-sm"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p className="mb-2">No skills found</p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Add "{searchTerm}" as a custom skill
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Skills Count Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Select 5-15 relevant skills for best results.
          You can add custom skills if you don't find what you're looking for.
        </p>
      </div>
    </div>
  );
}