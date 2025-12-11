// frontend/src/pages/EditJob.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { jobsAPI } from '../api/jobs';

export default function EditJob({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'hourly',
    experience_level: 'intermediate',
    location_type: 'remote',
    location: '',
    hourly_min: '',
    hourly_max: '',
    fixed_amount: '',
  });
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJob();

  }, [id]);

  const loadJob = async () => {
    try {
      setError('');
      setLoading(true);

      const res = await jobsAPI.get(id);
      const job = res.data;

      // Only owner client can edit
      if (!user || user.role !== 'client' || user.id !== job.client) {
        alert('You can only edit your own jobs');
        navigate('/dashboard/client');
        return;
      }

      setFormData({
        title: job.title || '',
        description: job.description || '',
        job_type: job.job_type || 'hourly',
        experience_level: job.experience_level || 'intermediate',
        location_type: job.location_type || 'remote',
        location: job.location || '',
        hourly_min: job.hourly_min || '',
        hourly_max: job.hourly_max || '',
        fixed_amount: job.fixed_amount || '',
      });

      setExistingFiles(job.file_attachments || []);
    } catch (err) {
      console.error('Failed to load job:', err);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    // same as PostJob: max 2 files total
    setFiles(prev => [...prev, ...picked].slice(0, 2));
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (formData.job_type === 'hourly') {
      if (!formData.hourly_min || !formData.hourly_max) {
        setError('Please enter hourly rate range');
        setSubmitting(false);
        return;
      }
      if (parseFloat(formData.hourly_min) >= parseFloat(formData.hourly_max)) {
        setError('Maximum hourly rate must be greater than minimum');
        setSubmitting(false);
        return;
      }
    } else if (formData.job_type === 'fixed') {
      if (!formData.fixed_amount || parseFloat(formData.fixed_amount) <= 0) {
        setError('Please enter a valid fixed amount');
        setSubmitting(false);
        return;
      }
    }

    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('job_type', formData.job_type);
      fd.append('experience_level', formData.experience_level);
      fd.append('location_type', formData.location_type);
      fd.append('location', formData.location);

      if (formData.job_type === 'hourly') {
        fd.append('hourly_min', formData.hourly_min);
        fd.append('hourly_max', formData.hourly_max);
      } else {
        fd.append('fixed_amount', formData.fixed_amount);
      }

      files.forEach((f) => fd.append('attachments', f));

      await jobsAPI.update(id, fd);

      navigate(`/jobs/${id}`);
    } catch (err) {
      console.error('Job update error:', err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to update job';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Optional guard for freelancers (like PostJob)
  if (user?.role === 'freelancer') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">This page is for clients only</h2>
          <button
            onClick={() => navigate('/dashboard/freelancer')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Edit Job</h1>
          <p className="text-gray-600 mt-2">Update job details</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g. Data Entry Specialist Needed"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Describe the job in detail. Include requirements, deliverables, and any specific expectations..."
            />
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, job_type: 'hourly' })}
                className={`p-4 border-2 rounded-lg transition ${
                  formData.job_type === 'hourly'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-300'
                }`}
              >
                <div className="font-semibold">Hourly</div>
                <div className="text-sm text-gray-600">Pay by the hour for ongoing work</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, job_type: 'fixed' })}
                className={`p-4 border-2 rounded-lg transition ${
                  formData.job_type === 'fixed'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-300'
                }`}
              >
                <div className="font-semibold">Fixed Price</div>
                <div className="text-sm text-gray-600">Pay one set price for the entire job</div>
              </button>
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level *
            </label>
            <select
              required
              value={formData.experience_level}
              onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="entry">Entry Level</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* Payment */}
          {formData.job_type === 'hourly' ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Hourly Rate (₹/hr) *
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  step="50"
                  value={formData.hourly_min}
                  onChange={(e) => setFormData({ ...formData, hourly_min: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Hourly Rate (₹/hr) *
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  step="50"
                  value={formData.hourly_max}
                  onChange={(e) => setFormData({ ...formData, hourly_max: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Amount (₹) *</label>
              <input
                type="number"
                required
                min="100"
                step="100"
                value={formData.fixed_amount}
                onChange={(e) => setFormData({ ...formData, fixed_amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          )}

          {/* Location */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Type *</label>
              <select
                required
                value={formData.location_type}
                onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Location (optional)</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* Existing Attachments (read-only list) */}
          {existingFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Existing Attachments
              </label>
              <ul className="mt-1 space-y-2">
                {existingFiles.map((att) => (
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

          {/* New Attachments (max 2, like PostJob) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Attachments (max 2)
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
                  <li key={idx} className="flex items-center justify-between border rounded-lg px-3 py-2">
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

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/jobs/${id}`)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating Job...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
