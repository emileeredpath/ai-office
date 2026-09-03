import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CharacterModel } from '@/components/3d/CharacterModel';
import { CharacterAnimator } from '@/systems/CharacterAnimator';
import { appearancePresets } from '@/types/character';

// A single, reusable office avatar — click-to-move plus optional WASD.
//
// Deliberately NOT built on src/systems/CharacterController.ts +
// Navigation.ts + CharacterMovement.ts: those move a character between
// named desk waypoints via graph pathfinding, driven by workflow-handoff
// events (globalEventBus 'stepStarted' with 'handoff'/'work'/'review' step
// types) for a multi-employee simulation — none of which applies to one
// avatar walking to an arbitrary clicked floor point. Reusing them would
// have meant importing that whole event/workflow model for a feature that
// doesn't need it. The actual movement technique below (move toward a
// target position, normalize direction, scale by speed*deltaTime) mirrors
// CharacterController.update()'s well-known approach, but is a fresh,
// self-contained ~20 lines here — not an import.
//
// Genuinely reused: CharacterModel (pure geometry, no engine coupling) for
// the visible body, and CharacterAnimator (a plain idle/walk/wave timer,
// also decoupled) for animation state — both audited and safe to reuse
// as-is. appearancePresets is reused for one fixed look (marketingDirector)
// rather than importing the "one preset per employee" assumption those
// presets were built for.
export const SPEED = 4; // world units / second
const ARRIVE_THRESHOLD = 0.15;
export const ROOM_BOUNDS = { minX: -9, maxX: 9, minZ: -9, maxZ: 8 };

export function clampToRoom(v: THREE.Vector3) {
  v.x = THREE.MathUtils.clamp(v.x, ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX);
  v.z = THREE.MathUtils.clamp(v.z, ROOM_BOUNDS.minZ, ROOM_BOUNDS.maxZ);
  return v;
}

interface CharacterAvatarProps {
  startPosition?: [number, number, number];
  messages: string[];
  // Owned by the parent scene so the floor's click handler can write into
  // it directly (see MTechHQScreen) without either side needing to know
  // about the other's internals.
  targetRef: MutableRefObject<THREE.Vector3>;
}

export function CharacterAvatar({ startPosition = [0, 0, 4], messages, targetRef }: CharacterAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const animatorRef = useRef(new CharacterAnimator());
  const positionRef = useRef(new THREE.Vector3(...startPosition));
  const keysRef = useRef<Set<string>>(new Set());

  const appearance = useMemo(() => appearancePresets.marketingDirector, []);

  // WASD — optional, additive to click-to-move. Moves along world X/Z
  // (not camera-relative) — simple and predictable for this camera setup,
  // no need for camera-relative movement complexity in this first pass.
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const handleUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => setMessageIndex((i) => (i + 1) % messages.length), 4500);
    return () => clearInterval(interval);
  }, [messages.length]);

  useFrame((_state, deltaTime) => {
    const keys = keysRef.current;
    const wasdActive =
      keys.has('w') || keys.has('a') || keys.has('s') || keys.has('d') ||
      keys.has('arrowup') || keys.has('arrowdown') || keys.has('arrowleft') || keys.has('arrowright');

    if (wasdActive) {
      // While a movement key is held, keep pushing the target a step ahead
      // in that direction — reuses the same "chase the target" motion as
      // click-to-move below, just re-aimed every frame.
      const step = SPEED * deltaTime;
      if (keys.has('w') || keys.has('arrowup')) targetRef.current.z -= step;
      if (keys.has('s') || keys.has('arrowdown')) targetRef.current.z += step;
      if (keys.has('a') || keys.has('arrowleft')) targetRef.current.x -= step;
      if (keys.has('d') || keys.has('arrowright')) targetRef.current.x += step;
      clampToRoom(targetRef.current);
    }

    const direction = targetRef.current.clone().sub(positionRef.current);
    const distance = direction.length();
    const isMoving = distance > ARRIVE_THRESHOLD;

    if (isMoving) {
      direction.normalize();
      positionRef.current.addScaledVector(direction, SPEED * deltaTime);
      clampToRoom(positionRef.current);
      if (groupRef.current) {
        groupRef.current.rotation.y = Math.atan2(direction.x, direction.z);
      }
    }

    animatorRef.current.setAnimation(isMoving ? 'walk' : 'idle', isMoving ? 0.4 : 1);
    animatorRef.current.update(deltaTime);

    if (groupRef.current) {
      groupRef.current.position.copy(positionRef.current);
    }
  });

  const currentMessage = messages[messageIndex] ?? messages[0];

  return (
    <group ref={groupRef} position={startPosition}>
      <CharacterModel appearance={appearance} position={[0, 0, 0]} scale={1} />
      {currentMessage && (
        <Html position={[0, 2, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.96)',
              color: '#10192e',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            {currentMessage}
          </div>
        </Html>
      )}
    </group>
  );
}
