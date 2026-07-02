import type { Employee } from '@/types/employee';

interface Character3DDetailedProps {
  employee: Employee;
  isSelected: boolean;
  isTyping: boolean;
}

interface CharacterDesign {
  name: string;
  skinTone: string;
  hairColor: string;
  hairStyle: 'long' | 'short' | 'curly' | 'wavy' | 'straight';
  outfitColor: string;
  outfitType: string;
  eyeColor: string;
  accentColor: string;
}

const CHARACTER_DESIGNS: Record<string, CharacterDesign> = {
  'marketing-director': {
    name: 'Lucy',
    skinTone: '#E8B4A0',
    hairColor: '#2C2416',
    hairStyle: 'long',
    outfitColor: '#E8453D',
    outfitType: 'blazer',
    eyeColor: '#6B4423',
    accentColor: '#E8453D',
  },
  'website-auditor': {
    name: 'Sophie',
    skinTone: '#F5D4C0',
    hairColor: '#D4A856',
    hairStyle: 'straight',
    outfitColor: '#3BA876',
    outfitType: 'blouse',
    eyeColor: '#5C4033',
    accentColor: '#3BA876',
  },
  'proposal-writer': {
    name: 'Tom',
    skinTone: '#D9A881',
    hairColor: '#3D2817',
    hairStyle: 'short',
    outfitColor: '#2C5AA0',
    outfitType: 'shirt',
    eyeColor: '#5C4033',
    accentColor: '#2C5AA0',
  },
  'case-study-writer': {
    name: 'James',
    skinTone: '#C9976B',
    hairColor: '#5D3A24',
    hairStyle: 'curly',
    outfitColor: '#7C3AED',
    outfitType: 'sweater',
    eyeColor: '#6B4423',
    accentColor: '#7C3AED',
  },
  'email-marketing-manager': {
    name: 'Emily',
    skinTone: '#F8E4D2',
    hairColor: '#C49856',
    hairStyle: 'long',
    outfitColor: '#06B6D4',
    outfitType: 'blouse',
    eyeColor: '#8B6F47',
    accentColor: '#06B6D4',
  },
  'seo-ppc-manager': {
    name: 'Alex',
    skinTone: '#D4A574',
    hairColor: '#2A2A2A',
    hairStyle: 'short',
    outfitColor: '#2C5AA0',
    outfitType: 'polo',
    eyeColor: '#3A3A3A',
    accentColor: '#2C5AA0',
  },
  'social-media-manager': {
    name: 'Chloe',
    skinTone: '#ECC0A8',
    hairColor: '#6B3A7D',
    hairStyle: 'wavy',
    outfitColor: '#E84B8A',
    outfitType: 'blouse',
    eyeColor: '#8B4A8C',
    accentColor: '#E84B8A',
  },
  'funding-rewards-manager': {
    name: 'Marcus',
    skinTone: '#C9A87D',
    hairColor: '#3A3A3A',
    hairStyle: 'short',
    outfitColor: '#2C5AA0',
    outfitType: 'shirt',
    eyeColor: '#5C4033',
    accentColor: '#2C5AA0',
  },
};

