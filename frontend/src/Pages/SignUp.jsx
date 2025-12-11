import { useState } from 'react'; 
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../api/auth';

export default function SignUp({ setUser }) {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    role: searchParams.get('role') || 'freelancer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);   
  const [showPwd2, setShowPwd2] = useState(false); 
  const navigate = useNavigate();

  // Auto-generate username from email
  const handleEmailChange = (e) => {
    const email = e.target.value;
    const username = email.split('@')[0]; 
    setFormData({ ...formData, email, username });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting registration with:', {
        ...formData,
        password: '***',
        password2: '***'
      });

      // Register user
      const registerResponse = await authAPI.register(formData);
      console.log('Registration successful:', registerResponse.data);

      // Login immediately
      const loginResponse = await authAPI.login(formData.email, formData.password);
      console.log('Login successful');
      
      localStorage.setItem('access_token', loginResponse.data.access);
      localStorage.setItem('refresh_token', loginResponse.data.refresh);
      
      // Get user data
      const userResponse = await authAPI.me();
      setUser(userResponse.data);
      localStorage.setItem('user', JSON.stringify(userResponse.data)); 
      console.log('User data loaded:', userResponse.data);

      await new Promise(r => setTimeout(r, 100));

      
      // Navigate based on role
      if (formData.role === 'freelancer') {
        navigate('/onboarding');
      } else {
        navigate('/dashboard/client');
      }
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      
      // Handle different error types
      if (err.response?.data) {
        const errors = err.response.data;
        let errorMessage = '';
        
        if (errors.email) {
          errorMessage = `Email: ${Array.isArray(errors.email) ? errors.email[0] : errors.email}`;
        } else if (errors.username) {
          errorMessage = `Username: ${Array.isArray(errors.username) ? errors.username[0] : errors.username}`;
        } else if (errors.password) {
          errorMessage = `Password: ${Array.isArray(errors.password) ? errors.password[0] : errors.password}`;
        } else if (errors.password2) {
          errorMessage = `Password confirmation: ${Array.isArray(errors.password2) ? errors.password2[0] : errors.password2}`;
        } else if (errors.detail) {
          errorMessage = errors.detail;
        } else if (errors.non_field_errors) {
          errorMessage = Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors;
        } else {
          errorMessage = 'Registration failed. Please check your information.';
        }
        
        setError(errorMessage);
      } else if (err.message) {
        setError(`Network error: ${err.message}`);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900">Create Your Account</h2>
          <p className="text-gray-600 mt-2 text-lg">Join TalentLink today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="freelancer"
                  checked={formData.role === 'freelancer'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mr-2 w-4 h-4 text-purple-600"
                />
                <span className="font-medium">Freelancer</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={formData.role === 'client'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mr-2 w-4 h-4 text-purple-600"
                />
                <span className="font-medium">Client</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={handleEmailChange}
              className={inputCls}
              placeholder="your.email@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username * <span className="text-gray-500 text-xs">(auto-filled from email)</span>
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={inputCls}
              placeholder="johndoe"
              autoComplete="username"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className={inputCls}
                placeholder="John"
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className={inputCls}
                placeholder="Doe"
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`${inputCls} pr-12`}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPwd(v => !v); }}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                aria-pressed={showPwd}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                title={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? (
                  // Eye-off icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l18 18M10.584 10.59A3 3 0 0012 15a3 3 0 002.828-1.99M9.88 4.603A9.74 9.74 0 0112 4.5c5.523 0 10 4.5 10 7.5-.492 1.4-1.64 2.985-3.29 4.326M6.228 6.222C4.06 7.666 2.5 9.57 2 12c.22.95.82 2.053 1.74 3.12 1.01 1.174 2.39 2.28 4.07 3.04 1.68.76 3.65 1.2 6.19.84"/>
                  </svg>
                ) : (
                  // Eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
            <div className="relative">
              <input
                type={showPwd2 ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.password2}
                onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                className={`${inputCls} pr-12`}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPwd2(v => !v); }}
                aria-label={showPwd2 ? 'Hide password' : 'Show password'}
                aria-pressed={showPwd2}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                title={showPwd2 ? 'Hide password' : 'Show password'}
              >
                {showPwd2 ? (
                  // Eye-off icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l18 18M10.584 10.59A3 3 0 0012 15a3 3 0 002.828-1.99M9.88 4.603A9.74 9.74 0 0112 4.5c5.523 0 10 4.5 10 7.5-.492 1.4-1.64 2.985-3.29 4.326M6.228 6.222C4.06 7.666 2.5 9.57 2 12c.22.95.82 2.053 1.74 3.12 1.01 1.174 2.39 2.28 4.07 3.04 1.68.76 3.65 1.2 6.19.84"/>
                  </svg>
                ) : (
                  // Eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="text-purple-600 hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
