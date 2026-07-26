import { useEffect, useState, useRef } from 'react';

const lines = [
  'BIOS v2.04 -- Placement Automation Corp.',
  'Checking memory... 640K OK',
  'Initialising Spring AI subsystem...',
  'Loading PgVector engine... OK',
  'Connecting to PostgreSQL cluster... OK',
  'Mounting RAG index... 14 shards loaded',
  'Spawning webhook listener... READY',
  'System boot complete.',
];

const CELLS = 28;

function beep(freq = 880, dur = 0.04) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

export default function RetroLoader({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState([]);
  const [fadeOut, setFadeOut] = useState(false);
  const prog = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    let i = 0;
    const lineTimer = setInterval(() => {
      if (i < lines.length) {
        setShown(prev => [...prev, lines[i]]);
        beep(400 + i * 80, 0.03);
        i++;
      } else {
        clearInterval(lineTimer);
      }
    }, 260);

    const barTimer = setInterval(() => {
      prog.current += Math.random() * 3.5 + 1.2;
      if (prog.current >= 100) {
        prog.current = 100;
        clearInterval(barTimer);
        if (!finished.current) {
          finished.current = true;
          beep(1046, 0.12);
          setTimeout(() => beep(1318, 0.12), 130);
          setTimeout(() => beep(1568, 0.18), 260);
          setTimeout(() => setFadeOut(true), 600);
          setTimeout(() => onDone?.(), 1200);
        }
      }
      setProgress(Math.min(prog.current, 100));
    }, 55);

    return () => {
      clearInterval(lineTimer);
      clearInterval(barTimer);
    };
  }, []);

  const pct = Math.floor(progress);
  const filled = Math.round((pct / 100) * CELLS);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#080808',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      zIndex: 9999,
      fontFamily: '"Courier New", monospace',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.6s ease',
      overflow: 'hidden',
    }}>

      {/* scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      }} />

      {/* dark edges */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '22px', width: '480px', maxWidth: '92vw',
      }}>

        {/* title section */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{
            fontSize: '11px', letterSpacing: '6px',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', marginBottom: '12px',
          }}>
            Placement Automation Corp.
          </div>
          <div style={{
            fontSize: '26px', fontWeight: 'bold',
            letterSpacing: '10px', color: '#fff',
            textShadow: '0 0 12px rgba(255,255,255,0.8), 0 0 30px rgba(39,201,63,0.4)',
            textTransform: 'uppercase',
          }}>
            LOADING..
          </div>
        </div>

        {/* progress bar */}
        <div style={{ width: '100%' }}>
          <div style={{
            border: '2px solid rgba(39,201,63,0.55)',
            padding: '4px', background: '#050505',
            boxShadow: '0 0 14px rgba(39,201,63,0.12)',
          }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {Array.from({ length: CELLS }).map((_, i) => {
                const isLast = i === filled - 1;
                return (
                  <div key={i} style={{
                    flex: 1, height: '20px',
                    background: i < filled ? '#fff' : 'rgba(255,255,255,0.05)',
                    boxShadow: i < filled
                      ? isLast ? '0 0 14px rgba(255,255,255,1)' : '0 0 5px rgba(255,255,255,0.4)'
                      : 'none',
                    transition: 'background 0.05s',
                  }} />
                );
              })}
            </div>
          </div>
          <div style={{
            textAlign: 'center', marginTop: '10px',
            fontSize: '14px', letterSpacing: '4px', color: '#fff',
            textShadow: '0 0 8px rgba(255,255,255,0.5)',
          }}>
            {pct}%
          </div>
        </div>

        {/* boot log */}
        <div style={{
          width: '100%', background: '#020202',
          border: '1px solid rgba(39,201,63,0.2)',
          borderLeft: '3px solid rgba(39,201,63,0.55)',
          padding: '12px 16px',
          minHeight: '136px', maxHeight: '160px',
          overflowY: 'hidden',
        }}>
          {shown.map((line, i) => {
            const active = i === shown.length - 1;
            return (
              <div key={i} style={{
                fontSize: '11.5px',
                color: active ? '#fff' : 'rgba(39,201,63,0.45)',
                lineHeight: '1.75',
                textShadow: active ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
              }}>
                <span style={{ color: '#27c93f', marginRight: '10px', opacity: active ? 1 : 0.5 }}>{'>'}</span>
                {line}
                {active && (
                  <span style={{
                    display: 'inline-block', width: '7px', height: '12px',
                    background: '#fff', marginLeft: '5px',
                    verticalAlign: 'middle',
                    animation: 'blink 0.7s step-end infinite',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', width: '100%',
          borderTop: '1px solid rgba(39,201,63,0.1)', paddingTop: '8px',
        }}>
          <span style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(39,201,63,0.35)' }}>SYS:INIT</span>
          <span style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)' }}>v2.0.4</span>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
