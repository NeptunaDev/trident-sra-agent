import ModalVideo from '../ModalVideo';

export default function VideoPlayer({ sessionId, open, onClose }) {
  return <ModalVideo sessionId={sessionId} open={open} onClose={onClose} />;
}
