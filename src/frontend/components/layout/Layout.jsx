import { TooltipProvider } from '../Tooltip';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ currentPath, onNavigate, unreadAlerts, guacdOk, t, children }) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <Header currentPath={currentPath} guacdOk={guacdOk} />
        <div className="flex flex-1 min-h-0">
          <Sidebar currentPath={currentPath} onNavigate={onNavigate} unreadAlerts={unreadAlerts} t={t} />
          <section className="flex-1 p-6 overflow-auto">{children}</section>
        </div>
      </div>
    </TooltipProvider>
  );
}
