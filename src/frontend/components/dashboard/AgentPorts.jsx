import StatusCard from './StatusCard';

export default function AgentPorts() {
  return (
    <>
      <StatusCard  label="API" value=":3417" color="#00ff88" />
      <StatusCard  label="WebSocket" value=":8080" color="#00ff88" />
    </>
  );
}
