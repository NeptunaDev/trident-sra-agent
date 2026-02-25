import { useTranslation } from 'react-i18next';

const TITLES_BY_PATH = {
  '/dashboard': 'nav.dashboard',
  '/logs': 'nav.logs',
  '/alerts': 'nav.alerts',
  '/media': 'nav.media',
  '/settings': 'nav.settings',
};

const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

export default function Header({ currentPath = '/dashboard', guacdOk = false }) {
  const { t, i18n } = useTranslation();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neptuna/20 bg-[#0a0a0f]">
      <div>
        <h1 className="text-xl font-semibold text-white">{t(TITLES_BY_PATH[currentPath] || 'nav.dashboard')}</h1>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${guacdOk ? 'bg-[#00ff88]' : 'bg-[#ff6b6b]'}`} />
          <p className="text-sm text-[#c0c5ce]">guacd {guacdOk ? 'ok' : 'sin respuesta'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              i18n.language === code
                ? 'bg-[#1a1a2e] text-[#5bc2e7] border border-[rgba(91,194,231,0.2)]'
                : 'text-[#c0c5ce] hover:text-[#5bc2e7] hover:bg-[#11111f]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
