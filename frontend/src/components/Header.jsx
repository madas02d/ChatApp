import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
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
            <span className="ml-2 text-xl font-bold text-gray-900">ChatApp</span>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex space-x-8">
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

          {/* User Profile and Logout/Login */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-md transition-colors cursor-pointer group"
                >
                  <div className="relative">
                    <img
                      src={user.photoURL || 'https://via.placeholder.com/32'}
                      alt={user.displayName || 'User'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      View Profile
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user.displayName || 'Profile'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
