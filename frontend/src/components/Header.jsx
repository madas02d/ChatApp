import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setMobileMenuOpen(false);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <span className="text-lg sm:text-xl font-bold text-gray-900">ChatApp</span>
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/chat"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Chats
              </Link>
              <Link
                to="/contacts"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Contacts
              </Link>
            </nav>
          )}

          {/* Desktop User Profile Dropdown - Large devices only */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="relative group">
                {/* Profile Picture Trigger */}
                <button
                  className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-md transition-colors cursor-pointer"
                  aria-label="User menu"
                >
                  <img
                    src={user.photoURL || 'https://via.placeholder.com/32'}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                  />
                  <svg 
                    className="w-4 h-4 text-gray-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    {/* Profile Section */}
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={user.photoURL || 'https://via.placeholder.com/40'}
                        alt={user.displayName || 'User'}
                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.displayName || user.username || 'Profile'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </Link>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* Profile Section in Mobile Menu */}
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 mb-2 hover:bg-gray-50 rounded-md transition-colors"
            >
              <img
                src={user.photoURL || 'https://via.placeholder.com/40'}
                alt={user.displayName || 'User'}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.displayName || user.username || 'Profile'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </Link>
            <div className="border-b border-gray-200 mb-2"></div>
            <nav className="flex flex-col space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md text-base font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md text-base font-medium"
              >
                Chats
              </Link>
              <Link
                to="/contacts"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md text-base font-medium"
              >
                Contacts
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md text-base font-medium"
              >
                Profile Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 text-left text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-md text-base font-medium transition-colors"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
