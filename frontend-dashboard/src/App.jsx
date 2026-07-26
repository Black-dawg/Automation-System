import { useState } from 'react';
import TerminalShell from './TerminalShell';
import RetroLoader from './RetroLoader';
import './index.css';

function App() {
  const [loaded, setLoaded] = useState(false);

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
