import { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, MapPin, IndianRupee, Edit2, Save, Upload, X, Link as LinkIcon, 
  Camera, Briefcase, GraduationCap, Globe, Star, FileText, Award, CheckCircle,
  AlertCircle, Phone, Calendar as CalendarIcon, Code
} from 'lucide-react';
import SkillSelector from '../components/SkillSelector';
import LocationSelectLite from '../components/LocationSelectLite';
import CalendarInput from '../components/CalendarInput';
import ImageCropper from '../components/ImageCropper';
import { authAPI } from '../api/auth';
// import ReviewList from '../components/ReviewList';
import RatingDisplay from '../components/RatingDisplay';
import { calculateProfileCompletion } from '../api/profileCompletionUtils'
import { reviewsAPI } from '../api/reviews';
import { workspacesAPI } from '../api/workspaces';

export default function FreelancerProfile({ user, setUser }) {
  const [activeSection, setActiveSection] = useState('basic');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState(null);

  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [averageRating, setAverageRating] = useState(user?.rating_avg || 0);
  const [earningsStats, setEarningsStats] = useState({
    totalEarnings: 0,
  });
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    birthdate: user?.birthdate || '',
    hourly_rate: '',
    availability: 'part-time',
    role_title: '',
    portfolio: '',
    skills: [],
    social_links: { linkedin: '', github: '', website: '', other: '' },
    languages: [{ language: 'English', level: 'Native' }],
    experiences: [],
    education: [],
  });
  const [savedProfile, setSavedProfile] = useState(null);
  const sectionRefs = {
    basic: useRef(null),
    professional: useRef(null),
    portfolio: useRef(null),
    experience: useRef(null),
    education: useRef(null),
    languages: useRef(null),
  };

  useEffect(() => { loadProfile(); }, []);

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

    useEffect(() => {
    // Load total earnings stats for sidebar
    const loadEarningsStats = async () => {
      try {
        // Get all workspaces where user is freelancer
        const wsRes = await workspacesAPI.list();
        const workspacesData = Array.isArray(wsRes.data)
          ? wsRes.data
          : wsRes.data.results || wsRes.data.workspaces || [];

        // Fetch payments from all workspaces
        const paymentsPromises = workspacesData.map((ws) =>
          workspacesAPI.getPayments(ws.id).catch(() => ({ data: [] }))
        );

        const paymentsResults = await Promise.all(paymentsPromises);

        // Flatten and filter confirmed payments only (same as Earnings page)
        const allPaymentsData = paymentsResults.flatMap((res) => {
          const data = Array.isArray(res.data) ? res.data : res.data.results || [];
          return data.filter((payment) => payment.freelancer_confirmed);
        });

        const totalEarnings = allPaymentsData.reduce(
          (sum, p) => sum + parseFloat(p.amount || 0),
          0
        );

        setEarningsStats({ totalEarnings });
      } catch (err) {
        console.error('Failed to load earnings stats:', err);
      }
    };

    loadEarningsStats();
  }, []);
  
