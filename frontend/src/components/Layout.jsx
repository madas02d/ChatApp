import { Header } from './Header';
import { Footer } from './Footer';
import { OnlineStatusManager } from './OnlineStatusManager';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Manage user presence (online/offline + heartbeat) on all authenticated pages */}
      <OnlineStatusManager />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
};