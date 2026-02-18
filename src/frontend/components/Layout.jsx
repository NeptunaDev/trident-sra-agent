import { TooltipProvider } from './Tooltip';

export default function Layout({ children }) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        {children}
      </div>
    </TooltipProvider>
  );
}
