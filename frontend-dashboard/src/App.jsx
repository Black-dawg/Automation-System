import { useState, useEffect, useRef } from 'react';
import TerminalShell from './TerminalShell';
import RetroLoader from './RetroLoader';
import './index.css';

function App() {
  const [loaded, setLoaded] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio('/moodmode-retro-game-arcade-236133.mp3');
    audio.loop = true;
    audio.volume = 0.05; // very subtle background volume (5%)
    audioRef.current = audio;

    const startAudio = () => {
      audio.play().catch(() => {});
    };

    // Attempt autoplay immediately
    audio.play().catch(() => {
      // Handle browser autoplay policy by starting on first user interaction
      window.addEventListener('click', startAudio, { once: true });
      window.addEventListener('keydown', startAudio, { once: true });
    });

    return () => {
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
      audio.pause();
    };
  }, []);

  return (
    <>
      {!loaded && <RetroLoader onDone={() => setLoaded(true)} />}
      {loaded && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <TerminalShell />
          <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
      )}
    </>
  );
}

export default App;