export function Character3DDetailed({ employee, isSelected, isTyping }: Character3DDetailedProps) {
  const design = CHARACTER_DESIGNS[employee.id] || CHARACTER_DESIGNS['marketing-director'];

  return (
    <div
      style={{
        position: 'relative',
        width: '120px',
        height: '180px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <svg viewBox="0 0 120 180" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.2))' }}>
        {/* Seated pose - sitting at desk */}

        {/* Torso/Body */}
        <g>
          {/* Shirt/outfit body - seated posture */}
          <path
            d="M 40 70 L 35 100 Q 35 110 40 115 L 80 115 Q 85 110 85 100 L 80 70 Z"
            fill={design.outfitColor}
            stroke={`${design.outfitColor}dd`}
            strokeWidth="0.8"
          />

          {/* Shoulder definition */}
          <ellipse cx="40" cy="70" rx="6" ry="8" fill={design.skinTone} />
          <ellipse cx="80" cy="70" rx="6" ry="8" fill={design.skinTone} />

          {/* Shirt buttons/detailing */}
          <circle cx="60" cy="80" r="1.5" fill="rgba(0,0,0,0.2)" />
          <circle cx="60" cy="90" r="1.5" fill="rgba(0,0,0,0.2)" />
          <circle cx="60" cy="100" r="1.5" fill="rgba(0,0,0,0.2)" />
        </g>

        {/* Arms - typing position */}
        <g>
          {/* Left arm */}
          <g transform={isTyping ? 'rotate(-18 35 75)' : 'rotate(-10 35 75)'} style={{ transformOrigin: '35px 75px', transition: 'transform 0.3s ease-in-out' }}>
            <rect x="31" y="75" width="7" height="28" rx="3.5" fill={design.skinTone} />
            <circle cx="34.5" cy="105" r="4" fill={design.skinTone} />
          </g>

          {/* Right arm */}
          <g transform={isTyping ? 'rotate(18 85 75)' : 'rotate(10 85 75)'} style={{ transformOrigin: '85px 75px', transition: 'transform 0.3s ease-in-out' }}>
            <rect x="82" y="75" width="7" height="28" rx="3.5" fill={design.skinTone} />
            <circle cx="85.5" cy="105" r="4" fill={design.skinTone} />
          </g>
        </g>

        {/* Legs - seated */}
        <g>
          <rect x="42" y="112" width="6" height="22" rx="3" fill="#2a2a2a" />
          <rect x="72" y="112" width="6" height="22" rx="3" fill="#2a2a2a" />
          {/* Shoes */}
          <rect x="40" y="134" width="10" height="6" rx="2" fill="#1a1a1a" />
          <rect x="70" y="134" width="10" height="6" rx="2" fill="#1a1a1a" />
        </g>

        {/* Head */}
        <circle cx="60" cy="45" r="26" fill={design.skinTone} stroke={`${design.skinTone}cc`} strokeWidth="0.8" />

        {/* Hair */}
        <g fill={design.hairColor}>
          {design.hairStyle === 'long' && (
            <>
              {/* Long hair flowing down */}
              <path
                d="M 36 30 Q 34 20 36 10 Q 38 5 60 2 Q 82 5 84 10 Q 86 20 84 30 Q 82 38 60 45 Q 38 38 36 30 Z"
                fill={design.hairColor}
              />
              {/* Left side hair */}
              <path
                d="M 34 35 Q 32 50 33 65 Q 35 67 37 65 Q 36 52 37 38 Z"
                fill={design.hairColor}
                opacity="0.85"
              />
              {/* Right side hair */}
              <path
                d="M 86 35 Q 88 50 87 65 Q 85 67 83 65 Q 84 52 83 38 Z"
                fill={design.hairColor}
                opacity="0.85"
              />
            </>
          )}

          {design.hairStyle === 'short' && (
            <path
              d="M 36 28 Q 34 18 60 12 Q 86 18 84 28 Q 82 36 60 45 Q 38 36 36 28 Z"
              fill={design.hairColor}
            />
          )}

          {design.hairStyle === 'curly' && (
            <g>
              <circle cx="38" cy="18" r="5" />
              <circle cx="48" cy="8" r="5.5" />
              <circle cx="60" cy="5" r="6" />
              <circle cx="72" cy="8" r="5.5" />
              <circle cx="82" cy="18" r="5" />
              <path d="M 35 30 Q 34 40 35 50 Q 37 52 39 50 Q 38 42 38 32 Z" />
              <path d="M 85 30 Q 86 40 85 50 Q 83 52 81 50 Q 82 42 82 32 Z" />
            </g>
          )}

          {design.hairStyle === 'wavy' && (
            <path
              d="M 35 28 Q 33 18 60 10 Q 87 18 85 28 Q 84 35 60 45 Q 36 35 35 28 Z"
              fill={design.hairColor}
            />
          )}

          {design.hairStyle === 'straight' && (
            <path
              d="M 35 25 Q 33 15 60 10 Q 87 15 85 25 Q 84 36 60 45 Q 36 36 35 25 Z"
              fill={design.hairColor}
            />
          )}
        </g>

        {/* Eyes */}
        <g>
          {/* Left eye white */}
          <ellipse cx="48" cy="40" rx="4.5" ry="5" fill="#fff" stroke={design.eyeColor} strokeWidth="0.6" />
          {/* Left pupil */}
          <circle cx="48" cy="42" r="2.5" fill={design.eyeColor} />
          {/* Left eye shine */}
          <circle cx="49" cy="40" r="1" fill="#fff" opacity="0.7" />

          {/* Right eye white */}
          <ellipse cx="72" cy="40" rx="4.5" ry="5" fill="#fff" stroke={design.eyeColor} strokeWidth="0.6" />
          {/* Right pupil */}
          <circle cx="72" cy="42" r="2.5" fill={design.eyeColor} />
          {/* Right eye shine */}
          <circle cx="73" cy="40" r="1" fill="#fff" opacity="0.7" />
        </g>

        {/* Nose */}
        <path d="M 60 42 L 60 52" stroke={design.eyeColor} strokeWidth="1" strokeLinecap="round" opacity="0.4" />

        {/* Mouth - slight smile */}
        <path d="M 52 58 Q 60 62 68 58" stroke={design.eyeColor} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* Cheeks - blush */}
        <ellipse cx="38" cy="48" rx="3" ry="2.5" fill={design.hairColor} opacity="0.15" />
        <ellipse cx="82" cy="48" rx="3" ry="2.5" fill={design.hairColor} opacity="0.15" />

        {/* Head shine/highlight */}
        <ellipse cx="48" cy="28" rx="8" ry="10" fill="#fff" opacity="0.3" />

        {/* Neck connection */}
        <ellipse cx="60" cy="70" rx="10" ry="8" fill={design.skinTone} />
      </svg>

      {/* Selection glow */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            inset: '-12px',
            border: '2px solid ' + design.accentColor,
            borderRadius: '12px',
            opacity: 0.6,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 0 0 ${design.accentColor}44; }
          50% { opacity: 0.3; box-shadow: 0 0 0 6px ${design.accentColor}22; }
        }
      `}</style>
    </div>
  );
}
