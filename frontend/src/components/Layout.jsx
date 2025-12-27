import { Header } from './Header';
import { Footer } from './Footer';
import { OnlineStatusManager } from './OnlineStatusManager';
import { InactivityTimeout } from './InactivityTimeout';
import { Call } from './Call';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Manage user presence (online/offline + heartbeat) on all authenticated pages */}
      <OnlineStatusManager />
      {/* Manage inactivity timeout and automatic logout for security */}
      <InactivityTimeout />
      {/* Call interface */}
      <Call />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
};