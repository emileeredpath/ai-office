import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface DeskPosition {
  id: string;
  position: [number, number, number];
  color: string;
}

export function Environment() {
  const { scene } = useThree();
  const deskPositions: DeskPosition[] = [
    { id: '1', position: [-6, 0, -6], color: '#6366f1' },
    { id: '2', position: [-2, 0, -6], color: '#10b981' },
    { id: '3', position: [2, 0, -6], color: '#f59e0b' },
    { id: '4', position: [6, 0, -6], color: '#06b6d4' },
    { id: '5', position: [-6, 0, 2], color: '#ec4899' },
    { id: '6', position: [-2, 0, 2], color: '#f97316' },
    { id: '7', position: [2, 0, 2], color: '#a855f7' },
    { id: '8', position: [6, 0, 2], color: '#14b8a6' },
  ];

  useEffect(() => {
    scene.background = new THREE.Color(0x0f1117);
  }, [scene]);

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1d27" />
      </mesh>

      {/* Desks */}
      {deskPositions.map((desk) => (
        <group key={desk.id} position={desk.position}>
          {/* Desk surface */}
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 0.1, 1.5]} />
            <meshStandardMaterial color={desk.color} metalness={0.3} roughness={0.7} />
          </mesh>

          {/* Desk legs */}
          <mesh position={[-1, 0.2, -0.5]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.1]} />
            <meshStandardMaterial color="#2e3250" />
          </mesh>
          <mesh position={[1, 0.2, -0.5]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.1]} />
            <meshStandardMaterial color="#2e3250" />
          </mesh>
          <mesh position={[-1, 0.2, 0.5]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.1]} />
            <meshStandardMaterial color="#2e3250" />
          </mesh>
          <mesh position={[1, 0.2, 0.5]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.1]} />
            <meshStandardMaterial color="#2e3250" />
          </mesh>

          {/* Desk chair */}
          <mesh position={[0, 0.5, 0.8]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.1, 8]} />
            <meshStandardMaterial color={desk.color} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.8, 0.8]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.3, 8]} />
            <meshStandardMaterial color={desk.color} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Wall (back) */}
      <mesh position={[0, 3, -10]} receiveShadow>
        <planeGeometry args={[20, 6]} />
        <meshStandardMaterial color="#243347" />
      </mesh>

      {/* Potted plant decoration */}
      <group position={[9, 0, 5]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.8, 8]} />
          <meshStandardMaterial color="#8b5a3c" />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <icosahedronGeometry args={[0.6, 2]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      </group>
    </group>
  );
}
