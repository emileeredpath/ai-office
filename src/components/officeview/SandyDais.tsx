interface SandyDaisProps {
  isThinking: boolean;
  message?: string;
}

export function SandyDais({ isThinking, message }: SandyDaisProps) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {message && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full w-56 z-30 pointer-events-none">
          <div
            className="px-3 py-2 rounded-lg text-xs text-center shadow-lg"
            style={{ backgroundColor: 'rgba(10,14,20,0.95)', color: '#E8ECF1', border: '1px solid rgba(249,112,31,0.5)' }}
          >
            {message}
          </div>
        </div>
      )}

      {/* Glow ring on the floor */}
      <div
        className="absolute rounded-full"
        style={{
          width: 120,
          height: 46,
          bottom: '18%',
          background: 'radial-gradient(ellipse at center, rgba(249,112,31,0.35), rgba(139,92,246,0.15) 60%, transparent 75%)',
          filter: 'blur(2px)',
          animation: isThinking ? 'daisGlow 1.1s ease-in-out infinite' : 'daisGlow 3.5s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 100,
          height: 38,
          bottom: '20%',
          border: '2px solid rgba(249,112,31,0.6)',
          boxShadow: '0 0 20px rgba(249,112,31,0.5)',
        }}
      />

      {/* Sandy figure — taller, layered */}
      <div
        className="relative flex flex-col items-center"
        style={{
          marginBottom: 18,
          animation: isThinking ? 'sandySway 1s ease-in-out infinite' : 'sandySway 3s ease-in-out infinite',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))',
        }}
      >
        {/* Head + hair */}
        <div className="relative" style={{ width: 26, height: 26 }}>
          <div className="absolute rounded-full" style={{ inset: 0, background: 'linear-gradient(160deg, #F2C79B, #D89B68)' }} />
          <div
            className="absolute rounded-t-full"
            style={{ top: -5, left: -3, right: -3, height: 16, background: 'linear-gradient(180deg, #FFB067, #F9701F)' }}
          />
        </div>

        {/* Blazer torso */}
        <div
          style={{
            width: 34,
            height: 32,
            marginTop: -2,
            background: 'linear-gradient(160deg, #1D2A3A, #0F1620)',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
            border: '1px solid rgba(249,112,31,0.4)',
          }}
        />
        {/* Brain badge */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            top: 22,
            width: 16,
            height: 16,
            background: 'linear-gradient(135deg, #F9701F, #FFB067)',
            boxShadow: '0 0 8px rgba(249,112,31,0.7)',
          }}
        >
          <span style={{ fontSize: 9 }}>🧠</span>
        </div>
      </div>

      <p className="text-sm font-semibold" style={{ color: '#E8ECF1' }}>
        Sandy
      </p>
      <p className="text-xs" style={{ color: '#8B96A5' }}>
        Chief of Staff
      </p>
    </div>
  );
}
