import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/apiBaseUrl';

export default function JoinRestaurantPage() {
  const [input, setInput] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const [rippleBtn, setRippleBtn] = useState(null);

  // Artistic Google Fonts
  const fontLinks = (
    <link
      href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Montserrat:wght@400;600&family=Pacifico&display=swap"
      rel="stylesheet"
    />
  );

  const handleParseLink = () => {
    try {
      const url = new URL(input);
      const ridParam = url.searchParams.get('rid');
      if (!ridParam) {
        setError('Invalid link: Missing restaurant ID');
        return;
      }
      setRestaurantId(ridParam);
      setStep(2);
      setError('');
    } catch (err) {
      setError('Invalid URL format');
    }
  };

  const handleJoin = async () => {
    try {
      const waiterToken = localStorage.getItem('token');
      if (!waiterToken) {
        setError('Please login first before joining a restaurant');
        return;
      }
      const headers = { Authorization: `Bearer ${waiterToken}` };
      const res = await axios.get(
        `${API_BASE_URL}/api/auth/join?rid=${restaurantId}`,
        { headers }
      );
      if (res.data.user) {
        const role = res.data.user.role;
        if (role === 'waiter') {
          navigate('/dashboard/waiter', { state: { fromJoin: true } });
        } else if (role === 'kitchen') {
          navigate('/dashboard/kitchen', { state: { fromJoin: true } });
        } else {
          alert('Joined, but not a waiter or kitchen user.');
        }
        return;
      }
      alert('Successfully joined the restaurant!');
      navigate('/dashboard/waiter', { state: { fromJoin: true } });
    } catch (err) {
      setError(err?.response?.data?.error || 'Join failed');
    }
  };

  // 2030+ ultra-artistic, beautiful, modern UI
  const bgGradient = {
    minHeight: '100vh',
    width: '100vw',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(120deg, #e0e7ff 0%, #f0fdfa 100%)',
    fontFamily: 'Montserrat, system-ui, sans-serif',
    transition: 'background 0.8s cubic-bezier(.4,0,.2,1)',
  };
  const glassCard = {
    background: 'rgba(255,255,255,0.55)',
    boxShadow: '0 8px 48px 0 rgba(31, 38, 135, 0.22), 0 2px 32px 0 #a5b4fc55, 0 0 32px 8px #38bdf822, 0 0 40px 10px #fff3',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    borderRadius: '36px',
    border: 'none',
    padding: '3.5rem 2.8rem 2.7rem 2.8rem',
    minWidth: 350,
    maxWidth: 440,
    width: '100%',
    margin: '2rem',
    transition: 'box-shadow 0.4s cubic-bezier(.4,0,.2,1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    // animation: 'cardFloat 8s ease-in-out infinite', // Card no longer moves
    position: 'relative',
    zIndex: 2,
    boxSizing: 'border-box',
  };
  const heading = {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '2.7rem',
    fontWeight: 900,
    letterSpacing: '0.04em',
    marginBottom: '1.5rem',
    color: '#232946', // Dark blue
    textShadow: '0 2px 32px #e0e7ff66, 0 1px 0 #fff',
    textAlign: 'center',
    background: 'none',
    WebkitBackgroundClip: 'unset',
    WebkitTextFillColor: 'unset',
    animation: 'none',
  };
  const label = {
    fontFamily: 'Pacifico, cursive',
    fontSize: '1.25rem',
    color: '#475569',
    marginBottom: '0.8rem',
    fontWeight: 500,
    textAlign: 'center',
    letterSpacing: '0.01em',
  };
  const inputStyle = {
    fontFamily: 'Montserrat, system-ui, sans-serif',
    width: '100%',
    padding: '1.15rem 1.3rem',
    borderRadius: '22px',
    border: 'none',
    fontSize: '1.18rem',
    marginBottom: '1.5rem',
    outline: 'none',
    background: 'rgba(255,255,255,0.98)',
    boxShadow: '0 2px 24px #e0e7ff33',
    color: '#111',
    fontWeight: 500,
    letterSpacing: '0.01em',
    transition: 'box-shadow 0.2s',
    backdropFilter: 'blur(2px)',
    zIndex: 2,
  };
  const buttonStyle = {
    fontFamily: 'Orbitron, sans-serif',
    width: '100%',
    padding: '1.15rem 1.3rem',
    borderRadius: '22px',
    border: 'none',
    fontSize: '1.18rem',
    fontWeight: 800,
    background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)',
    color: '#fff',
    boxShadow: '0 2px 24px #6366f133',
    cursor: 'pointer',
    marginTop: '0.2rem',
    marginBottom: '0.9rem',
    letterSpacing: '0.01em',
    transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s',
    outline: 'none',
    overflow: 'hidden',
    position: 'relative',
  };
  const buttonHover = {
    background: 'linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)',
    transform: 'scale(1.045)',
    boxShadow: '0 4px 32px #38bdf855',
  };
  const errorStyle = {
    fontFamily: 'Montserrat, system-ui, sans-serif',
    color: '#ef4444',
    background: 'rgba(255, 0, 0, 0.07)',
    borderRadius: '14px',
    padding: '0.9em 1.2em',
    marginTop: '1.3em',
    fontWeight: 500,
    fontSize: '1.09em',
    boxShadow: '0 2px 16px #ef444422',
    textAlign: 'center',
    zIndex: 2,
  };
  const idBox = {
    fontFamily: 'Montserrat, system-ui, sans-serif',
    fontSize: '1.18rem',
    color: '#334155',
    background: 'rgba(236, 254, 255, 0.8)',
    borderRadius: '14px',
    padding: '0.9em 1.2em',
    marginBottom: '1.5em',
    fontWeight: 700,
    letterSpacing: '0.01em',
    boxShadow: '0 2px 16px #38bdf822',
    border: '2px solid #a5b4fc',
    textAlign: 'center',
    zIndex: 2,
  };

  // Beautiful, artistic, soft animated blobs with cyclic movement
  const blobs = (
    <>
      <div style={{
        position: 'absolute',
        top: '-18vh',
        left: '-18vw',
        width: '70vw',
        height: '70vw',
        background: 'radial-gradient(circle at 60% 40%, #7f9cf5 0%, #a78bfa 40%, #f472b6 80%, #f0fdfa 100%)',
        opacity: 0.18,
        borderRadius: '48% 52% 60% 40% / 50% 44% 56% 50%',
        filter: 'blur(90px)',
        zIndex: 0,
        animation: 'blobCycle1 80s linear infinite',
        pointerEvents: 'none',
        overflow: 'hidden',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20vh',
        right: '-18vw',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle at 40% 60%, #34d399 0%, #38bdf8 60%, #f472b6 100%)',
        opacity: 0.13,
        borderRadius: '60% 40% 50% 50% / 44% 56% 44% 56%',
        filter: 'blur(110px)',
        zIndex: 0,
        animation: 'blobCycle2 100s linear infinite',
        pointerEvents: 'none',
        overflow: 'hidden',
      }} />
    </>
  );
  // Beautiful, glassy, floating 'crystal' shape
  const crystals = (
    <div style={{
      position: 'absolute',
      top: '22vh',
      left: '10vw',
      width: 120,
      height: 120,
      background: 'linear-gradient(135deg, #fff8 0%, #b3c6ffcc 100%)',
      borderRadius: '40% 60% 60% 40% / 50% 40% 60% 50%',
      boxShadow: '0 4px 32px #b3c6ff44',
      border: '1.5px solid #fff6',
      filter: 'blur(3px)',
      opacity: 0.5,
      zIndex: 1,
      animation: 'crystalFloat1 60s ease-in-out infinite alternate',
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(120deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 80%)',
        borderRadius: 'inherit',
        filter: 'blur(2px)',
        opacity: 0.7,
        pointerEvents: 'none',
      }} />
    </div>
  );
  // Subtle aurora/nebula effect
  const aurora = (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
      background: 'linear-gradient(120deg, rgba(179,198,255,0.13) 0%, rgba(186,230,253,0.13) 20%, rgba(236,254,255,0.13) 40%, rgba(244,114,182,0.10) 60%, rgba(34,211,238,0.10) 80%, rgba(251,191,36,0.10) 100%)',
      mixBlendMode: 'screen',
      filter: 'blur(60px)',
      opacity: 0.8,
      animation: 'auroraMove 90s linear infinite',
    }} />
  );
  // Very soft, glowing, slow particles
  const particleColors = [
    'radial-gradient(circle, #a5b4fc 0%, #38bdf8 60%, #6366f1 100%)',
    'radial-gradient(circle, #f472b6 0%, #f9a8d4 100%)',
    'radial-gradient(circle, #facc15 0%, #fde68a 100%)',
    'radial-gradient(circle, #6ee7b7 0%, #3b82f6 100%)',
    'radial-gradient(circle, #34d399 0%, #f472b6 100%)',
    'radial-gradient(circle, #f472b6 0%, #34d399 100%)',
    'radial-gradient(circle, #f472b6 0%, #facc15 100%)',
  ];
  const particles = Array.from({ length: 12 }).map((_, i) => (
    <div key={i} style={{
      position: 'absolute',
      top: `${20 + Math.sin(i) * 30 + (i * 13) % 60}%`,
      left: `${(i * 23) % 100}%`,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: particleColors[i % particleColors.length],
      boxShadow: `0 0 32px 12px #fff5, 0 0 12px 4px #fff3` ,
      animation: `particleDrift${i % 4} ${60 + i * 8}s linear infinite, particlePulse 6s ease-in-out infinite` ,
      zIndex: 1,
      pointerEvents: 'none',
      filter: 'blur(2px)',
      opacity: 0.6,
    }} />
  ));

  // Luminous, layered geometric shapes
  const shapes = (
    <>
      {/* Circle + inner vibrant orb */}
      <div style={{
        position: 'absolute',
        top: '10vh',
        right: '8vw',
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 70%, #f9a8d4 0%, #f472b6 100%)',
        opacity: 0.22,
        filter: 'blur(18px)',
        zIndex: 0,
        animation: 'shapeMoveCircle 70s linear infinite',
        pointerEvents: 'none',
        boxShadow: '0 0 32px 8px #f472b655',
      }} />
      <div style={{
        position: 'absolute',
        top: '16vh',
        right: '12vw',
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 60% 40%, #f472b6 0%, #f9a8d4 100%)',
        opacity: 0.32,
        filter: 'blur(8px)',
        zIndex: 0,
        animation: 'shapeMoveCircleInner 50s linear infinite',
        pointerEvents: 'none',
        boxShadow: '0 0 24px 6px #f472b655',
      }} />
      {/* Square + inner vibrant square */}
      <div style={{
        position: 'absolute',
        bottom: '12vh',
        left: '8vw',
        width: 100,
        height: 100,
        borderRadius: '18px',
        background: 'linear-gradient(135deg, #6ee7b7 0%, #3b82f6 100%)',
        opacity: 0.18,
        filter: 'blur(14px)',
        zIndex: 0,
        animation: 'shapeMoveSquare 90s linear infinite',
        pointerEvents: 'none',
        boxShadow: '0 0 28px 8px #3b82f655',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '16vh',
        left: '12vw',
        width: 50,
        height: 50,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #6ee7b7 100%)',
        opacity: 0.28,
        filter: 'blur(6px)',
        zIndex: 0,
        animation: 'shapeMoveSquareInner 60s linear infinite',
        pointerEvents: 'none',
        boxShadow: '0 0 16px 4px #3b82f655',
      }} />
      {/* Triangle + inner vibrant triangle */}
      <div style={{
        position: 'absolute',
        bottom: '18vh',
        right: '12vw',
        width: 120,
        height: 120,
        background: 'linear-gradient(120deg, #facc15 0%, #f472b6 100%)',
        opacity: 0.15,
        filter: 'blur(16px)',
        zIndex: 0,
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        animation: 'shapeMoveTriangle 80s linear infinite',
        pointerEvents: 'none',
        boxShadow: '0 0 24px 8px #facc1555',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '22vh',
        right: '16vw',
        width: 60,
        height: 60,
        background: 'linear-gradient(120deg, #f472b6 0%, #facc15 100%)',
        opacity: 0.22,
        filter: 'blur(8px)',
        zIndex: 0,
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        animation: 'shapeMoveTriangleInner 60s linear infinite',
        pointerEvents: 'none',
        boxShadow: '0 0 12px 4px #f472b655',
      }} />
    </>
  );

  // Button ripple effect (per button)
  const handleButtonClick = (btn, cb) => {
    setRippleBtn(btn);
    setTimeout(() => {
      setRippleBtn(null);
      cb();
    }, 350);
  };

  // Card shine overlay
  const cardShine = (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 3,
      background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.18) 100%)',
      mixBlendMode: 'screen',
      animation: 'shineMove 8s linear infinite',
      borderRadius: 'inherit',
    }} />
  );

  return (
    <div style={bgGradient}>
      {fontLinks}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobCycle1 {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(30px, 20px) rotate(90deg); }
          50% { transform: translate(0,40px) rotate(180deg); }
          75% { transform: translate(-30px, 20px) rotate(270deg); }
          100% { transform: translate(0,0) rotate(360deg); }
        }
        @keyframes blobCycle2 {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(-30px, -20px) rotate(-90deg); }
          50% { transform: translate(0,-40px) rotate(-180deg); }
          75% { transform: translate(30px, -20px) rotate(-270deg); }
          100% { transform: translate(0,0) rotate(-360deg); }
        }
        @keyframes shapeMoveCircle {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-30px, 40px) scale(1.08); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes shapeMoveCircleInner {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.12); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes shapeMoveSquare {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.04); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes shapeMoveSquareInner {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(1.08); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes shapeMoveTriangle {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.06); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes shapeMoveTriangleInner {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes auroraMove {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        @keyframes crystalFloat1 {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes particleDrift0 {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.7; }
          100% { transform: translateY(0) scale(1); opacity: 0.5; }
        }
        @keyframes particleDrift1 {
          0% { transform: translateX(0) scale(1); opacity: 0.5; }
          50% { transform: translateX(20px) scale(1.1); opacity: 0.7; }
          100% { transform: translateX(0) scale(1); opacity: 0.5; }
        }
        @keyframes particleDrift2 {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(12px) scale(1.05); opacity: 0.7; }
          100% { transform: translateY(0) scale(1); opacity: 0.5; }
        }
        @keyframes particleDrift3 {
          0% { transform: translateX(0) scale(1); opacity: 0.5; }
          50% { transform: translateX(-12px) scale(1.05); opacity: 0.7; }
          100% { transform: translateX(0) scale(1); opacity: 0.5; }
        }
        @keyframes particlePulse {
          0%, 100% { opacity: 0.5; filter: blur(2px); }
          50% { opacity: 0.7; filter: blur(0.5px); }
        }
        @keyframes shineMove {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        input:focus {
          border: none !important;
          box-shadow: 0 0 0 3px #a5b4fc33;
        }
        button:focus {
          outline: 3px solid #38bdf8;
        }
        .ripple {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 120%;
          height: 120%;
          background: radial-gradient(circle, #38bdf855 0%, transparent 70%);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0.1);
          animation: rippleAnim 0.35s linear;
          pointer-events: none;
          z-index: 3;
        }
        @keyframes rippleAnim {
          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
      {blobs}
      {aurora}
      {crystals}
      {particles}
      {shapes}
      <div style={{ ...glassCard, position: 'relative', overflow: 'hidden' }}>
        {cardShine}
        <h2 style={heading}>Join a Restaurant</h2>
        {step === 1 && (
          <div style={{ width: '100%', transition: 'opacity 0.5s' }}>
            <div style={label}>Paste the QR link given by the manager:</div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste join link here..."
              style={inputStyle}
              autoFocus
            />
            <button
              style={hover ? { ...buttonStyle, ...buttonHover } : buttonStyle}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => handleButtonClick('next', handleParseLink)}
              tabIndex={0}
            >
              {rippleBtn === 'next' && <span className="ripple" />}
              Next
            </button>
          </div>
        )}
        {step === 2 && (
          <div style={{ width: '100%', transition: 'opacity 0.5s' }}>
            <div style={label}>You're about to join the restaurant. Confirm below:</div>
            <div style={idBox}>
              <span style={{ color: '#6366f1', fontWeight: 700 }}>Restaurant ID:</span> {restaurantId}
            </div>
            <button
              style={hover ? { ...buttonStyle, ...buttonHover } : buttonStyle}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => handleButtonClick('confirm', handleJoin)}
              tabIndex={0}
            >
              {rippleBtn === 'confirm' && <span className="ripple" />}
              Confirm Join
            </button>
          </div>
        )}
        {error && <div style={errorStyle}>{error}</div>}
      </div>
    </div>
  );
}
