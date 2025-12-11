import { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, MapPin, Building, Save, Upload, CheckCircle, AlertCircle, 
  Edit2, FileText, Globe, Award, Camera, Phone, Calendar as CalendarIcon
} from 'lucide-react';
import { authAPI } from '../api/auth';
import ImageCropper from '../components/ImageCropper';
import CalendarInput from '../components/CalendarInput';
import LocationSelectLite from '../components/LocationSelectLite';
import { reviewsAPI } from '../api/reviews';


export default function ClientProfile({ user, setUser }) {
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('basic');
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  
  const [idFile, setIdFile] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    birthdate: user?.birthdate || '',
    company_name: '',
    company_website: '',
  });
  const [averageRating, setAverageRating] = useState(user?.rating_avg || 0);

  const sectionRefs = {
    basic: useRef(null),
    company: useRef(null),
    verification: useRef(null)
  };

  useEffect(() => {
    let mounted = true;
    authAPI.getClientProfile()
      .then((res) => {
        if (!mounted) return;
        setClientProfile(res.data);
        setFormData((prev) => ({
          ...prev,
          company_name: res.data?.company_name || '',
          company_website: res.data?.company_website || '',
        }));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

    useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    reviewsAPI
      .getStats(user.id)
      .then((res) => {
        if (cancelled) return;
        const avg = res.data?.average_rating ?? 0;
        setAverageRating(avg);
      })
      .catch((err) => {
        console.error('Failed to load rating stats:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const onPickAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please select an image');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Photo must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(f);
  };

  const handleCroppedImage = (file) => {
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    setShowCropper(false);
    setTempImage(null);
  };

  const cancelCropper = () => {
      setShowCropper(false);
      setTempImage(null);
      setAvatarFile(null);
      setAvatarPreview(user?.avatar || null);
    };
  const handleIdUpload = (e) => {
    if (e.target.files[0]) {
      setIdFile(e.target.files[0]);
    }
  };

  const calculateCompletion = () => {
    const checks = {
      basic: !!(
        formData.first_name && 
        formData.last_name && 
        formData.bio && 
        formData.location && 
        formData.phone &&
        avatarPreview
      ),
      company: !!(formData.company_name || formData.company_website),
      verification: !!(clientProfile?.is_verified || idFile || clientProfile?.verification_submitted_at)
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    
    return { checks, percentage: Math.round((completed / total) * 100) };
  };

  const { checks, percentage } = calculateCompletion();

  const scrollToSection = (section) => {
    setActiveSection(section);
    sectionRefs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSave = async (section) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (section === 'basic') {
        const formDataToSend = new FormData();
        formDataToSend.append('first_name', formData.first_name);
        formDataToSend.append('last_name', formData.last_name);
        formDataToSend.append('bio', formData.bio);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('phone', formData.phone);
        if (formData.birthdate) formDataToSend.append('birthdate', formData.birthdate);
        if (avatarFile) {
          formDataToSend.append('avatar', avatarFile);
        }
        await authAPI.updateUser(formDataToSend);
        } else if (section === 'company' || section === 'verification') {
          if (idFile || formData.company_name || formData.company_website) {
            const clientFd = new FormData();

            if (formData.company_name) {
              clientFd.append('company_name', formData.company_name.trim());
            }

            if (formData.company_website) {
              let website = formData.company_website.trim();
              // ✅ Auto-add https:// if user forgets scheme
              if (website && !/^https?:\/\//i.test(website)) {
                website = `https://${website}`;
              }
              clientFd.append('company_website', website);
            }

            if (idFile) {
              clientFd.append('id_document', idFile);
            }

            await authAPI.updateClientProfile(clientFd);
          }
        }


      const [userResponse, clientResponse] = await Promise.all([
        authAPI.me(),
        authAPI.getClientProfile(),
      ]);
      setUser(userResponse.data);
      setClientProfile(clientResponse.data);

      setSuccess(`${section} updated successfully!`);
      setEditing(null);
      setAvatarFile(null);
      setIdFile(null);
      
      setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Profile update error:', err);
        const data = err.response?.data;

        // Try to show a helpful message if website is invalid
        const websiteError =
          data?.company_website?.[0] ||
          data?.user?.company_website?.[0];

        if (websiteError) {
          setError('Please enter a valid website URL (e.g. https://yourcompany.com)');
        } else if (data?.detail) {
          setError(data.detail);
        } else {
          setError('Failed to update profile. Please try again.');
        }
      }
 finally {
      setLoading(false);
    }
  };

  const idUrl = clientProfile?.id_document_url || clientProfile?.id_document || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-6">
      {showCropper && tempImage && (
        <ImageCropper
          image={tempImage}
          onCrop={handleCroppedImage}
          onCancel={cancelCropper} 
        />
      )}

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your account information</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-start">
            <CheckCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg lg:sticky lg:top-6">
              {/* Progress Circle */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Profile Strength</h3>
                  <span className="text-2xl font-bold text-purple-600">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {percentage === 100 ? '🎉 Perfect profile!' : `${3 - Object.values(checks).filter(Boolean).length} sections to complete`}
                </p>
              </div>

              {/* Section Links */}
              <div className="p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">Profile Sections</h4>
                <nav className="space-y-1">
                  {[
                    { key: 'basic', label: 'Basic Information', icon: User, complete: checks.basic },
                    { key: 'company', label: 'Company Details', icon: Building, complete: checks.company },
                    { key: 'verification', label: 'Verification', icon: Award, complete: checks.verification },
                  ].map(({ key, label, icon: Icon, complete }) => (
                    <button
                      key={key}
                      onClick={() => scrollToSection(key)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        activeSection === key
                          ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{label}</span>
                      </div>
                      {complete && <CheckCircle size={16} className="text-green-500" />}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Stats */}
              <div className="p-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Your Stats</h4>
                <div className="space-y-3">

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Projects Posted</span>
                    <span className="font-bold text-purple-600">{clientProfile?.projects_posted || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Projects</span>
                    <span className="font-bold text-blue-600">{clientProfile?.active_projects || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Jobs Posted</span>
                    <span className="font-bold text-indigo-600">{clientProfile?.jobs_posted || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Jobs</span>
                    <span className="font-bold text-teal-600">{clientProfile?.active_jobs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-bold text-yellow-600">
                      {Number(averageRating || 0).toFixed(1)}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Basic Information */}
            <div ref={sectionRefs.basic} className="bg-white rounded-xl shadow-md p-6 scroll-mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <User className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                </div>
                {editing !== 'basic' ? (
                  <button
                    onClick={() => setEditing('basic')}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave('basic')}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-purple-500" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                        <Camera size={32} className="text-white" />
                      </div>
                    )}
                    {editing === 'basic' && (
                      <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 shadow-lg">
                        <Upload size={14} />
                        <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
                      </label>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formData.first_name} {formData.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    {editing === 'basic' && (
                      <p className="text-xs text-purple-600 mt-2">
                        💡 Click the camera icon to upload and adjust your photo
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      disabled={editing !== 'basic'}
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      disabled={editing !== 'basic'}
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline mr-2" size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email}
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline mr-2" size={16} />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      disabled={editing !== 'basic'}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline mr-2" size={16} />
                      Location *
                    </label>
                    {editing === 'basic' ? (
                      <LocationSelectLite
                        value={formData.location}
                        onChange={(val) => setFormData({ ...formData, location: val })}
                        placeholder="City, State"
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={formData.location}
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="inline mr-2" size={16} />
                      Date of Birth
                    </label>
                    {editing === 'basic' ? (
                      <CalendarInput
                        value={formData.birthdate}
                        onChange={(val) => setFormData({ ...formData, birthdate: val })}
                        placeholder="YYYY-MM-DD"
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={formData.birthdate || 'Not set'}
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600"
                      />
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio *
                  </label>
                  <textarea
                    disabled={editing !== 'basic'}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                    placeholder="Tell us about yourself and your business..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length} / 500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div ref={sectionRefs.company} className="bg-white rounded-xl shadow-md p-6 scroll-mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Building className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
                </div>
                {editing !== 'company' ? (
                  <button
                    onClick={() => setEditing('company')}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave('company')}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline mr-2" size={16} />
                    Company Name
                  </label>
                  <input
                    type="text"
                    disabled={editing !== 'company'}
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline mr-2" size={16} />
                    Company Website
                  </label>
                  <input
                    type="url"
                    disabled={editing !== 'company'}
                    value={formData.company_website}
                    onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
            </div>

            {/* Verification */}
            <div ref={sectionRefs.verification} className="bg-white rounded-xl shadow-md p-6 scroll-mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Award className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Account Verification</h2>
                </div>
                {editing !== 'verification' ? (
                  <button
                    onClick={() => setEditing('verification')}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave('verification')}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className={`border-2 rounded-lg p-4 ${
                  clientProfile?.is_verified 
                    ? 'border-green-300 bg-green-50' 
                    : clientProfile?.verification_submitted_at 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {clientProfile?.is_verified ? (
                      <CheckCircle size={24} className="text-green-600" />
                    ) : clientProfile?.verification_submitted_at ? (
                      <AlertCircle size={24} className="text-yellow-600" />
                    ) : (
                      <AlertCircle size={24} className="text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {clientProfile?.is_verified 
                          ? '✅ Verified Client' 
                          : clientProfile?.verification_submitted_at 
                          ? '⏳ Verification Pending' 
                          : 'Not Verified'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {clientProfile?.is_verified 
                          ? 'Your account has been verified' 
                          : clientProfile?.verification_submitted_at 
                          ? 'Your verification is under review' 
                          : 'Upload ID document to get verified'}
                      </p>
                    </div>
                  </div>
                  
                  {clientProfile?.verification_submitted_at && !clientProfile?.is_verified && (
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted: {new Date(clientProfile.verification_submitted_at).toLocaleString()}
                    </p>
                  )}

                  {idUrl && (
                    <a
                      href={idUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 underline mt-2 inline-block"
                    >
                      View ID on file
                    </a>
                  )}
                </div>

                {editing === 'verification' && !clientProfile?.is_verified && (
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:bg-purple-50 transition">
                    <FileText className="mx-auto text-purple-400 mb-2" size={32} />
                    <label className="cursor-pointer">
                      <span className="text-sm font-semibold text-purple-600 hover:text-purple-700">
                        Upload ID Document
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleIdUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-1">Government ID, Business License, or Tax Certificate</p>
                    </label>
                    {idFile && (
                      <p className="text-sm text-green-600 mt-2">✓ Selected: {idFile.name}</p>
                    )}
                  </div>
                )}

                {!clientProfile?.is_verified && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Why Get Verified?</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Stand out to top freelancers</li>
                      <li>• Get 60% more quality proposals</li>
                      <li>• Build trust with the community</li>
                      <li>• Access to priority support</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Activity</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">{clientProfile?.projects_posted || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Projects Posted</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{clientProfile?.active_projects || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Active Projects</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600">
                  {Number(averageRating || 0).toFixed(1)}
                </div>

                  <div className="text-sm text-gray-600 mt-1">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}