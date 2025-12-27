import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { Dashboard } from './components/Dashboard';
import { Layout } from './components/Layout';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Profile } from './components/Profile';
import { ConversationChat } from './components/ConversationChat';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CallProvider>
          <ChatProvider>
            <div className="min-h-screen bg-gray-100">
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/chat/conversation/:conversationId"
                element={
                  <PrivateRoute>
                    <Layout>
                      <ConversationChat />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
          </ChatProvider>
        </CallProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
