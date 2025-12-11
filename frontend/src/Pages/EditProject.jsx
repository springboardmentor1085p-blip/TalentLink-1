// frontend/src/pages/EditProject.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SkillSelector from '../components/SkillSelector';
import { projectsAPI } from '../api/projects';
import { Search, X } from 'lucide-react';

const CATEGORIES = [
  { group: "Accounting & Consulting", items: [
    "All - Accounting & Consulting",
    "Personal & Professional Coaching",
    "Accounting & Bookkeeping",
    "Financial Planning",
    "Recruiting & Human Resources",
    "Management Consulting & Analysis",
    "Other - Accounting & Consulting",
  ]},
  { group: "Admin Support", items: [
    "All - Admin Support",
    "Data Entry & Transcription Services",
    "Virtual Assistance",
    "Project Management",
    "Market Research & Product Reviews",
  ]},
  { group: "Customer Service", items: [
    "All - Customer Service",
    "Community Management & Tagging",
    "Customer Service & Tech Support",
  ]},
  { group: "Data Science & Analytics", items: [
    "All - Data Science & Analytics",
    "Data Analysis & Testing",
    "Data Extraction/ETL",
    "Data Mining & Management",
    "AI & Machine Learning",
  ]},
  { group: "Design & Creative", items: [
    "All - Design & Creative",
    "Art & Illustration",
    "Audio & Music Production",
    "Branding & Logo Design",
    "NFT, AR/VR & Game Art",
    "Graphic, Editorial & Presentation Design",
    "Performing Arts",
    "Photography",
    "Product Design",
    "Video & Animation",
  ]},
  { group: "Engineering & Architecture", items: [
    "All - Engineering & Architecture",
    "Building & Landscape Architecture",
    "Chemical Engineering",
    "Civil & Structural Engineering",
    "Contract Manufacturing",
    "Electrical & Electronic Engineering",
    "Interior & Trade Show Design",
    "Energy & Mechanical Engineering",
    "Physical Sciences",
    "3D Modeling & CAD",
  ]},
  { group: "IT & Networking", items: [
    "All - IT & Networking",
    "Database Management & Administration",
    "ERP/CRM Software",
    "Information Security & Compliance",
    "Network & System Administration",
    "DevOps & Solution Architecture",
  ]},
  { group: "Legal", items: [
    "All - Legal",
    "Corporate & Contract Law",
    "International & Immigration Law",
    "Finance & Tax Law",
    "Public Law",
  ]},
  { group: "Sales & Marketing", items: [
    "All - Sales & Marketing",
    "Digital Marketing",
    "Lead Generation & Telemarketing",
    "Marketing, PR & Brand Strategy",
  ]},
  { group: "Translation", items: [
    "All - Translation",
    "Language Tutoring & Interpretation",
    "Translation & Localization Services",
  ]},
  { group: "Web, Mobile & Software Dev", items: [
    "All - Web, Mobile & Software Dev",
    "Blockchain, NFT & Cryptocurrency",
    "AI Apps & Integration",
    "Desktop Application Development",
    "Ecommerce Development",
    "Game Design & Development",
    "Mobile Development",
    "Other - Software Development",
    "Product Management & Scrum",
    "QA Testing",
    "Scripts & Utilities",
    "Web & Mobile Design",
    "Web Development",
  ]},
  { group: "Writing", items: [
    "All - Writing",
    "Sales & Marketing Copywriting",
    "Content Writing",
    "Editing & Proofreading Services",
    "Professional & Business Writing",
  ]},
];

function CategoryDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return CATEGORIES;
    return CATEGORIES
      .map(g => ({
        ...g,
        items: g.items.filter(i => i.toLowerCase().includes(t)),
      }))
      .filter(g => g.items.length);
  }, [term]);

  const label = selected || 'Select category…';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-left bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${open ? 'ring-2 ring-purple-200 border-purple-500' : ''}`}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
        <span className="float-right">▾</span>
      </button>

      {open && (
        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow max-h-80 overflow-auto">
          <div className="sticky top-0 bg-white border-b p-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={term}
                onChange={e => setTerm(e.target.value)}
                placeholder="Search categories..."
                className="pl-8 pr-8 py-1.5 w-full border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                onSelect('');
                setOpen(false);
                setTerm('');
              }}
              className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
            >
              Clear selection
            </button>
          </div>

          <div className="p-2">
            {filtered.map(group => (
              <div key={group.group} className="mb-2">
                <div className="text-xs font-bold text-gray-500 px-2 py-1">
                  {group.group}
                </div>
                {group.items.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                      setTerm('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded ${
                      selected === item
                        ? 'bg-purple-100 text-purple-700'
                        : 'hover:bg-purple-50'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditProject({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: [],
    budget_min: '',
    budget_max: '',
    duration_estimate: '1_3_months',
    hours_per_week: 'more_30',
    experience_level: 'intermediate',
    location_type: 'remote',
    client_location: '',
    job_type: 'fixed',
    hourly_min: '',
    hourly_max: '',
    fixed_payment: '',
    category: '',
  });
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Role guard
  if (user?.role === 'freelancer') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-4">This page is for clients only</h2>
            <p className="text-gray-600 mb-6">You are signed in as a freelancer.</p>
            <button
              onClick={() => navigate('/dashboard/freelancer')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadProject();
  
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await projectsAPI.get(id);
      const p = res.data;

      // only owner can edit
      if (!user || user.role !== 'client' || user.id !== p.client) {
        alert('You can only edit your own projects');
        navigate('/dashboard/client');
        return;
      }

      setFormData({
        title: p.title || '',
        description: p.description || '',
        skills: p.skills_required || [],
        budget_min: p.budget_min || '',
        budget_max: p.budget_max || '',
        duration_estimate: p.duration || '1_3_months',
        hours_per_week: p.hours_per_week || 'more_30',
        experience_level: p.experience_level || 'intermediate',
        location_type: p.location_type || 'remote',
        client_location: p.client_location || '',
        job_type: p.job_type || 'fixed',
        hourly_min: p.hourly_min || '',
        hourly_max: p.hourly_max || '',
        fixed_payment: p.fixed_payment || '',
        category: p.category || '',
      });

      setExistingFiles(p.file_attachments || []);
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateSkills = skills => {
    setFormData(prev => ({ ...prev, skills }));
  };

  const onPickFiles = e => {
    const picked = Array.from(e.target.files || []);
    const next = [...files, ...picked].slice(0, 2);
    setFiles(next);
  };

  const removeFile = idx => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const validateBeforeSubmit = () => {
    if (!formData.title.trim()) return 'Please enter a title';
    if (!formData.description.trim()) return 'Please enter a description';
    if (formData.skills.length === 0)
      return 'Please select at least one skill';

    if (formData.job_type === 'fixed') {
      if (!formData.fixed_payment || Number(formData.fixed_payment) <= 0) {
        return 'Please enter a valid fixed payment amount';
      }
    } else if (formData.job_type === 'hourly') {
      if (!formData.hourly_min || !formData.hourly_max) {
        return 'Please enter hourly rate range';
      }
      if (Number(formData.hourly_min) >= Number(formData.hourly_max)) {
        return 'Maximum hourly rate must be greater than minimum';
      }
    }
    if (files.length > 2) {
      return 'You can attach at most 2 files';
    }
    return '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const validation = validateBeforeSubmit();
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);

      (formData.skills || []).forEach(s => {
        const idVal = typeof s === 'object' ? s.id : s;
        if (idVal != null) fd.append('skill_ids', idVal);
      });

      if (formData.job_type === 'hourly') {
        fd.append('budget_min', formData.hourly_min);
        fd.append('budget_max', formData.hourly_max);
        fd.append('hourly_min', formData.hourly_min);
        fd.append('hourly_max', formData.hourly_max);
      } else {
        fd.append('budget_min', formData.fixed_payment);
        fd.append('budget_max', formData.fixed_payment);
        fd.append('fixed_payment', formData.fixed_payment);
      }

      fd.append('duration_estimate', formData.duration_estimate);
      fd.append('hours_per_week', formData.hours_per_week);
      fd.append('experience_level', formData.experience_level);
      fd.append('location_type', formData.location_type);
      fd.append('client_location', formData.client_location);
      fd.append('job_type', formData.job_type);
      fd.append('category', formData.category || '');

      files.forEach(f => fd.append('attachments', f));

    
      await projectsAPI.update(id, fd);

      navigate(`/projects/${id}`);
    } catch (err) {
      console.error('Project update error:', err);
      const apiErr =
        err?.response?.data?.attachments?.[0] ||
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to update project. Please try again.';
      setError(apiErr);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard/client')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-gray-600 mt-2">
            Update the details of your existing project
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="e.g., Build a React + Django project dashboard"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={6}
                value={formData.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="Describe your project scope, deliverables, timelines, and any constraints..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Skills */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills Required
              </label>
              <SkillSelector
                selectedSkills={formData.skills}
                setSelectedSkills={updateSkills}
              />
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Engagement Type
              </label>
              <select
                value={formData.job_type}
                onChange={e => updateField('job_type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>

            {/* Payment / Rate */}
            {formData.job_type === 'fixed' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fixed Payment (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.fixed_payment}
                  onChange={e =>
                    updateField('fixed_payment', e.target.value)
                  }
                  placeholder="e.g., 25000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Min (₹/hr)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.hourly_min}
                    onChange={e =>
                      updateField('hourly_min', e.target.value)
                    }
                    placeholder="e.g., 500"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Max (₹/hr)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.hourly_max}
                    onChange={e =>
                      updateField('hourly_max', e.target.value)
                    }
                    placeholder="e.g., 1200"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </>
            )}

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={formData.experience_level}
                onChange={e =>
                  updateField('experience_level', e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="entry">Entry</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            {/* Location Type & Client Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Type
              </label>
              <select
                value={formData.location_type}
                onChange={e =>
                  updateField('location_type', e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Location
              </label>
              <input
                type="text"
                value={formData.client_location}
                onChange={e =>
                  updateField('client_location', e.target.value)
                }
                placeholder="e.g., Ahmedabad, IN"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Duration / Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={formData.duration_estimate}
                onChange={e =>
                  updateField('duration_estimate', e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="less_1_month">Less than 1 month</option>
                <option value="1_3_months">1–3 months</option>
                <option value="3_6_months">3–6 months</option>
                <option value="6_plus_months">More than 6 months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours per week
              </label>
              <select
                value={formData.hours_per_week}
                onChange={e =>
                  updateField('hours_per_week', e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="less_10">Less than 10 hrs/week</option>
                <option value="10_30">10–30 hrs/week</option>
                <option value="more_30">More than 30 hrs/week</option>
              </select>
            </div>

            {/* Category */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <CategoryDropdown
                selected={formData.category}
                onSelect={val => updateField('category', val)}
              />
              <p className="mt-2 text-xs text-gray-500">
                Pick the most relevant category.
              </p>
            </div>

            {/* Existing Attachments */}
            {existingFiles.length > 0 && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Attachments
                </label>
                <ul className="mt-1 space-y-2">
                  {existingFiles.map(att => (
                    <li
                      key={att.id}
                      className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50"
                    >
                      <span className="text-sm truncate">
                        {att.original_name || 'Attachment'}
                      </span>
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* New Attachments */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (max 2)
              </label>
              <input
                type="file"
                onChange={onPickFiles}
                multiple
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between border rounded-lg px-3 py-2"
                    >
                      <span className="text-sm truncate">
                        {f.name}{' '}
                        <span className="text-gray-500">
                          ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1 rounded hover:bg-gray-100"
                        aria-label="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating Project...' : 'Update Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
