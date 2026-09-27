import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { gsap } from 'gsap';
import './PizzaHero3D.css';

const SCALE = 1.3; // scale factor for all geometry (user's preferred)

function RimScrews() {
  // 4 screws at 0, 90, 180, 270 deg
  const screws = [];
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * 2 * Math.PI;
    screws.push(
      <mesh key={i} position={[Math.sin(angle) * 1.08 * SCALE, 0.13 * SCALE, Math.cos(angle) * 1.08 * SCALE]}>
        <cylinderGeometry args={[0.025 * SCALE, 0.025 * SCALE, 0.04 * SCALE, 16]} />
        <meshStandardMaterial color="#bfa14a" metalness={1} roughness={0.2} />
      </mesh>
    );
  }
  return <group>{screws}</group>;
}

function PaperDial() {
  // Use a slightly yellowed color for the dial
  return (
    <group>
      {/* Paper dial */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11 * SCALE, 0]}>
        <cylinderGeometry args={[0.97 * SCALE, 0, 0.01 * SCALE, 64]} />
        <meshStandardMaterial color="#f5ecd7" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Cardinal directions */}
      <Text position={[0, 0.13 * SCALE, -0.7 * SCALE]} fontSize={0.13 * SCALE} color="#222" fontWeight={700} anchorX="center" anchorY="middle">N</Text>
      <Text position={[0.7 * SCALE, 0.13 * SCALE, 0]} fontSize={0.13 * SCALE} color="#222" fontWeight={700} anchorX="center" anchorY="middle">E</Text>
      <Text position={[0, 0.13 * SCALE, 0.7 * SCALE]} fontSize={0.13 * SCALE} color="#222" fontWeight={700} anchorX="center" anchorY="middle">S</Text>
      <Text position={[-0.7 * SCALE, 0.13 * SCALE, 0]} fontSize={0.13 * SCALE} color="#222" fontWeight={700} anchorX="center" anchorY="middle">W</Text>
    </group>
  );
}

function TickMarks() {
  // 24 ticks (every 15 degrees)
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * 2 * Math.PI;
    const r1 = 0.97 * SCALE;
    const r2 = (i % 6 === 0 ? 0.85 : 0.91) * SCALE; // Major tick every 90deg
    ticks.push(
      <mesh key={i} position={[Math.sin(angle) * (r1 + r2) / 2, 0.13 * SCALE, Math.cos(angle) * (r1 + r2) / 2]} rotation={[-Math.PI / 2, 0, angle]}>
        <boxGeometry args={[(i % 6 === 0 ? 0.04 : 0.02) * SCALE, 0.12 * SCALE, 0.01 * SCALE]} />
        <meshStandardMaterial color={i % 6 === 0 ? '#222' : '#b6a77a'} metalness={0.3} roughness={0.5} />
      </mesh>
    );
  }
  return <group>{ticks}</group>;
}

function CompassBase() {
  return (
    <group>
      {/* Compass shadow for pop */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18 * SCALE, 0]}>
        <cylinderGeometry args={[1.18 * SCALE, 1.18 * SCALE, 0.08 * SCALE, 64]} />
        <meshStandardMaterial color="#000" transparent opacity={0.18} />
      </mesh>
      {/* Main base - dark, metallic, beveled */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13 * SCALE, 0]}>
        <cylinderGeometry args={[1 * SCALE, 1 * SCALE, 0.18 * SCALE, 64, 1, true]} />
        <meshStandardMaterial color="#23272f" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Brass rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03 * SCALE, 0]}>
        <cylinderGeometry args={[1.08 * SCALE, 1 * SCALE, 0.06 * SCALE, 64]} />
        <meshStandardMaterial color="#bfa14a" metalness={1} roughness={0.18} />
      </mesh>
      {/* Domed glass top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09 * SCALE, 0]}>
        <sphereGeometry args={[1.01 * SCALE, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#e0f7fa" metalness={0.2} roughness={0.05} transmission={0.85} thickness={0.18 * SCALE} clearcoat={1} clearcoatRoughness={0.1} opacity={0.7} transparent />
      </mesh>
      {/* Paper dial */}
      <PaperDial />
      {/* Tick marks */}
      <TickMarks />
      {/* Rim screws */}
      <RimScrews />
    </group>
  );
}

