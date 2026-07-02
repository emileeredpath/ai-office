import type { Employee } from '@/types/employee';

interface CharacterIllustratedProps {
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
  eyeColor: string;
  accentColor: string;
  bodyType: 'slim' | 'regular' | 'athletic';
}

const CHARACTER_DESIGNS: Record<string, CharacterDesign> = {
  'marketing-director': {
    name: 'Lucy',
    skinTone: '#E8B4A0',
    hairColor: '#3A2817',
    hairStyle: 'long',
    outfitColor: '#D84C45',
    eyeColor: '#6B4423',
    accentColor: '#D84C45',
    bodyType: 'regular',
  },
  'website-auditor': {
    name: 'Sophie',
    skinTone: '#F5D4C0',
    hairColor: '#D4A856',
    hairStyle: 'straight',
    outfitColor: '#2BA876',
    eyeColor: '#6B5023',
    accentColor: '#2BA876',
    bodyType: 'slim',
  },
  'proposal-writer': {
    name: 'Tom',
    skinTone: '#D9A881',
    hairColor: '#2C1810',
    hairStyle: 'short',
    outfitColor: '#1E5A9F',
    eyeColor: '#4A3428',
    accentColor: '#1E5A9F',
    bodyType: 'athletic',
  },
  'case-study-writer': {
    name: 'James',
    skinTone: '#C9976B',
    hairColor: '#4D3A2A',
    hairStyle: 'curly',
    outfitColor: '#6B2ADB',
    eyeColor: '#5C4033',
    accentColor: '#6B2ADB',
    bodyType: 'regular',
  },
  'email-marketing-manager': {
    name: 'Emily',
    skinTone: '#F8E4D2',
    hairColor: '#B8956B',
    hairStyle: 'long',
    outfitColor: '#00A0C6',
    eyeColor: '#8B6F47',
    accentColor: '#00A0C6',
    bodyType: 'slim',
  },
  'seo-ppc-manager': {
    name: 'Alex',
    skinTone: '#D4A574',
    hairColor: '#1a1a1a',
    hairStyle: 'short',
    outfitColor: '#1E5A9F',
    eyeColor: '#2a2a2a',
    accentColor: '#1E5A9F',
    bodyType: 'athletic',
  },
  'social-media-manager': {
    name: 'Chloe',
    skinTone: '#ECC0A8',
    hairColor: '#5C2A7D',
    hairStyle: 'wavy',
    outfitColor: '#D84B8A',
    eyeColor: '#8B4A8C',
    accentColor: '#D84B8A',
    bodyType: 'slim',
  },
  'funding-rewards-manager': {
    name: 'Marcus',
    skinTone: '#C9A87D',
    hairColor: '#2a2a2a',
    hairStyle: 'short',
    outfitColor: '#1E5A9F',
    eyeColor: '#4A3428',
    accentColor: '#1E5A9F',
    bodyType: 'athletic',
  },
};

