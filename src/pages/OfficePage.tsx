import { OfficeFloor } from '@/components/office/OfficeFloor';
import { AmbientParticles } from '@/components/office/AmbientParticles';
import { useOfficeAmbience } from '@/hooks/useOfficeAmbience';

export function OfficePage() {
  const { greeting } = useOfficeAmbience();

  return (
    <div className="relative min-h-full">
      <AmbientParticles />

      <div className="relative z-10 p-6">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#F0F4F8' }}>
            AI Office Floor
          </h1>
          <p className="text-sm" style={{ color: '#8F9194' }}>
            {greeting}. Here's what the team is working on today.
          </p>
        </div>

        <OfficeFloor />
      </div>
    </div>
  );
}
