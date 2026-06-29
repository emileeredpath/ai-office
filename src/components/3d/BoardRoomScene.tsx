import { Canvas } from './Canvas';
import { Lighting } from './Lighting';
import { useOfficeStore } from '@/store/officeStore';
import { Character } from './Character';
import { useEffect, useRef } from 'react';
import { EmployeeBehavior } from '@/systems/EmployeeBehavior';
import { Navigation } from '@/systems/Navigation';
import { globalEventBus } from '@/systems/EventBus';

export function BoardRoomScene() {
  const employees = useOfficeStore((state) => state.employees);
  const behaviorRef = useRef<Map<string, EmployeeBehavior>>(new Map());
  const navigationRef = useRef<Navigation | null>(null);

  useEffect(() => {
    navigationRef.current = new Navigation();
    behaviorRef.current.clear();

    employees.forEach((emp) => {
      const behavior = new EmployeeBehavior(emp.id, 'center', navigationRef.current!, globalEventBus);
      behaviorRef.current.set(emp.id, behavior);
    });
  }, [employees]);

  const chairPositions: [number, number, number][] = [
    [-4, 0.5, 0],
    [-2, 0.5, -2],
    [0, 0.5, -3],
    [2, 0.5, -2],
    [4, 0.5, 0],
    [2, 0.5, 2],
    [0, 0.5, 3],
    [-2, 0.5, 2],
  ];

  return (
    <Canvas>
      <Lighting />

      {/* Board Room Floor */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#22263a" />
      </mesh>

      {/* Board Room Table */}
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[5, 5, 0.1, 16]} />
        <meshStandardMaterial color="#3a4f6a" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Wall (back) */}
      <mesh position={[0, 3, -8]} receiveShadow>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#1a1d27" />
      </mesh>

      {/* Windows (decorative) */}
      {[0, 3, 6].map((x, i) => (
        <mesh key={i} position={[x - 4.5, 4, -7.9]} castShadow>
          <boxGeometry args={[1.5, 1.5, 0.2]} />
          <meshStandardMaterial color="#87ceeb" emissive="#87ceeb" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Characters seated around table */}
      {employees.map((employee, index) => {
        const position = chairPositions[index] || [0, 0.5, 0];
        const behavior = behaviorRef.current.get(employee.id);
        const controller = behavior?.getController();
        return (
          <Character
            key={employee.id}
            id={employee.id}
            name={employee.name}
            position={position}
            color={employee.accentColor}
            deskId="center"
            controller={controller}
          />
        );
      })}
    </Canvas>
  );
}
