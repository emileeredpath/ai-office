import { ReactNode } from 'react';
import { Canvas as R3FCanvas } from '@react-three/fiber';

interface CanvasProps {
  children: ReactNode;
}

export function Canvas({ children }: CanvasProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <R3FCanvas
        camera={{
          position: [15, 15, 15],
          fov: 50,
        }}
        style={{
          background: 'linear-gradient(135deg, #0f1117 0%, #1a1d27 100%)',
        }}
      >
        {children}
      </R3FCanvas>
    </div>
  );
}
