import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import TargetCursor from './TargetCursor';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://placement-backend-6y45zizfcq-el.a.run.app').replace(/\/$/, '');
const DASHBOARD_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD || 'interview';
const NOTION_URL = import.meta.env.VITE_NOTION_URL || 'https://app.notion.com/p/Job-Application-Tracker-9bd515136456828198180166c578cf07';
const AUTH_PROMPT = '\r\n\x1b[33mPasscode:\x1b[0m ';

// Middle-Left Notion ASCII Hyperlink Component with borderless layout and hover color glow
const NotionAsciiLink = () => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <a 
      href={NOTION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="cursor-target"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        top: '360px',
        left: '36px',
        zIndex: 100,
        display: 'block',
        textDecoration: 'none',
        padding: '8px',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <pre style={{
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.05',
        color: hovered ? '#ffffff' : '#27c93f',
        margin: 0,
        whiteSpace: 'pre',
        userSelect: 'none',
        transition: 'color 0.25s ease, text-shadow 0.25s ease',
        textShadow: hovered ? '0 0 12px #ffffff, 0 0 20px #ffffff' : '0 0 8px rgba(39, 201, 63, 0.4)',
      }}>
{`█  █  ███  █████ █  ███  █  █ ↗
██░█ █   █   █   █ █   █ ██░█  
█░██ █   █   █   █ █   █ █░██  
█  █  ███    █   █  ███  █  █  `}
      </pre>
      <div style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        letterSpacing: '3px',
        color: hovered ? '#ffffff' : 'rgba(39, 201, 63, 0.7)',
        marginTop: '6px',
        textTransform: 'uppercase',
        transition: 'color 0.25s ease',
      }}>
        notion dashboard
      </div>
    </a>
  );
};