export function CharacterIllustrated({ employee, isSelected, isTyping }: CharacterIllustratedProps) {
  const design = CHARACTER_DESIGNS[employee.id] || CHARACTER_DESIGNS['marketing-director'];

  return (
    <div
      style={{
        position: 'relative',
        width: '160px',
        height: '240px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.25))',
      }}
    >
      <svg viewBox="0 0 160 240" style={{ width: '100%', height: '100%' }}>
        {/* Torso/Body - seated */}
        <g>
          {/* Shirt/outfit - more detailed */}
          <ellipse cx="80" cy="90" rx="45" ry="50" fill={design.outfitColor} />

          {/* Shirt collar */}
          <path d="M 65 60 L 60 90 L 80 85 L 100 90 L 95 60 Z" fill={design.outfitColor} stroke={`${design.outfitColor}cc`} strokeWidth="0.5" />

          {/* Center seam/button detail */}
          <line x1="80" y1="65" x2="80" y2="120" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
          <circle cx="80" cy="78" r="2" fill="rgba(0,0,0,0.15)" />
          <circle cx="80" cy="92" r="2" fill="rgba(0,0,0,0.15)" />
          <circle cx="80" cy="106" r="2" fill="rgba(0,0,0,0.15)" />

          {/* Shoulder definition */}
          <ellipse cx="50" cy="70" rx="8" ry="12" fill={design.skinTone} />
          <ellipse cx="110" cy="70" rx="8" ry="12" fill={design.skinTone} />

          {/* Shade on torso */}
          <path d="M 50 80 Q 80 85 110 80 L 110 130 Q 80 135 50 130 Z" fill="rgba(0,0,0,0.05)" />
        </g>

        {/* Arms - typing position */}
        <g>
          {/* Left arm */}
          <g transform={isTyping ? 'rotate(-22 45 75)' : 'rotate(-15 45 75)'} style={{ transformOrigin: '45px 75px', transition: 'transform 0.3s ease-in-out' }}>
            <ellipse cx="38" cy="95" rx="10" ry="32" fill={design.skinTone} />
            <ellipse cx="35" cy="130" rx="8" ry="10" fill={design.skinTone} />
          </g>

          {/* Right arm */}
          <g transform={isTyping ? 'rotate(22 115 75)' : 'rotate(15 115 75)'} style={{ transformOrigin: '115px 75px', transition: 'transform 0.3s ease-in-out' }}>
            <ellipse cx="122" cy="95" rx="10" ry="32" fill={design.skinTone} />
            <ellipse cx="125" cy="130" rx="8" ry="10" fill={design.skinTone} />
          </g>
        </g>

        {/* Legs - seated */}
        <g>
          <rect x="55" y="135" width="8" height="35" rx="4" fill="#2a2a2a" />
          <rect x="97" y="135" width="8" height="35" rx="4" fill="#2a2a2a" />

          {/* Shoes */}
          <ellipse cx="59" cy="172" rx="8" ry="5" fill="#1a1a1a" />
          <ellipse cx="101" cy="172" rx="8" ry="5" fill="#1a1a1a" />

          {/* Shoe shine */}
          <ellipse cx="59" cy="170" rx="5" ry="2" fill="rgba(255,255,255,0.2)" />
          <ellipse cx="101" cy="170" rx="5" ry="2" fill="rgba(255,255,255,0.2)" />
        </g>

        {/* Neck */}
        <ellipse cx="80" cy="58" rx="14" ry="18" fill={design.skinTone} />

        {/* Head - larger, more detailed */}
        <circle cx="80" cy="35" r="32" fill={design.skinTone} stroke={`${design.skinTone}bb`} strokeWidth="0.5" />

        {/* Ears */}
        <ellipse cx="50" cy="32" rx="6" ry="10" fill={design.skinTone} stroke={`${design.skinTone}88`} strokeWidth="0.5" />
        <ellipse cx="110" cy="32" rx="6" ry="10" fill={design.skinTone} stroke={`${design.skinTone}88`} strokeWidth="0.5" />

        {/* Hair - detailed */}
        <g fill={design.hairColor}>
          {design.hairStyle === 'long' && (
            <>
              {/* Main hair */}
              <path d="M 52 12 Q 50 5 80 2 Q 110 5 108 12 Q 106 25 80 40 Q 54 25 52 12 Z" />
              {/* Left side hair strands */}
              <path d="M 48 18 Q 46 35 48 55 Q 50 58 52 55 Q 51 40 52 22 Z" opacity="0.85" />
              {/* Right side hair strands */}
              <path d="M 112 18 Q 114 35 112 55 Q 110 58 108 55 Q 109 40 108 22 Z" opacity="0.85" />
              {/* Back hair volume */}
              <path d="M 55 25 Q 60 22 80 20 Q 100 22 105 25 Q 100 40 80 45 Q 60 40 55 25 Z" opacity="0.7" />
            </>
          )}
          {design.hairStyle === 'short' && (
            <path d="M 52 14 Q 50 8 80 4 Q 110 8 108 14 Q 106 22 80 38 Q 54 22 52 14 Z" />
          )}
          {design.hairStyle === 'curly' && (
            <g>
              <circle cx="45" cy="15" r="6" />
              <circle cx="58" cy="6" r="7" />
              <circle cx="80" cy="2" r="8" />
              <circle cx="102" cy="6" r="7" />
              <circle cx="115" cy="15" r="6" />
              <path d="M 50 25 Q 48 40 50 55 Q 52 57 54 55 Q 53 42 54 28 Z" />
              <path d="M 110 25 Q 112 40 110 55 Q 108 57 106 55 Q 107 42 106 28 Z" />
            </g>
          )}
          {design.hairStyle === 'wavy' && (
            <path d="M 50 12 Q 48 6 80 3 Q 112 6 110 12 Q 110 20 108 28 Q 80 35 52 28 Q 50 20 50 12 Z" />
          )}
          {design.hairStyle === 'straight' && (
            <path d="M 50 10 Q 48 5 80 2 Q 112 5 110 10 Q 108 24 80 38 Q 52 24 50 10 Z" />
          )}
        </g>

        {/* Eyes - detailed with expression */}
        <g>
          {/* Left eye */}
          <ellipse cx="62" cy="32" rx="6" ry="8" fill="#fff" stroke={design.eyeColor} strokeWidth="0.8" />
          <circle cx="62" cy="34" r="3.5" fill={design.eyeColor} />
          <circle cx="63" cy="31" r="1.2" fill="#fff" opacity="0.8" />

          {/* Right eye */}
          <ellipse cx="98" cy="32" rx="6" ry="8" fill="#fff" stroke={design.eyeColor} strokeWidth="0.8" />
          <circle cx="98" cy="34" r="3.5" fill={design.eyeColor} />
          <circle cx="99" cy="31" r="1.2" fill="#fff" opacity="0.8" />

          {/* Eyebrows */}
          <path d="M 56 25 Q 62 23 68 25" stroke={design.hairColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 92 25 Q 98 23 104 25" stroke={design.hairColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        {/* Nose */}
        <path d="M 80 34 L 80 48 Q 80 50 78 50 M 80 50 Q 82 50 82 48" stroke={design.eyeColor} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />

        {/* Mouth - smile */}
        <path d="M 70 55 Q 80 60 90 55" stroke={design.eyeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />

        {/* Cheeks - rosy */}
        <circle cx="50" cy="40" r="4" fill={design.outfitColor} opacity="0.15" />
        <circle cx="110" cy="40" r="4" fill={design.outfitColor} opacity="0.15" />

        {/* Head shine/highlight */}
        <ellipse cx="60" cy="18" rx="12" ry="14" fill="#fff" opacity="0.35" />

        {/* Face shadow for depth */}
        <ellipse cx="80" cy="35" rx="30" ry="28" fill="rgba(0,0,0,0.03)" />
      </svg>

      {/* Selection glow */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            inset: '-16px',
            border: '2.5px solid ' + design.accentColor,
            borderRadius: '16px',
            opacity: 0.7,
            animation: 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 0 0 ${design.accentColor}44; }
          50% { opacity: 0.4; box-shadow: 0 0 0 8px ${design.accentColor}22; }
        }
      `}</style>
    </div>
  );
}
