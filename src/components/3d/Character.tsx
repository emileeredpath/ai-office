import { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { CharacterController } from '@/systems/CharacterController';
import { Navigation } from '@/systems/Navigation';

interface CharacterProps {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  deskId: string;
}

export function Character({ position, color, deskId }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  const [idleTime, setIdleTime] = useState(0);
  const controllerRef = useRef<CharacterController | null>(null);
  const navigationRef = useRef<Navigation | null>(null);

  useEffect(() => {
    navigationRef.current = new Navigation();
    controllerRef.current = new CharacterController(deskId, navigationRef.current);
  }, [deskId]);

  useFrame((_state, deltaTime) => {
    if (!groupRef.current || !controllerRef.current) return;

    controllerRef.current.update(deltaTime);
    const charState = controllerRef.current.getState();
    const animation = controllerRef.current.getCurrentAnimation();
    const progress = controllerRef.current.getAnimationProgress();

    // Update position
    groupRef.current.position.copy(charState.position);

    // Handle animations
    if (animation === 'idle') {
      // Subtle body sway
      const sway = Math.sin(idleTime * 0.002) * 0.05;
      if (bodyRef.current) bodyRef.current.rotation.z = sway;
      setIdleTime(idleTime + 1);
    } else if (animation === 'walk') {
      // Walk cycle: alternating leg movement
      const walkCycle = Math.sin(progress * Math.PI * 2);
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.position.z = walkCycle * 0.15;
        rightLegRef.current.position.z = -walkCycle * 0.15;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.z = walkCycle * 0.3;
        rightArmRef.current.rotation.z = -walkCycle * 0.3;
      }
    } else if (animation === 'wave') {
      // Wave gesture: raise right arm and rotate
      if (rightArmRef.current) {
        rightArmRef.current.position.y = Math.sin(progress * Math.PI) * 0.3;
        rightArmRef.current.rotation.x = Math.sin(progress * Math.PI) * 0.8;
      }
    } else if (animation === 'nod') {
      // Nod gesture: head rotation
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(progress * Math.PI) * 0.3;
      }
    } else if (animation === 'celebrate') {
      // Celebrate: jump and raise arms
      const jumpHeight = Math.sin(progress * Math.PI) * 0.5;
      groupRef.current.position.y += jumpHeight * 0.1;
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.position.y = Math.sin(progress * Math.PI * 2) * 0.2;
        rightArmRef.current.position.y = Math.sin(progress * Math.PI * 2) * 0.2;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh ref={bodyRef} castShadow>
        <cylinderGeometry args={[0.3, 0.25, 0.6, 8]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 0.55, 0]} castShadow>
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
      <mesh ref={leftArmRef} position={[-0.4, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
        <meshStandardMaterial color={color} metalness={0.1} />
      </mesh>

      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.4, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
        <meshStandardMaterial color={color} metalness={0.1} />
      </mesh>

      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.15, -0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 6]} />
        <meshStandardMaterial color="#1a1d27" />
      </mesh>

      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.15, -0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 6]} />
        <meshStandardMaterial color="#1a1d27" />
      </mesh>
    </group>
  );
}
