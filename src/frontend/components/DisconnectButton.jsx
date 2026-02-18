import { useTranslation } from 'react-i18next';

export default function DisconnectButton({ onClick }) {
  const { t } = useTranslation();

  return (
    <div className="absolute top-4 right-4 z-10">
      <button
        type="button"
        onClick={onClick}
        className="px-4 py-2 rounded-lg text-white hover:bg-[#1a1a2e] border border-[rgba(91,194,231,0.2)] hover:border-[#5bc2e7] transition-colors"
      >
        {t('protocols.disconnect')}
      </button>
    </div>
  );
}
