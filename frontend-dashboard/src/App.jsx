import { useState } from 'react';
import TerminalShell from './TerminalShell';
import RetroLoader from './RetroLoader';
import './index.css';

function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <RetroLoader onDone={() => setLoaded(true)} />}
      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <TerminalShell />
      </div>
    </>
  );
}

export default App;
