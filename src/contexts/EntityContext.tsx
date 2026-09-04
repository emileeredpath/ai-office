import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Brand } from '@/types/index';

// Global entity selector — Phase 1A. Filters by the existing `brand` column
// already present on campaigns/tasks/funding records; no schema change.
// 'all' represents "MTech Group" — the combined, unfiltered view across every
// brand (including any brand not in ENTITY_OPTIONS below).
export type EntitySelection = 'all' | Brand;

// 'idaro' is individually selectable (Search Console Phase 1 gave it a
// real, entity-attributable data source) but stays out of every V2
// group-level total — see groupEntities.ts's GROUP_AGGREGATE_BRANDS,
// which is deliberately not the same list as this one.
export const ENTITY_OPTIONS: { value: EntitySelection; label: string }[] = [
  { value: 'all', label: 'MTech Group' },
  { value: 'brentwood', label: 'Brentwood' },
  { value: 'radio-links', label: 'Radio Links' },
  { value: 'capcom', label: 'Capcom' },
  { value: 'ircl', label: 'Irish Radio' },
  { value: 'idaro', label: 'IDARO' },
  { value: 'brentwood-marine', label: 'Brentwood Marine' },
];

interface EntityContextType {
  selectedEntity: EntitySelection;
  setSelectedEntity: (entity: EntitySelection) => void;
  isGroupView: boolean;
  matchesSelectedEntity: (brand: Brand | null | undefined) => boolean;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

const STORAGE_KEY = 'mtech-selected-entity';

export function EntityProvider({ children }: { children: ReactNode }) {
  const [selectedEntity, setSelectedEntity] = useState<EntitySelection>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ENTITY_OPTIONS.some((o) => o.value === saved)) return saved as EntitySelection;
    return 'all';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedEntity);
  }, [selectedEntity]);

  const isGroupView = selectedEntity === 'all';

  const matchesSelectedEntity = (brand: Brand | null | undefined) => {
    if (isGroupView) return true;
    return brand === selectedEntity;
  };

  return (
    <EntityContext.Provider value={{ selectedEntity, setSelectedEntity, isGroupView, matchesSelectedEntity }}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity() {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error('useEntity must be used within EntityProvider');
  }
  return context;
}