// Aero-Grid Radar Canvas component for hardware dashboard visualizer
const RadarDisplay = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = 8;
    const cy = H / 2;
    const R = H / 2 - 8;
    const GREEN = '#27c93f';

    let blips = [
      { a: -0.9, r: 0.42 },
      { a: 0.4, r: 0.68 },
      { a: -0.3, r: 0.81 },
      { a: 1.1, r: 0.55 },
      { a: 0.0, r: 0.33 },
      { a: -1.2, r: 0.72 },
    ];

    let sweepAngle = -Math.PI / 2;
    let sweepDirection = 1; // 1 = top-to-bottom, -1 = bottom-to-top
    const SWEEP_SPEED = 0.018;
    let animId;

    const clipSemi = () => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - R);
      ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(cx, cy + R);
      ctx.closePath();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      ctx.save();
      clipSemi();
      ctx.fillStyle = '#010a01';
      ctx.fill();
      ctx.restore();

      ctx.save();
      clipSemi();
      ctx.clip();
      [0.25, 0.5, 0.75, 1.0].forEach((f, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, -Math.PI / 2, Math.PI / 2);
        ctx.strokeStyle = i === 3 ? 'rgba(39,201,63,0.55)' : 'rgba(39,201,63,0.2)';
        ctx.lineWidth = i === 3 ? 2.5 : 1.5;
        ctx.stroke();
      });

      for (let deg = -90; deg <= 90; deg += 22.5) {
        const a = (deg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.strokeStyle = deg === 0 ? 'rgba(39,201,63,0.4)' : 'rgba(39,201,63,0.15)';
        ctx.lineWidth = deg === 0 ? 1.5 : 1;
        ctx.stroke();
      }

      const trailArc = Math.PI * 0.55;
      const steps = 80;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const a = sweepAngle - sweepDirection * trailArc * t;
        const alpha = (1 - t) * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R * 0.99, a - 0.03, a + 0.03);
        ctx.closePath();
        ctx.fillStyle = `rgba(39,201,63,${alpha})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * R, cy + Math.sin(sweepAngle) * R);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2;
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      blips.forEach(b => {
        const bx = cx + Math.cos(b.a) * R * b.r;
        const by = cy + Math.sin(b.a) * R * b.r;
        let diff = Math.abs(sweepAngle - b.a);
        const alpha = Math.max(0, 1 - diff / (Math.PI * 0.5));
        if (alpha > 0.02) {
          ctx.beginPath();
          ctx.arc(bx, by, 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(39,201,63,${alpha})`;
          ctx.shadowColor = GREEN;
          ctx.shadowBlur = 14 * alpha;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = 'rgba(39,201,63,0.5)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(39,201,63,0.45)';
      ctx.textAlign = 'left';
      [0.25, 0.5, 0.75].forEach((f, i) => {
        ctx.fillText(`${(i + 1) * 60}NM`, cx + R * f + 18, cy - 4);
      });

      ctx.fillStyle = 'rgba(39,201,63,0.35)';
      ctx.textAlign = 'center';
      [-60, -30, 0, 30, 60].forEach(deg => {
        const a = (deg * Math.PI) / 180;
        const lx = cx + Math.cos(a) * R * 0.97;
        const ly = cy + Math.sin(a) * R * 0.97;
        ctx.fillText(`${deg < 0 ? deg + 180 : deg === 0 ? '090' : deg + 90}°`, lx - 8, ly + 3);
      });

      sweepAngle += SWEEP_SPEED * sweepDirection;
      if (sweepAngle >= Math.PI / 2) {
        sweepAngle = Math.PI / 2;
        sweepDirection = -1;
      } else if (sweepAngle <= -Math.PI / 2) {
        sweepAngle = -Math.PI / 2;
        sweepDirection = 1;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '10px',
      zIndex: 100,
      padding: '16px 0 16px 0',
      marginLeft: '-55px',
    }}>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '4px', color: 'rgba(39,201,63,0.4)', paddingLeft: '65px' }}>AERO-GRID RADAR</div>
      <canvas ref={canvasRef} width={260} height={500} style={{ display: 'block' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '65px', width: '145px' }}>
        {[
          { label: 'RNG', value: '240 NM' },
          { label: 'BRG', value: '047°' },
          { label: 'ALT', value: 'FL 320' },
          { label: 'SIG', value: 'LOCK' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '10px' }}>
            <span style={{ color: 'rgba(39,201,63,0.35)', letterSpacing: '2px' }}>{label}</span>
            <span style={{ color: '#27c93f', letterSpacing: '1px' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// AudioContext singleton helper
let sharedAudioCtx = null;

const getAudioCtx = () => {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
};

const playRetroClick = () => {
  try {
    const ctx = getAudioCtx();
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(3.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + 0.04);
  } catch (e) {}
};

const playRetroBootSound = () => {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 1046.50];
    const noteDuration = 0.045;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

      gain.gain.setValueAtTime(0.12, now + idx * noteDuration);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * noteDuration + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * noteDuration);
      osc.stop(now + (idx + 1) * noteDuration + 0.06);
    });

    const chordTime = now + notes.length * noteDuration;
    [523.25, 659.25, 783.99, 1046.50].forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, chordTime);

      gain.gain.setValueAtTime(0.15, chordTime);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(chordTime);
      osc.stop(chordTime + 0.38);
    });
  } catch (e) {}
};

