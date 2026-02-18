import { useTranslation } from 'react-i18next';

const PROTOCOLS = [
  { id: 'ubuntu-vnc', key: 'vnc' },
  { id: 'ubuntu-ssh', key: 'ssh' },
  { id: 'windows-rdp', key: 'rdp' },
];

export default function ProtocolButtons({ onConnect }) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-wrap gap-4 p-6 justify-center">
      {PROTOCOLS.map(({ id, key }) => (
        <button
          key={id}
          type="button"
          onClick={() => onConnect(id)}
          className="min-w-[140px] px-6 py-4 rounded-lg bg-gradient-to-r from-[#5bc2e7] to-[#4ba8d1] hover:from-[#4ba8d1] hover:to-[#5bc2e7] text-[#11111f] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {t(`protocols.${key}`)}
        </button>
      ))}
    </section>
  );
}
