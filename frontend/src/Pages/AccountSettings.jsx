// frontend/src/pages/AccountSettings.jsx
// REPLACE YOUR ENTIRE EXISTING FILE WITH THIS CODE

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';

export default function AccountSettings({ user, setUser }) {
  const navigate = useNavigate();

  // Single notification toggle (matches your backend)
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notifications_enabled ?? true
  );

  // Appearance
  const [theme, setTheme] = useState(
    () => localStorage.getItem('tl_theme') || 'light'
  );
  const [compactLayout, setCompactLayout] = useState(
    () => localStorage.getItem('tl_compact') === 'true'
  );

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Apply theme globally
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('bg-slate-950');
      document.body.classList.remove('bg-gray-50');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('bg-slate-950');
      document.body.classList.add('bg-gray-50');
    }
    localStorage.setItem('tl_theme', theme);
    
    // Notify other components of theme change
    window.dispatchEvent(new Event('themeChange'));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tl_compact', compactLayout ? 'true' : 'false');
    window.dispatchEvent(new Event('layoutChange'));
  }, [compactLayout]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      const res = await authAPI.updateUser({
        notifications_enabled: notificationsEnabled,
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setStatus('✓ Settings saved successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('✗ Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete your account and all associated data? This cannot be undone.'
      )
    ) {
      return;
    }

    const confirmText = prompt(
      'Type "DELETE" (all caps) to confirm account deletion:'
    );
    
    if (confirmText !== 'DELETE') {
      alert('Account deletion cancelled. You must type DELETE to confirm.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await authAPI.deleteAccount();

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tl_theme');
      localStorage.removeItem('tl_compact');

      if (setUser) setUser(null);
      navigate('/');
    } catch (err) {
      console.error(err);
      setDeleteError(
        'Failed to delete your account. Please try again or contact support.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const isDark = theme === 'dark';
  const cardBase = 'rounded-xl shadow-sm p-6 space-y-6 transition-all duration-200';
  const cardBg = isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-100';
  const pageBg = isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900';
  const subtleText = isDark ? 'text-slate-400' : 'text-gray-600';
  const borderSubtle = isDark ? 'border-slate-700' : 'border-gray-200';
  const hoverBg = isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50';

  return (
    <div className={`min-h-screen py-8 ${pageBg}`}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className={`text-sm ${subtleText}`}>
            Manage your notifications, appearance, and account preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* Notifications Card */}
          <div className={`${cardBase} ${cardBg}`}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-1">Notifications</h2>
              <p className={`text-xs ${subtleText}`}>
                Control when you receive notifications
              </p>
            </div>

            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-purple-50'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="font-semibold text-sm block">Enable Notifications</span>
                  <p className={`text-xs mt-1 ${subtleText}`}>
                    Receive notifications for messages, proposals, contracts, and job applications
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Appearance Card */}
          <div className={`${cardBase} ${cardBg}`}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-1">Appearance</h2>
              <p className={`text-xs ${subtleText}`}>
                Customize how TalentLink looks across all pages
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-3">Theme Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                      theme === 'light'
                        ? 'border-purple-600 bg-purple-50 dark:bg-slate-800'
                        : `border-gray-200 dark:border-slate-700 ${hoverBg}`
                    }`}
                  >
                    <div className="text-2xl">☀️</div>
                    <span className="text-sm font-medium">Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                      theme === 'dark'
                        ? 'border-purple-600 bg-purple-50 dark:bg-slate-800'
                        : `border-gray-200 dark:border-slate-700 ${hoverBg}`
                    }`}
                  >
                    <div className="text-2xl">🌙</div>
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                </div>
              </div>
{/* 
              <div className={`p-4 rounded-lg border ${borderSubtle}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compactLayout}
                    onChange={(e) => setCompactLayout(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-sm block">Compact Layout</span>
                    <p className={`text-xs mt-1 ${subtleText}`}>
                      Reduce spacing and show more content on screen
                    </p>
                  </div>
                </label>
              </div> */}
            </div>
          </div>

          {/* Save Button */}
          <div className={`flex items-center justify-between p-4 rounded-lg border ${borderSubtle} ${cardBg}`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={saving}
              >
                💾 {saving ? 'Saving...' : 'Save All Changes'}
              </button>
              
              {status && (
                <span className={`text-sm font-medium ${
                  status.includes('✓') 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {status}
                </span>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className={`rounded-xl shadow-sm p-6 border-2 border-red-200 dark:border-red-900 ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-1">
                🗑️ Danger Zone
              </h2>
              <p className={`text-xs ${subtleText}`}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
            </div>

            <div className={`p-4 rounded-lg border border-red-200 dark:border-red-900 ${
              isDark ? 'bg-red-950/20' : 'bg-red-50'
            } mb-4`}>
              <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-2">
                This action will permanently delete:
              </p>
              <ul className={`text-xs space-y-1 ${subtleText} list-disc list-inside`}>
                <li>Your profile and all personal information</li>
                <li>All projects, jobs, and proposals</li>
                <li>Contracts and work history</li>
                <li>Messages and conversations</li>
                <li>Reviews and ratings</li>
                <li>All saved items and preferences</li>
              </ul>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                <p className="text-sm text-red-700 dark:text-red-400">{deleteError}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg border-2 border-red-600 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              🗑️ {deleting ? 'Deleting account...' : 'Delete my account permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}