function CompassNeedle({ rotation }) {
  return (
    <group rotation={[0, rotation, 0]}>
      {/* Needle shadow */}
      <mesh position={[0, 0.15 * SCALE, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018 * SCALE, 0.018 * SCALE, 0.7 * SCALE, 32]} />
        <meshStandardMaterial color="#000" opacity={0.13} transparent />
      </mesh>
      {/* Needle shaft */}
      <mesh position={[0, 0.19 * SCALE, 0]}>
        <cylinderGeometry args={[0.018 * SCALE, 0.018 * SCALE, 0.7 * SCALE, 32]} />
        <meshStandardMaterial color="#bfa14a" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Red tip (N) */}
      <mesh position={[0, 0.19 * SCALE, -0.35 * SCALE]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.045 * SCALE, 0.18 * SCALE, 32]} />
        <meshStandardMaterial color="#c0392b" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* White tail (S) */}
      <mesh position={[0, 0.19 * SCALE, 0.35 * SCALE]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.045 * SCALE, 0.18 * SCALE, 32]} />
        <meshStandardMaterial color="#f5f5f5" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Needle base (hub) - brass */}
      <mesh position={[0, 0.18 * SCALE, 0]}>
        <cylinderGeometry args={[0.09 * SCALE, 0.09 * SCALE, 0.08 * SCALE, 32]} />
        <meshStandardMaterial color="#bfa14a" metalness={1} roughness={0.18} />
      </mesh>
      {/* White highlight edge */}
      <mesh position={[0, 0.22 * SCALE, -0.25 * SCALE]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012 * SCALE, 0.012 * SCALE, 0.18 * SCALE, 16]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.7} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Scene({ isOptimized, currentWaste, savings }) {
  const needleRef = useRef();
  const [needleRotation, setNeedleRotation] = useState(Math.PI);

  useEffect(() => {
    if (needleRef.current) {
      gsap.to(needleRef.current.rotation, {
        y: isOptimized ? 0 : Math.PI,
        duration: 1.5,
        ease: "elastic.out(1, 0.5)"
      });
    }
  }, [isOptimized]);

  return (
    <Canvas camera={{ position: [0, 3.1 * SCALE, 0], fov: 45 }} shadows style={{ background: 'none' }}>
      <ambientLight intensity={0.7} />
      {/* Warm point light for vintage feel */}
      <pointLight position={[0, 2 * SCALE, 2 * SCALE]} intensity={0.7} color="#ffd180" />
      <spotLight 
        position={[5 * SCALE, 8 * SCALE, 8 * SCALE]} 
        angle={0.4} 
        penumbra={1} 
        intensity={1.2} 
        castShadow 
      />
      <Suspense fallback={null}>
        <CompassBase />
        <group ref={needleRef}>
          <CompassNeedle rotation={needleRotation} />
        </group>
      </Suspense>
      {/* Current Waste Label */}
      <Html position={[0, 0.55 * SCALE, 0]} center>
        <div className="compass-label">
          Your current waste: {currentWaste}%
          {isOptimized && (
            <div className="savings-label">
              Potential savings: ${savings.toLocaleString()}
            </div>
          )}
        </div>
      </Html>
      <OrbitControls 
        enablePan={false} 
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}

export default function ProfitCompass() {
  const [isOptimized, setIsOptimized] = useState(false);
  const [currentWaste, setCurrentWaste] = useState(42);
  const [savings, setSavings] = useState(0);

  useEffect(() => {
    if (isOptimized) {
      // Animate waste reduction
      gsap.to({ value: currentWaste }, {
        value: 15,
        duration: 1.5,
        onUpdate: function() {
          setCurrentWaste(Math.round(this.targets()[0].value));
        }
      });
      // Animate savings increase
      gsap.to({ value: 0 }, {
        value: 1842,
        duration: 2,
        onUpdate: function() {
          setSavings(Math.round(this.targets()[0].value));
        }
      });
    } else {
      setCurrentWaste(42);
      setSavings(0);
    }
  }, [isOptimized]);

  return (
    <section className="profit-compass">
      <h1 className="compass-headline">
        Turn Your Waste Into Profit – At a Glance
      </h1>
      <p className="compass-subhead">
        Watch your savings grow in real-time:
        <br />
        <strong>AI reduces over-ordering by 30-50%</strong>
        <br />
        Cuts food waste by up to 40%
        <br />
        Boosts profit per plate automatically
      </p>
      <div className="compass-container">
        <Scene 
          isOptimized={isOptimized}
          currentWaste={currentWaste}
          savings={savings}
        />
        <button 
          className="cta compass-cta"
          onClick={() => setIsOptimized(!isOptimized)}
        >
          Spin Your Compass →
        </button>
      </div>
    </section>
  );
} 