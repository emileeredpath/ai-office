import { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface CharacterProps {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
}

export function Character({ position, color }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [idleTime, setIdleTime] = useState(0);

  useFrame(() => {
    if (groupRef.current) {
      // Subtle body sway animation (3s loop)
      const sway = Math.sin(idleTime * 0.002) * 0.05;
      groupRef.current.rotation.z = sway;
      setIdleTime(idleTime + 1);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.25, 0.6, 8]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.08, 0.65, 0.22]} castShadow>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0.08, 0.65, 0.22]} castShadow>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#000" />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.4, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
        <meshStandardMaterial color={color} metalness={0.1} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.4, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
        <meshStandardMaterial color={color} metalness={0.1} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.15, -0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 6]} />
        <meshStandardMaterial color="#1a1d27" />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.15, -0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 6]} />
        <meshStandardMaterial color="#1a1d27" />
      </mesh>
    </group>
  );
}
