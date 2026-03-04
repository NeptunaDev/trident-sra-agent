import AlertsBadge from '../dashboard/AlertsBadge';

const NAV_ITEMS = [
  { path: '/dashboard', labelKey: 'nav.dashboard' },
  { path: '/logs', labelKey: 'nav.logs' },
  { path: '/alerts', labelKey: 'nav.alerts' },
  { path: '/media', labelKey: 'nav.media' },
  { path: '/settings', labelKey: 'nav.settings' },
];

export default function Sidebar({ currentPath, onNavigate, unreadAlerts = 0, t }) {
  return (
    <aside className="w-64 border-r border-[rgba(91,194,231,0.2)] bg-[#0f1020] p-4">
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <a
              key={item.path}
              href={`#${item.path}`}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.path);
              }}
              className={`w-full text-left rounded px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                isActive
                  ? 'bg-[#11111f] text-[#5bc2e7] border border-[rgba(91,194,231,0.2)]'
                  : 'text-[#c0c5ce] hover:text-[#5bc2e7] hover:bg-[#11111f]'
              }`}
            >
              <span>{t(item.labelKey)}</span>
              {item.path === '/alerts' && <AlertsBadge count={unreadAlerts} />}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
