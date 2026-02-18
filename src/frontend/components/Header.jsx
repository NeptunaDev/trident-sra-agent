import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

export default function Header({ connected, onDisconnect }) {
  const { t, i18n } = useTranslation();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neptuna/20 bg-[#0a0a0f]">
      <div>
        <h1 className="text-xl font-semibold text-white">{t('app.title')}</h1>
        <p className="text-sm text-[#c0c5ce] mt-0.5">{t('app.subtitle')}</p>
      </div>
      <div className="flex items-center gap-3">
        {connected && onDisconnect && (
          <button
            type="button"
            onClick={onDisconnect}
            className="px-4 py-2 rounded-lg text-white hover:bg-[#1a1a2e] border border-[rgba(91,194,231,0.2)] hover:border-[#5bc2e7] transition-colors"
          >
            {t('protocols.disconnect')}
          </button>
        )}
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
      </div>
    </header>
  );
}
