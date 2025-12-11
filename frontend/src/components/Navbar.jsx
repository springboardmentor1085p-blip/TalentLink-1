// frontend/src/components/Navbar.jsx

import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Trash2,
  IndianRupee
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { notificationsAPI } from '../api/notifications';
import { messagesAPI } from '../api/messages';
import { Star, Bookmark } from 'lucide-react';

export default function Navbar({ user, setUser, loading }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [financeDropdownOpen, setFinanceDropdownOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const financeRef = useRef(null);
  const searchRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (financeRef.current && !financeRef.current.contains(event.target)) {
        setFinanceDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isFreelancer = !!user && user.role === 'freelancer';
  const isClient = !!user && user.role === 'client';

  const searchOptions = [
    { value: 'projects', label: 'Projects', path: '/projects' },
    { value: 'jobs', label: 'Jobs', path: '/jobs' },
    { value: 'clients', label: 'Clients', path: '/clients' },
  ];

  const handleQuickSearchNavigate = (value) => {
    const opt = searchOptions.find((o) => o.value === value);
    if (opt) navigate(opt.path);
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await notificationsAPI.list();
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await notificationsAPI.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }

    const meta = notif.metadata || {};

    if (notif.type === 'message') {
      if (meta.conversation_user_id) {
        navigate(`/messages?user=${meta.conversation_user_id}`);
      } else {
        navigate('/messages');
      }
    } else if (notif.type === 'proposal') {
      if (meta.proposal_id) {
        navigate(`/proposals/${meta.proposal_id}`);
      } else if (meta.project_id) {
        navigate(`/projects/${meta.project_id}`);
      } else {
        navigate('/proposals');
      }
    } else if (notif.type === 'contract') {
      if (meta.contract_id) {
        navigate(`/contracts/${meta.contract_id}`);
      } else {
        navigate('/contracts');
      }
    } else {
      navigate('/notifications');
    }

    setNotificationsOpen(false);
  };

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <span className="text-xl font-bold text-purple-600">TalentLink</span>
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-50 text-gray-900 dark:text-slate-100">

      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center gap-4">
          {/* Left: Logo + main links */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-xl font-bold text-purple-600 hover:text-purple-700 transition no-underline flex-shrink-0"
              title="Go to Home"
            >
              TalentLink
            </Link>

            {user && (
              <div className="hidden lg:flex items-center gap-5">
                <Link
                  to={user.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer'}
                  className={`text-sm font-medium transition no-underline ${
                    location.pathname.includes('dashboard')
                      ? 'text-purple-600'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/messages"
                  className={`text-sm font-medium transition no-underline ${
                    location.pathname === '/messages'
                      ? 'text-purple-600'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  Messages
                </Link>
                <Link
                  to="/workspace"
                  className={`text-sm font-medium transition no-underline ${
                    location.pathname.includes('workspace')
                      ? 'text-purple-600'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  Workspace
                </Link>
                <Link
                  to="/contracts"
                  className={`text-sm font-medium transition no-underline ${
                    location.pathname.includes('contracts')
                      ? 'text-purple-600'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  Contracts
                </Link>

                {/* Freelancer: Finances Dropdown */}
                {isFreelancer && (
                  <div className="relative" ref={financeRef}>
                    <button
                      onClick={() => setFinanceDropdownOpen(!financeDropdownOpen)}
                      className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-purple-600 transition"
                    >
                      <IndianRupee size={16} />
                      Finances
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${financeDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {financeDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                        <Link
                          to="/earnings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 no-underline"
                          onClick={() => setFinanceDropdownOpen(false)}
                        >
                          View Earnings
                        </Link>
                        <Link
                          to="/invoices"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 no-underline"
                          onClick={() => setFinanceDropdownOpen(false)}
                        >
                          Invoices
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search dropdown for freelancers */}
            {isFreelancer && (
              <div className="hidden md:flex items-center relative" ref={searchRef}>
                <button
                  type="button"
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Search size={16} className="text-gray-400" />
                  <span>Search for...</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${searchOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {searchOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[9999]">
                    {searchOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          handleQuickSearchNavigate(opt.value);
                          setSearchOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Client quick talent CTA */}
            {user && user.role === 'client' && (
              <Link
                to="/talent"
                className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm no-underline"
              >
                <Search size={16} />
                Find Talent
              </Link>
            )}

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-40">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 hover:bg-gray-50 cursor-pointer transition ${
                              !notif.is_read ? 'bg-purple-50' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-900 font-medium">
                              {notif.title || notif.text}
                            </p>
                            {notif.message && (
                              <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-gray-500">No notifications yet.</div>
                      )}
                    </div>
                    <Link
                      to="/notifications"
                      className="block p-3 text-center text-sm text-purple-600 hover:text-purple-700 font-medium border-t border-gray-200 no-underline"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      View All Notifications
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Profile dropdown */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-full transition"
                  title="Profile & Account"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-200">
                      <span className="text-purple-600 font-semibold text-sm">
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </span>
                    </div>
                  )}
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">
                        {user.role === 'freelancer' ? 'Freelancer' : 'Client'}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 no-underline"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User size={16} />
                      Profile
                    </Link>

                    <Link
                      to="/reviews"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 no-underline"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Star size={16} />
                      Reviews & Ratings
                    </Link>

                    {/* Client: Payments link below Reviews */}
                    {isClient && (
                      <Link
                        to="/payments"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 no-underline"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <IndianRupee size={16} />
                        Payments
                      </Link>
                    )}

                    {isFreelancer && (
                      <Link
                        to="/saved"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 no-underline"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Bookmark size={16} />
                        Saved Items
                      </Link>
                    )}

                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 no-underline"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Settings size={16} />
                      Account Settings
                    </Link>

                    <div className="border-t border-gray-200 my-1" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>

                    {/* <button
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to delete your account? This action cannot be undone.'
                          )
                        ) {
                          alert('Account deletion functionality to be implemented');
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete Account
                    </button> */}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/projects"
                  className="text-sm font-medium text-gray-700 hover:text-purple-600 transition no-underline"
                >
                  Browse Projects
                </Link>
                <Link
                  to="/signin"
                  className="text-sm font-medium text-gray-700 hover:text-purple-600 transition no-underline"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm no-underline"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu content */}
        {menuOpen && (
          <div className="md:hidden bg-gray-50 border-top p-4 space-y-3 mt-3">
            {user ? (
              <>
                {isFreelancer && (
                  <div className="mb-2">
                    <label className="block text-xs text-gray-600 mb-1">Search for...</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleQuickSearchNavigate(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select</option>
                      {searchOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {user.role === 'client' && (
                  <Link
                    to="/talent"
                    className="flex items-center gap-2 py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                  >
                    <Search size={18} />
                    Find Talent
                  </Link>
                )}

                <Link
                  to={user.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer'}
                  className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                >
                  Dashboard
                </Link>
                <Link
                  to="/messages"
                  className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                >
                  Messages
                </Link>
                <Link
                  to="/contracts"
                  className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                >
                  Contracts
                </Link>

                {isFreelancer && (
                  <>
                    <Link
                      to="/earnings"
                      className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                    >
                      Earnings
                    </Link>
                    <Link
                      to="/invoices"
                      className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                    >
                      Invoices
                    </Link>
                  </>
                )}

                <Link
                  to="/profile"
                  className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                >
                  Profile
                </Link>

                {user && (
                  <Link
                    to="/reviews"
                    className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                  >
                    Reviews & Ratings
                  </Link>
                )}

                {isClient && (
                  <Link
                    to="/payments"
                    className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                  >
                    Payments
                  </Link>
                )}

                {isFreelancer && (
                  <Link
                    to="/saved"
                    className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                  >
                    Saved Items
                  </Link>
                )}

                <Link
                  to="/notifications"
                  className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                >
                  Notifications
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 text-gray-700 hover:text-purple-600 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/projects"
                  className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                >
                  Browse Projects
                </Link>
                <Link
                  to="/signin"
                  className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block py-2 text-gray-700 hover:text-purple-600 font-medium no-underline"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}