const loadProfile = async () => {
  try {
    const profileResponse = await authAPI.getFreelancerProfile();
    const profile = profileResponse.data;
    
    setFreelancerProfile(profile);
    setPortfolioFiles(profile.portfolio_files || []);
    
    const profileData = {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      bio: user.bio || '',
      location: user.location || '',
      phone: user.phone || '',
      birthdate: user.birthdate || '',
      hourly_rate: profile.hourly_rate || '',
      availability: profile.availability || 'part-time',
      role_title: profile.role_title || '',
      portfolio: profile.portfolio || '',
      skills: profile.skills || [],
      social_links: profile.social_links || { linkedin: '', github: '', website: '', other: '' },
      languages: profile.languages?.length ? profile.languages : [{ language: 'English', level: 'Native' }],
      experiences: profile.experiences || [],
      education: profile.education || [],
    };
    
    setFormData(profileData);
    setSavedProfile(profileData); // Store saved state
    setAvatarPreview(user?.avatar || null);
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
};

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
    // file is a real File("avatar.jpg", ...) from ImageCropper
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    setShowCropper(false);
    setTempImage(null);
    // Don't change user.avatar until saved
  };

  
  const cancelCropper = () => {
    setShowCropper(false);
    setTempImage(null);
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || null); // Reset to original
  };

  const calculateCompletion = () => {
    const data = savedProfile || formData; 
    
    const completion = calculateProfileCompletion(
      { 
        ...user,
        bio: data.bio,
        location: data.location,
        phone: data.phone,
        avatar: avatarPreview || user?.avatar
      }, 
      {
        ...freelancerProfile,
        role_title: data.role_title,
        hourly_rate: data.hourly_rate,
        skills: data.skills,
        portfolio: data.portfolio,
        languages: data.languages,
        experiences: data.experiences,
        education: data.education,
        social_links: data.social_links,
        portfolio_files: portfolioFiles
      }
    );
    
    return { 
      checks: completion.sectionChecks, 
      percentage: completion.percentage 
    };
  };

  const { checks, percentage } = calculateCompletion();

  const scrollToSection = (section) => {
    setActiveSection(section);
    sectionRefs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  };

  const uploadMorePortfolio = async (e) => {
    try {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      
      const fd = new FormData();
      files.forEach((file, i) => fd.append(`portfolio_file_${i}`, file));
      
      const res = await authAPI.uploadPortfolioFiles(fd);
      setPortfolioFiles((prev) => [...res.data.uploaded, ...prev].slice(0, 5));
      setSuccess(`${res.data.count} file(s) uploaded`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload file(s)');
    }
  };

  const deletePortfolioFile = async (fileId) => {
    try {
      await authAPI.deletePortfolioFile(fileId);
      setPortfolioFiles((prev) => prev.filter((f) => f.id !== fileId));
      setSuccess('File deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete file');
    }
  };

  const handleSave = async (section) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (section === 'basic') {
        const userFD = new FormData();
        userFD.append('first_name', formData.first_name);
        userFD.append('last_name', formData.last_name);
        userFD.append('bio', formData.bio);
        userFD.append('location', formData.location);
        userFD.append('phone', formData.phone);
        if (
          formData.birthdate &&
          /^\d{4}-\d{2}-\d{2}$/.test(formData.birthdate)   // YYYY-MM-DD
        ) {
          userFD.append('birthdate', formData.birthdate);
        }
        if (avatarFile) userFD.append('avatar', avatarFile);
        
        const res = await authAPI.updateUser(userFD);
        setUser(res.data);
        
        // Update saved profile
        setSavedProfile(prev => ({
          ...prev,
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          location: formData.location,
          phone: formData.phone,
          birthdate: formData.birthdate,
        }));
        
        setAvatarFile(null); // Clear temp file
      } else {
        const payload = {};
        if (section === 'professional') {
          payload.role_title = formData.role_title;
          payload.hourly_rate = formData.hourly_rate;
          payload.portfolio = formData.portfolio;
          payload.skill_ids = (formData.skills || []).map((s) =>
            typeof s === 'object' ? s.id : s
          );
          payload.social_links = formData.social_links;
        } else if (section === 'experience') {
          payload.experiences = formData.experiences;
        } else if (section === 'education') {
          payload.education = formData.education;
        } else if (section === 'languages') {
          payload.languages = formData.languages;
        }

        await authAPI.updateProfile(payload);
        
        // Update saved profile
        setSavedProfile(prev => ({ ...prev, ...payload }));
      }

      setSuccess('Profile updated successfully');
      setEditing(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save:', err);

      const resp = err.response?.data;

      if (!resp) {
        setError('Failed to save changes');
      } else if (typeof resp === 'string') {
        setError(resp);
      } else if (resp.detail) {
        setError(resp.detail);
      } else {
        // Build a readable error from field-level messages
        const messages = Object.entries(resp).map(([field, msgs]) => {
          if (Array.isArray(msgs)) {
            return `${field}: ${msgs.join(', ')}`;
          }
          return `${field}: ${msgs}`;
        });
        setError(messages.join(' | '));
      }
    } finally {
      setLoading(false);
    }
};

  const addExperience = () => {
    const newExp = {
      id: Date.now(),
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    };
    setFormData({ ...formData, experiences: [...formData.experiences, newExp] });
  };

  const updateExperience = (id, field, value) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const removeExperience = (id) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.filter((exp) => exp.id !== id),
    });
  };

  const addEducation = () => {
    const newEdu = {
      id: Date.now(),
      degree: '',
      institution: '',
      field: '',
      year: '',
    };
    setFormData({ ...formData, education: [...formData.education, newEdu] });
  };

  const updateEducation = (id, field, value) => {
    setFormData({
      ...formData,
      education: formData.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  const removeEducation = (id) => {
    setFormData({
      ...formData,
      education: formData.education.filter((edu) => edu.id !== id),
    });
  };

  const addLanguage = () => {
    setFormData({
      ...formData,
      languages: [...formData.languages, { language: '', level: 'Conversational' }],
    });
  };

  const updateLanguage = (index, field, value) => {
    const updated = [...formData.languages];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, languages: updated });
  };

  const removeLanguage = (index) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((_, i) => i !== index),
    });
  };

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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 text-sm mt-1">Build your professional presence</p>
          </div>
        </div>

        {/* Alerts */}
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
              {/* Progress */}
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
                  {percentage === 100 ? '🎉 Perfect profile!' : `${6 - Object.values(checks).filter(Boolean).length} sections to complete`}
                </p>
              </div>

              {/* Navigation */}
              <div className="p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">Profile Sections</h4>
                <nav className="space-y-1">
                  {[
                    { key: 'basic', label: 'Basic Information', icon: User, complete: checks.basic },
                    { key: 'professional', label: 'Professional Details', icon: Briefcase, complete: checks.professional },
                    { key: 'portfolio', label: 'Portfolio Files', icon: FileText, complete: checks.portfolio },
                    { key: 'experience', label: 'Work Experience', icon: Briefcase, complete: checks.experience },
                    { key: 'education', label: 'Education', icon: GraduationCap, complete: checks.education },
                    { key: 'languages', label: 'Languages', icon: Globe, complete: checks.languages },
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
                    <span className="text-gray-600">Projects Completed</span>
                    <span className="font-bold text-purple-600">{freelancerProfile?.projects_completed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Earnings</span>
                    <span className="font-bold text-green-600">
                      ₹{Number(
                        earningsStats.totalEarnings ??
                        freelancerProfile?.total_earnings ??
                        0
                      ).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>

                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-bold text-yellow-600 flex items-center gap-1">
                      <Star size={14} fill="currentColor" />
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
                    Professional Bio *
                  </label>
                  <textarea
                    disabled={editing !== 'basic'}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                    placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length} / 500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div ref={sectionRefs.professional} className="bg-white rounded-xl shadow-md p-6 scroll-mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Briefcase className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Professional Details</h2>
                </div>
                {editing !== 'professional' ? (
                  <button
                    onClick={() => setEditing('professional')}
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
                      onClick={() => handleSave('professional')}
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Award className="inline mr-2" size={16} />
                      Professional Title *
                    </label>
                    <input
                      type="text"
                      disabled={editing !== 'professional'}
                      value={formData.role_title}
                      onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                      placeholder="e.g., Full Stack Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <IndianRupee className="inline mr-2" size={16} />
                      Hourly Rate (₹) *
                    </label>
                    <input
                      type="number"
                      disabled={editing !== 'professional'}
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                      placeholder="500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability
                    </label>
                    <select
                      disabled={editing !== 'professional'}
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                    >
                      <option value="full-time">Full-time (40+ hrs/week)</option>
                      <option value="part-time">Part-time (20-40 hrs/week)</option>
                      <option value="contract">Contract/Project-based</option>
                    </select>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Code className="inline mr-2" size={16} />
                    Skills * (Select at least 3)
                  </label>
                  {editing === 'professional' ? (
                    <SkillSelector
                      selectedSkills={formData.skills}
                      setSelectedSkills={(skills) => setFormData({ ...formData, skills })}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills?.length > 0 ? (
                        formData.skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                          >
                            {skill.name}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No skills added yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Portfolio Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio Description *
                  </label>
                  <textarea
                    disabled={editing !== 'professional'}
                    value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                    placeholder="Describe your best work, projects you've completed, and your expertise..."
                  />
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <LinkIcon size={16} />
                    Social Links
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="url"
                      disabled={editing !== 'professional'}
                      value={formData.social_links?.linkedin || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_links: { ...formData.social_links, linkedin: e.target.value }
                      })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                      placeholder="LinkedIn URL"
                    />
                    <input
                      type="url"
                      disabled={editing !== 'professional'}
                      value={formData.social_links?.github || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_links: { ...formData.social_links, github: e.target.value }
                      })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                      placeholder="GitHub URL"
                    />
                    <input
                      type="url"
                      disabled={editing !== 'professional'}
                      value={formData.social_links?.website || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_links: { ...formData.social_links, website: e.target.value }
                      })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                      placeholder="Portfolio Website"
                    />
                    <input
                      type="url"
                      disabled={editing !== 'professional'}
                      value={formData.social_links?.other || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_links: { ...formData.social_links, other: e.target.value }
                      })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-600"
                      placeholder="Other URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Files */}
            <div ref={sectionRefs.portfolio} className="bg-white rounded-xl shadow-md p-6 scroll-mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="text-purple-600" size={24} />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Portfolio Files</h2>
                    <p className="text-xs text-gray-600">Upload up to 5 files (images, PDFs, documents)</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
                  <Upload size={16} />
                  Upload Files
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={uploadMorePortfolio}
                  />
                </label>
              </div>

              {portfolioFiles.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-2">No portfolio files uploaded yet</p>
                  <p className="text-sm text-gray-500">Upload images, PDFs, or documents showcasing your work</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {portfolioFiles.map((file) => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-4 hover:border-purple-300 transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <a
                            href={file.file_url || file.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-purple-600 hover:underline truncate block"
                          >
                            {file.file_name}
                          </a>
                          <p className="text-xs text-gray-500 mt-1">
                            {(file.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => deletePortfolioFile(file.id)}
                          className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work Experience */}
            <div ref={sectionRefs.experience} className="bg-white rounded-xl shadow-md p-6 scroll-mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Briefcase className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Work Experience</h2>
                </div>
                {editing !== 'experience' ? (
                  <button
                    onClick={() => setEditing('experience')}
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
                      onClick={() => handleSave('experience')}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {editing === 'experience' && (
                <button
                  onClick={addExperience}
                  className="w-full mb-4 px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 font-medium flex items-center justify-center gap-2"
                >
                  <X size={18} className="rotate-45" />
                  Add Experience
                </button>
              )}

              {formData.experiences.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No work experience added yet</p>
              ) : (
                <div className="space-y-4">
                  {formData.experiences.map((exp) => (
                    <div key={exp.id} className="border rounded-lg p-4">
                      {editing === 'experience' ? (
                        <div className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                            placeholder="Job Title"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            placeholder="Company Name"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                          
                          {/* REPLACE THESE TWO INPUTS: */}
                          <CalendarInput
                            value={exp.startDate || ''}
                            onChange={(val) => updateExperience(exp.id, 'startDate', val)}
                            placeholder="Start Date (YYYY-MM-DD)"
                            className="w-full"
                          />
                          <CalendarInput
                            value={exp.endDate || ''}
                            onChange={(val) => updateExperience(exp.id, 'endDate', val)}
                            placeholder="End Date (YYYY-MM-DD)"
                            className="w-full"
                            disabled={exp.current}
                          />
                        </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                              className="rounded"
                            />
                            Currently working here
                          </label>
                          <textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            placeholder="Describe your responsibilities and achievements..."
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                          <button
                            onClick={() => removeExperience(exp.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                          </p>
                          {exp.description && (
                            <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education */}
            <div ref={sectionRefs.education} className="bg-white rounded-xl shadow-md p-6 scroll-mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GraduationCap className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Education</h2>
                </div>
                {editing !== 'education' ? (
                  <button
                    onClick={() => setEditing('education')}
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
                      onClick={() => handleSave('education')}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {editing === 'education' && (
                <button
                  onClick={addEducation}
                  className="w-full mb-4 px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 font-medium flex items-center justify-center gap-2"
                >
                  <X size={18} className="rotate-45" />
                  Add Education
                </button>
              )}

              {formData.education.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No education added yet</p>
              ) : (
                <div className="space-y-4">
                  {formData.education.map((edu) => (
                    <div key={edu.id} className="border rounded-lg p-4">
                      {editing === 'education' ? (
                        <div className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                              placeholder="Degree"
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              placeholder="Institution"
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              value={edu.field}
                              onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                              placeholder="Field of Study"
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              value={edu.year}
                              onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                              placeholder="Graduation Year"
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeEducation(edu.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {edu.field} {edu.year && `• ${edu.year}`}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Languages */}
            <div ref={sectionRefs.languages} className="bg-white rounded-xl shadow-md p-6 scroll-mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Globe className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Languages</h2>
                </div>
                {editing !== 'languages' ? (
                  <button
                    onClick={() => setEditing('languages')}
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
                      onClick={() => handleSave('languages')}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {editing === 'languages' && (
                <button
                  onClick={addLanguage}
                  className="w-full mb-4 px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 font-medium flex items-center justify-center gap-2"
                >
                  <X size={18} className="rotate-45" />
                  Add Language
                </button>
              )}

              <div className="space-y-3">
                {formData.languages.map((lang, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {editing === 'languages' ? (
                      <>
                        <input
                          type="text"
                          value={lang.language}
                          onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                          placeholder="Language"
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
                        <select
                          value={lang.level}
                          onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                          className="px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="Basic">Basic</option>
                          <option value="Conversational">Conversational</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Native">Native</option>
                        </select>
                        {formData.languages.length > 1 && (
                          <button
                            onClick={() => removeLanguage(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full px-4 py-2 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{lang.language}</span>
                        <span className="text-sm text-gray-600">{lang.level}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Reviews & Ratings – summary only on profile */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Star className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Reviews & Ratings</h2>
                </div>

                {/* Link to full reviews page in navbar */}
                <a
                  href="/reviews"
                  className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                >
                  View all reviews
                </a>
              </div>

            {typeof averageRating === 'number' && averageRating > 0 ? (
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="text-center md:text-left">
                  <div className="text-4xl font-bold text-purple-600">
                    {averageRating.toFixed(1)}
                  </div>

                  <RatingDisplay
                    rating={averageRating}
                    showNumber={false}
                    size="lg"
                    className="mt-1 justify-center md:justify-start"
                  />

                  <p className="text-sm text-gray-600 mt-1">
                    Overall rating based on client feedback
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Star size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600">No reviews yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Once you complete projects, client reviews will appear here.
                </p>
              </div>
            )}

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}