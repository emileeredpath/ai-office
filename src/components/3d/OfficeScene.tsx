import { Canvas } from './Canvas';
import { Lighting } from './Lighting';
import { Environment } from './Environment';
import { Character } from './Character';
import { useOfficeStore } from '@/store/officeStore';

export function OfficeScene() {
  const employees = useOfficeStore((state) => state.employees);

  const deskPositions: Record<string, [number, number, number]> = {
    '1': [-6, 0.5, -6],
    '2': [-2, 0.5, -6],
    '3': [2, 0.5, -6],
    '4': [6, 0.5, -6],
    '5': [-6, 0.5, 2],
    '6': [-2, 0.5, 2],
    '7': [2, 0.5, 2],
    '8': [6, 0.5, 2],
  };

  return (
    <Canvas>
      <Lighting />
      <Environment />

      {/* Characters at desks */}
      {employees.map((employee, index) => {
        const position = deskPositions[String(index + 1)] || [0, 0.5, 0];
        return (
          <Character
            key={employee.id}
            id={employee.id}
            name={employee.name}
            position={position}
            color={employee.accentColor}
          />
        );
      })}
    </Canvas>
  );
}
