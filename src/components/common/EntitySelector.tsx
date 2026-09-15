import { ENTITY_OPTIONS, useEntity } from '@/contexts/EntityContext';

// Persistent entity selection shared by screens. Each consumer applies its
// canonical record/campaign/source membership rules; this component only
// changes the selection.
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
