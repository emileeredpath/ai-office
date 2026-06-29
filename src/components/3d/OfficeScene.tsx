import { Canvas } from './Canvas';
import { Lighting } from './Lighting';
import { Environment } from './Environment';
import { Character } from './Character';
import { useOfficeStore } from '@/store/officeStore';
import { useEffect, useRef } from 'react';
import { EmployeeBehavior } from '@/systems/EmployeeBehavior';
import { Navigation } from '@/systems/Navigation';
import { globalEventBus } from '@/systems/EventBus';
import {
  initializeBehaviorTriggers,
  updateBehaviorTriggers,
} from '@/systems/BehaviorTriggers';

export function OfficeScene() {
  const employees = useOfficeStore((state) => state.employees);
  const behaviorRef = useRef<Map<string, EmployeeBehavior>>(new Map());
  const navigationRef = useRef<Navigation | null>(null);

  useEffect(() => {
    // Initialize navigation and behaviors
    navigationRef.current = new Navigation();
    behaviorRef.current.clear();

    employees.forEach((emp) => {
      const deskId = String(employees.indexOf(emp) + 1);
      const behavior = new EmployeeBehavior(
        emp.id,
        deskId,
        navigationRef.current!,
        globalEventBus
      );
      behaviorRef.current.set(emp.id, behavior);
    });

    initializeBehaviorTriggers();

    return () => {
      behaviorRef.current.clear();
      globalEventBus.clear();
    };
  }, [employees]);

  // Update behaviors on store changes
  useEffect(() => {
    updateBehaviorTriggers();
  }, [useOfficeStore]);

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
        const deskId = String(index + 1);
        const position = deskPositions[deskId] || [0, 0.5, 0];
        const behavior = behaviorRef.current.get(employee.id);
        const controller = behavior?.getController();
        return (
          <Character
            key={employee.id}
            id={employee.id}
            name={employee.name}
            position={position}
            color={employee.accentColor}
            deskId={deskId}
            controller={controller}
          />
        );
      })}
    </Canvas>
  );
}
