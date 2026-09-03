import { useState } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';

// A reusable clickable "board" — the same primitive backs the Main
// Dashboard Wall, Campaign Planning Board, and Task Board. Hovering makes
// interactivity obvious (a brighter panel + a pointer cursor); clicking
// opens the mapped 2D screen. No data of its own — every stat line passed
// in comes from the same store/utils the 2D dashboard already uses.
interface InteractiveBoardProps {
  position: [number, number, number];
  title: string;
  stat?: string;
  onOpen: () => void;
  color?: string;
}

export function InteractiveBoard({ position, title, stat, onOpen, color = '#7c5cfc' }: InteractiveBoardProps) {
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={position} scale={hovered ? 1.05 : 1}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[2.8, 1.9, 0.15]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.9 : 0.5} />
      </mesh>
      {/* Label sits exactly on the clickable box (not offset above it) so
          the visible text and the raycast hit area always agree. */}
      <Html position={[0, 0, 0.09]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            textAlign: 'center',
            color: '#fff',
            fontFamily: 'var(--font-body, sans-serif)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>{title}</div>
          {stat && <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{stat}</div>}
        </div>
      </Html>
    </group>
  );
}
