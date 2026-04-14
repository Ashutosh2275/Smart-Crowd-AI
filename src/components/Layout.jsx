import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export function Layout() {
  const location = useLocation();
  return (
    <div className="relative flex h-screen overflow-hidden bg-background soft-grid">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(95,118,255,0.14),transparent_30%),radial-gradient(circle_at_8%_82%,rgba(14,165,233,0.11),transparent_34%)]" />
      {/* Handles both Desktop Vertical bounds and Mobile Horizontal Bottom states natively */}
      <Sidebar />
      
      <div className="relative z-10 flex h-full flex-1 flex-col overflow-x-hidden">
        <Header />
        
        {/* pb-24 specifically bounds the mobile scrolling view so the absolute bottom-nav doesn't occlude lowest content */}
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4 md:px-6 md:pb-6 md:pt-6 lg:px-8 lg:pt-8">
          {/* key forces React to remount the wrapper on every route change, re-triggering .page-enter */}
          <div key={location.pathname} className="mx-auto max-w-7xl page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Executes strictly on explicit Mobile breakpoints gracefully rendering over content loops */}
      <MobileNav />
    </div>
  );
}