const TerminalShell = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  const shellMode = useRef('AUTH'); // 'AUTH', 'CMD', 'POSTING', 'PROCESSING'
  const commandHistory = useRef([]);
  const historyIndex = useRef(-1);

  const inputBufferRef = useRef('');
  const cursorPositionRef = useRef(0);
  const typeAndExecuteRef = useRef(null);

  const PROMPT = '\r\n\x1b[32muser@host\x1b[0m:\x1b[34m~\x1b[0m$ ';

  const renderAsciiArt = (term) => {
    term.writeln('\x1b[32m  ███  ███  ████     █████ ████   ███   ███  █   █ █████ ████  \x1b[0m');
    term.writeln('\x1b[32m   █  █   █ █   █      █   █   █ █   █ █     █  █  █     █   █ \x1b[0m');
    term.writeln('\x1b[32m   █  █   █ ████       █   ████  █████ █     ███   ████  ████  \x1b[0m');
    term.writeln('\x1b[32m█  █  █   █ █   █      █   █  █  █   █ █     █  █  █     █  █  \x1b[0m');
    term.writeln('\x1b[32m ██    ███  ████       █   █   █ █   █  ███  █   █ █████ █   █ \x1b[0m');
    term.writeln('');
    term.writeln('\x1b[1;32m[Placement Automation Bot v2.0 - xterm.js Engine]\x1b[0m');
  };

  const renderBanner = (term) => {
    renderAsciiArt(term);
    term.writeln(`Connected Host: \x1b[36m${API_BASE_URL}\x1b[0m`);
    term.writeln('Type \x1b[33mhelp\x1b[0m to see available commands.');
    term.write(PROMPT);
  };

  const renderAuthScreen = (term) => {
    renderAsciiArt(term);
    term.writeln('\x1b[1;36m[SECURITY GATEWAY v1.0 - Authentication Required]\x1b[0m');
    term.writeln('Terminal shell is password protected.');
    term.write(AUTH_PROMPT);
  };

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#000000',
        foreground: '#27c93f',
        cursor: '#27c93f',
      },
      fontFamily: '"Ubuntu Mono", "DejaVu Sans Mono", Consolas, monospace',
      fontSize: 15,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    setTimeout(() => {
      try {
        if (terminalRef.current && fitAddon) {
          fitAddon.fit();
        }
      } catch (e) {}
    }, 50);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const isAuthed = sessionStorage.getItem('terminal_auth') === 'true';
    if (isAuthed) {
      shellMode.current = 'CMD';
      renderBanner(term);
    } else {
      shellMode.current = 'AUTH';
      renderAuthScreen(term);
    }

    const handleResize = () => {
      try {
        if (fitAddon) fitAddon.fit();
      } catch (e) {}
    };
    window.addEventListener('resize', handleResize);

    let hasBootedAudio = false;
    const unlockAudioAndBoot = () => {
      if (hasBootedAudio) return;
      hasBootedAudio = true;
      playRetroBootSound();
    };
    window.addEventListener('click', unlockAudioAndBoot, { once: true });
    window.addEventListener('keydown', unlockAudioAndBoot, { once: true });

    let inputBuffer = '';
    let cursorPosition = 0;

    const syncRefs = () => {
      inputBufferRef.current = inputBuffer;
      cursorPositionRef.current = cursorPosition;
    };

    typeAndExecuteRef.current = async (cmd) => {
      if (shellMode.current === 'AUTH' || shellMode.current === 'PROCESSING') return;
      if (shellMode.current === 'POSTING') {
        shellMode.current = 'CMD';
      }
      playRetroClick();
      for (const char of cmd) {
        term.write(char);
        inputBuffer += char;
        cursorPosition++;
        syncRefs();
        await new Promise(r => setTimeout(r, 80));
      }
      await new Promise(r => setTimeout(r, 200));
      playRetroClick();
      inputBuffer = '';
      cursorPosition = 0;
      syncRefs();
      processCommand(cmd);
    };

    const rewriteLine = (newBuffer) => {
      if (cursorPosition > 0) {
        term.write('\b'.repeat(cursorPosition));
      }
      term.write('\x1b[K');
      term.write(newBuffer);
      inputBuffer = newBuffer;
      cursorPosition = newBuffer.length;
    };

    const processPastedString = (pastedText) => {
      if (shellMode.current === 'PROCESSING') return;
      const sanitizedText = pastedText.replace(/[\r\n]+/g, ' ');
      const before = inputBuffer.slice(0, cursorPosition);
      const after = inputBuffer.slice(cursorPosition);
      const newBuffer = before + sanitizedText + after;

      if (cursorPosition > 0) term.write('\b'.repeat(cursorPosition));
      term.write('\x1b[K');
      if (shellMode.current === 'AUTH') {
        term.write('*'.repeat(newBuffer.length));
      } else {
        term.write(newBuffer);
      }
      if (after.length > 0) term.write('\b'.repeat(after.length));

      inputBuffer = newBuffer;
      cursorPosition = before.length + sanitizedText.length;
    };

    const handleWindowPaste = (e) => {
      e.preventDefault();
      const pastedText = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
      if (pastedText) {
        processPastedString(pastedText);
      }
    };
    window.addEventListener('paste', handleWindowPaste);

    term.onData(data => {
      if (shellMode.current === 'PROCESSING') return;

      if (shellMode.current === 'AUTH') {
        for (let i = 0; i < data.length; i++) {
          const char = data[i];
          if (char === '\r') {
            playRetroClick();
            const enteredPass = inputBuffer;
            inputBuffer = '';
            cursorPosition = 0;

            if (enteredPass === DASHBOARD_PASSWORD) {
              sessionStorage.setItem('terminal_auth', 'true');
              shellMode.current = 'CMD';
              playRetroBootSound();
              term.write('\r\x1b[K');
              term.clear();
              term.writeln('\x1b[1;32m[ACCESS GRANTED] Terminal Unlocked.\x1b[0m\r\n');
              renderBanner(term);
            } else {
              term.writeln('');
              term.writeln('\x1b[1;31m[ACCESS DENIED] Invalid Passcode.\x1b[0m');
              term.write(AUTH_PROMPT);
            }
            break;
          } else if (char === '\x7F' || char === '\b') {
            if (cursorPosition > 0) {
              inputBuffer = inputBuffer.slice(0, cursorPosition - 1);
              cursorPosition--;
              term.write('\b \b');
            }
          } else if (char >= ' ') {
            inputBuffer += char;
            cursorPosition++;
            term.write('*');
          }
        }
        return;
      }

      if (data === '\x16') {
        navigator.clipboard.readText().then(processPastedString).catch(() => {});
        return;
      }

      if (data.startsWith('\x1b[')) {
        if (data === '\x1b[A') {
          if (shellMode.current !== 'CMD' || commandHistory.current.length === 0) return;
          if (historyIndex.current < commandHistory.current.length - 1) {
            historyIndex.current++;
            const pastCmd = commandHistory.current[commandHistory.current.length - 1 - historyIndex.current];
            rewriteLine(pastCmd);
          }
        } else if (data === '\x1b[B') {
          if (shellMode.current !== 'CMD' || commandHistory.current.length === 0) return;
          if (historyIndex.current > 0) {
            historyIndex.current--;
            const pastCmd = commandHistory.current[commandHistory.current.length - 1 - historyIndex.current];
            rewriteLine(pastCmd);
          } else if (historyIndex.current === 0) {
            historyIndex.current = -1;
            rewriteLine('');
          }
        } else if (data === '\x1b[C') {
          if (cursorPosition < inputBuffer.length) {
            cursorPosition++;
            term.write('\x1b[C');
          }
        } else if (data === '\x1b[D') {
          if (cursorPosition > 0) {
            cursorPosition--;
            term.write('\x1b[D');
          }
        }
        return;
      }

      for (let i = 0; i < data.length; i++) {
        const char = data[i];

        if (char === '\r') {
          playRetroClick();
          const cmdToProcess = inputBuffer;

          if (shellMode.current === 'CMD' && cmdToProcess.trim() !== '') {
            commandHistory.current.push(cmdToProcess);
          }
          historyIndex.current = -1;
          inputBuffer = '';
          cursorPosition = 0;

          processCommand(cmdToProcess);
          break;
        } else if (char === '\x7F' || char === '\b') {
          if (cursorPosition > 0) {
            const before = inputBuffer.slice(0, cursorPosition - 1);
            const after = inputBuffer.slice(cursorPosition);
            inputBuffer = before + after;
            cursorPosition--;

            term.write('\b\x1b[K' + after);
            if (after.length > 0) {
              term.write('\b'.repeat(after.length));
            }
          }
        } else if (char >= ' ' || char === '\t') {
          const before = inputBuffer.slice(0, cursorPosition);
          const after = inputBuffer.slice(cursorPosition);
          inputBuffer = before + char + after;
          cursorPosition++;

          term.write(char + after);
          if (after.length > 0) {
            term.write('\b'.repeat(after.length));
          }
        }
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('paste', handleWindowPaste);
      term.dispose();
    };
  }, []);

  const processCommand = async (cmdString) => {
    const term = xtermRef.current;
    const cmd = cmdString.trim();
    const lowerCmd = cmd.toLowerCase();

    const isControlCommand = [
      'clear', 'home', 'help', 'post', 'cancel', 'exit', 'show all', 'logout'
    ].includes(lowerCmd) || lowerCmd.startsWith('show ');

    if (shellMode.current === 'POSTING') {
      if (cmd.length === 0 || isControlCommand) {
        shellMode.current = 'CMD';
        if (lowerCmd === '' || lowerCmd === 'cancel' || lowerCmd === 'exit') {
          term.writeln('');
          term.writeln('\x1b[33m[Job Posting Mode Cancelled]\x1b[0m');
          term.write(PROMPT);
          return;
        }
      } else {
        await submitJobToBackend(cmd);
        return;
      }
    }

    if (lowerCmd === '') {
      term.writeln('');
      term.write(PROMPT);
      return;
    }

    if (lowerCmd === 'logout') {
      sessionStorage.removeItem('terminal_auth');
      shellMode.current = 'AUTH';
      term.write('\r\x1b[K');
      term.clear();
      renderAuthScreen(term);
      return;
    }

    if (lowerCmd === 'clear') {
      term.write('\r\x1b[K');
      term.clear();
      term.write(PROMPT);
      return;
    }

    if (lowerCmd === 'home') {
      playRetroBootSound();
      term.write('\r\x1b[K');
      term.clear();
      renderBanner(term);
      return;
    }

    if (lowerCmd === 'help') {
      term.writeln('');
      term.writeln('\x1b[36m--- Available Commands ---\x1b[0m');
      term.writeln('  \x1b[33mpost\x1b[0m      : Enter job posting mode to extract job descriptions');
      term.writeln('  \x1b[33mshow all\x1b[0m  : Fetch and display all jobs from the database');
      term.writeln('  \x1b[33mshow <id>\x1b[0m : Fetch detailed JSON payload for a specific job ID');
      term.writeln('  \x1b[33mhome\x1b[0m      : Return to home screen with ASCII banner');
      term.writeln('  \x1b[33mclear\x1b[0m     : Clear the terminal screen');
      term.writeln('  \x1b[33mlogout\x1b[0m    : Lock terminal CLI and log out');
      term.writeln('  \x1b[33mhelp\x1b[0m      : Show this help menu');
      term.write(PROMPT);
      return;
    }

    if (lowerCmd === 'post') {
      shellMode.current = 'POSTING';
      term.writeln('');
      term.writeln('\x1b[36m--- Job Posting Mode ---\x1b[0m');
      term.writeln('Please paste the raw job description below and press Enter:');
      term.write('\x1b[33m>\x1b[0m ');
      return;
    }

    if (lowerCmd === 'show all') {
      shellMode.current = 'PROCESSING';
      term.writeln('');
      term.writeln(`\x1b[36m[SYS]\x1b[0m Connecting to ${API_BASE_URL}...`);

      try {
        const response = await fetch(`${API_BASE_URL}/api/job`);
        if (response.ok) {
          const jobs = await response.json();
          if (jobs.length === 0) {
            term.writeln('\r\n\x1b[33m[WARN]\x1b[0m No records found in database.');
          } else {
            term.writeln(`\r\n\x1b[1;32m[SUCCESS] Fetched ${jobs.length} job records:\x1b[0m`);
            for (const job of jobs) {
              term.writeln(`  [\x1b[33mID: ${job.id}\x1b[0m] \x1b[36m${job.companyName}\x1b[0m - ${job.role || 'N/A'}`);
            }
          }
        } else {
          term.writeln(`\r\n\x1b[1;31m[ERROR]\x1b[0m HTTP ${response.status} - Failed to fetch jobs.`);
        }
      } catch (err) {
        term.writeln(`\r\n\x1b[1;31m[ERROR]\x1b[0m Could not connect to backend (${API_BASE_URL}/api/job)`);
      } finally {
        shellMode.current = 'CMD';
        term.write(PROMPT);
      }
      return;
    }

    if (lowerCmd.startsWith('show ')) {
      let rawId = lowerCmd.split(' ')[1];
      if (!rawId) {
        term.writeln('\r\n\x1b[31m[Syntax Error]\x1b[0m Missing ID. Usage: show <id>');
        term.write(PROMPT);
        return;
      }
      const id = rawId.replace(/[<>]/g, '');

      shellMode.current = 'PROCESSING';
      term.writeln('');
      term.writeln(`\x1b[36m[SYS]\x1b[0m Querying database for job ID: ${id}...`);

      try {
        const response = await fetch(`${API_BASE_URL}/api/job/${id}`);
        if (response.ok) {
          const job = await response.json();
          term.writeln('\r\n\x1b[1;32m[SUCCESS] Payload received:\x1b[0m\r\n');
          const jsonString = JSON.stringify(job, null, 2);
          await typeWriter(term, jsonString, 1);
          term.writeln('\r\n');
        } else if (response.status === 404) {
          term.writeln(`\r\n\x1b[1;31m[404 NOT FOUND]\x1b[0m No record matches ID ${id}.`);
        } else {
          term.writeln(`\r\n\x1b[1;31m[ERROR]\x1b[0m Server returned status ${response.status}.`);
        }
      } catch (err) {
        term.writeln(`\r\n\x1b[1;31m[ERROR]\x1b[0m Could not connect to backend (${API_BASE_URL}/api/job/${id})`);
      } finally {
        shellMode.current = 'CMD';
        term.write(PROMPT);
      }
      return;
    }

    term.writeln('');
    term.writeln(`\x1b[31mCommand not found:\x1b[0m ${cmd}`);
    term.write(PROMPT);
  };

  const typeWriter = async (term, text, speed = 5) => {
    for (let i = 0; i < text.length; i++) {
      term.write(text[i]);
      if (text[i] === '\n') {
        term.write('\r');
      }
      await new Promise(r => setTimeout(r, speed));
    }
  };

  const submitJobToBackend = async (jobText) => {
    const term = xtermRef.current;
    shellMode.current = 'PROCESSING';

    term.writeln('');
    term.writeln(`\x1b[36m[Info]\x1b[0m Sending job description to backend (${API_BASE_URL})...`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/job/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: jobText
      });

      if (response.status === 201) {
        const data = await response.json();
        term.writeln('\r\n\x1b[1;32m[SUCCESS] Extraction complete. Notion database synced!\x1b[0m');
        term.writeln('\x1b[36m--- Extracted Details ---\x1b[0m\r\n');

        const jsonString = JSON.stringify(data, null, 2);
        await typeWriter(term, jsonString, 2);
        term.writeln('\r\n');
      } else {
        const errorText = await response.text();
        term.writeln(`\r\n\x1b[1;31m[ERROR]\x1b[0m ${errorText}`);
      }
    } catch (err) {
      term.writeln(`\r\n\x1b[1;31m[ERROR]\x1b[0m Could not reach backend pipeline (${err.message})`);
    } finally {
      shellMode.current = 'CMD';
      term.write(PROMPT);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#050505' }}>
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor={true}
        parallaxOn={true}
        hoverDuration={0.2}
        cursorColor="#ffffff"
        cursorColorOnTarget="#ffffff"
        targetSelector=".hardware-button-overlay, .cursor-target"
      />

      {/* Top-Left Control Map Panel */}
      <div style={{
        position: 'fixed',
        top: '32px',
        left: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        padding: '24px 22px',
        background: '#050505',
        border: 'none',
        borderRadius: '10px',
        zIndex: 100,
        minWidth: '200px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '4px', color: '#555', textTransform: 'uppercase' }}>CONTROL MAP</span>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #444, transparent)', marginTop: '8px' }} />
        </div>

        {[
          { color: '#0fa138', label: 'POST', desc: 'Submit job posting' },
          { color: '#f7ca18', label: 'HELP', desc: 'Show all commands' },
          { color: '#d91e1e', label: 'CLEAR', desc: 'Clear screen' },
          { color: '#6e6e6e', label: 'HOME', desc: 'Home screen' },
        ].map(({ color, label, desc }) => (
          <div key={label} className="cursor-target" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '4px', borderRadius: '4px' }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}99`,
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#ddd', fontWeight: 'bold', letterSpacing: '2px' }}>{label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#555', marginTop: '2px', letterSpacing: '0.5px' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle-Left Notion ASCII Hyperlink */}
      <NotionAsciiLink />

      {/* Bottom-Left BY KJ ASCII Art */}
      <div 
        className="cursor-target"
        style={{
          position: 'fixed',
          bottom: '28px',
          left: '36px',
          zIndex: 100,
          opacity: 0.85,
          padding: '8px',
          borderRadius: '6px'
        }}
      >
        <pre style={{
          fontFamily: 'monospace',
          fontSize: '16px',
          lineHeight: '1.05',
          color: '#27c93f',
          margin: 0,
          whiteSpace: 'pre',
          userSelect: 'none'
        }}>
{`▓▓▓▓  ▓   ▓       ▓   ▓   ▓▓▓   
▓░░░▓  ▓ ▓ ░      ▓░ ▓ ░   ▓░░  
▓▓▓▓░░  ▓ ░ ░     ▓▓▓ ░ ░  ▓░░░ 
▓░░░▓ ░ ▓░ ░      ▓░░▓ ░▓  ▓░░  
▓▓▓▓░░  ▓░░       ▓░░░▓  ▓▓ ░░  
 ░░░░ ░  ░░        ░░  ░  ░░ ░  
  ░░░░    ░         ░   ░  ░░   `}
        </pre>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'rgba(39,201,63,0.8)',
          marginTop: '6px',
          textAlign: 'right',
        }}>
          with ❤️
        </div>
      </div>

      <div style={{ 
        position: 'relative', 
        display: 'inline-block',
        maxWidth: '90vw',
        maxHeight: '90vh'
      }}>
        <RadarDisplay />
        
        <img 
          src="/nasa.PNG" 
          alt="Hardware Console" 
          style={{ 
            width: '850px', 
            maxWidth: '100%', 
            height: 'auto', 
            display: 'block',
            borderRadius: '12px'
          }} 
        />

        <div style={{
          position: 'absolute',
          top: '14%',     
          left: '15.2%',    
          width: '68%',    
          height: '46%', 
          backgroundColor: '#050505', 
          padding: '15px',
          overflow: 'hidden',
          borderRadius: '10px'
        }}>
          <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
        </div>

        <div 
          className="hardware-button-overlay"
          onClick={() => typeAndExecuteRef.current?.('post')}
          style={{ top: '72.5%', left: '19%', width: '9.5%', height: '14.5%' }}
          title="post"
        />
        <div 
          className="hardware-button-overlay"
          onClick={() => typeAndExecuteRef.current?.('help')}
          style={{ top: '72.5%', left: '36.5%', width: '9.5%', height: '14.5%' }}
          title="help"
        />
        <div 
          className="hardware-button-overlay"
          onClick={() => typeAndExecuteRef.current?.('clear')}
          style={{ top: '72.5%', left: '54%', width: '9.5%', height: '14.5%' }}
          title="clear"
        />
        <div 
          className="hardware-button-overlay"
          onClick={() => typeAndExecuteRef.current?.('home')}
          style={{ top: '72.5%', left: '71.5%', width: '9.5%', height: '14.5%' }}
          title="home"
        />
      </div>
    </div>
  );
};

export default TerminalShell;
