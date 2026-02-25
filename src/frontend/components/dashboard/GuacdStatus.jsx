import StatusCard from './StatusCard';

export default function GuacdStatus({ guacdOk }) {
  return (
    <StatusCard
      icon={guacdOk ? '●' : '●'}
      label="guacd"
      value={guacdOk ? 'ok' : 'sin respuesta'}
      color={guacdOk ? '#00ff88' : '#ff6b6b'}
    />
  );
}
