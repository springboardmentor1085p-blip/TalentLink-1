// frontend/src/components/JobApplicationForm.jsx
import { useState } from 'react';
import { X, Upload, FileText, Trash2 } from 'lucide-react';

export default function JobApplicationForm({ job, onSubmit, onClose, isLoading }) {
  const [formData, setFormData] = useState({
    cover_letter: '',
    bid_amount: '',
    estimated_time: '',
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 3) {
      setError('Maximum 3 files allowed');
      return;
    }
    setFiles([...files, ...selectedFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.cover_letter.trim()) {
      setError('Cover letter is required');
      return;
    }

    if (!formData.bid_amount || parseFloat(formData.bid_amount) <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    // 🔁 estimated_time is now OPTIONAL – no validation here

    const submitData = new FormData();
    submitData.append('job', job.id);
    submitData.append('cover_letter', formData.cover_letter);
    submitData.append('bid_amount', formData.bid_amount);

    // Only send estimated_time if user actually entered something
    if (formData.estimated_time.trim()) {
      submitData.append('estimated_time', formData.estimated_time);
    }

    files.forEach((file) => {
      submitData.append('attachments', file);
    });

    onSubmit(submitData);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Apply for Job</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Job Info */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-bold text-lg text-gray-900 mb-2">{job.title}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              {job.job_type === 'hourly' && job.hourly_min && job.hourly_max && (
                <p>Rate: ₹{job.hourly_min} - ₹{job.hourly_max}/hr</p>
              )}
              {job.job_type === 'fixed' && job.fixed_amount && (
                <p>Budget: ₹{job.fixed_amount}</p>
              )}
              <p className="capitalize">Type: {job.job_type}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.cover_letter}
                onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                placeholder="Explain why you're the best fit for this job..."
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Introduce yourself and highlight relevant experience
              </p>
            </div>

            {/* Bid Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Bid Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.bid_amount}
                onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                placeholder={job.job_type === 'hourly' ? 'e.g., 500.00 (per hour)' : 'e.g., 5000.00 (total)'}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {job.job_type === 'hourly'
                  ? 'Enter your hourly rate'
                  : 'Enter your total project cost'}
              </p>
            </div>

            {/* Estimated Time (Optional now) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Completion Time <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                // no `required` here now
                value={formData.estimated_time}
                onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                placeholder="Optional: e.g., 2 weeks, 1 month, or leave blank for ongoing roles"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                For fixed-scope work you can mention a rough timeline. For ongoing roles (e.g., receptionist),
                you can leave this empty.
              </p>
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  className="hidden"
                  id="file-upload"
                  disabled={isLoading || files.length >= 3}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer flex flex-col items-center ${
                    files.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="text-gray-400 mb-2" size={32} />
                  <span className="text-sm text-gray-600">
                    {files.length >= 3
                      ? 'Maximum 3 files reached'
                      : 'Click to upload (Max 3 files)'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, DOC, TXT, PNG, JPG (Max 10MB each)
                  </span>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText size={20} className="text-purple-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                        disabled={isLoading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
