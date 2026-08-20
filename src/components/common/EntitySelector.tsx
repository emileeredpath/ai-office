import { ENTITY_OPTIONS, useEntity } from '@/contexts/EntityContext';

// Persistent global entity selector — Phase 1A. Filters the Overview by the
// existing `brand` column; other screens keep their own independent brand
// filters unchanged for now (they are not redesigned in Phase 1A).
export function EntitySelector() {
  const { selectedEntity, setSelectedEntity } = useEntity();

  return (
    <div className="v2-entity-selector" role="tablist" aria-label="Entity">
      {ENTITY_OPTIONS.map((option) => {
        const isActive = selectedEntity === option.value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => setSelectedEntity(option.value)}
            className="v2-entity-pill"
            data-active={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
