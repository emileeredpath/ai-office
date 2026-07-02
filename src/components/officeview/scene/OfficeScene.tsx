import React from 'react';

interface OfficeSceneProps {
  children: React.ReactNode;
}

export function OfficeScene({ children }: OfficeSceneProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#e8dcc8',
        perspective: '1200px',
        overflow: 'hidden',
      }}
    >
      {/* Background - walls and sky */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #e8dcc8 0%, #e0d4c0 40%, #d4bfa8 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Right wall with windows */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '15%',
          height: '100%',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(200,220,255,0.1) 100%)',
          borderLeft: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {/* Windows */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              right: '12%',
              top: `${15 + i * 20}%`,
              width: '140px',
              height: '80px',
              border: '3px solid #8B7355',
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow: '0 15px 35px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            {/* Window glass with outdoor view */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(180,200,220,0.6) 0%, rgba(150,180,210,0.5) 50%, rgba(120,160,200,0.4) 100%)',
                backgroundImage: `
                  linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 30%),
                  linear-gradient(45deg, rgba(100,150,200,0.1) 25%, transparent 25%, transparent 75%, rgba(100,150,200,0.1) 75%),
                  linear-gradient(45deg, rgba(100,150,200,0.1) 25%, transparent 25%, transparent 75%, rgba(100,150,200,0.1) 75%)
                `,
                backgroundSize: '100% 100%, 4px 4px, 4px 4px',
              }}
            />

            {/* Window frame divider - vertical */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                width: '2px',
                backgroundColor: '#6B5344',
                boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.5)',
              }}
            />

            {/* Window frame divider - horizontal */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: '#6B5344',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
              }}
            />

            {/* Glass reflection */}
            <div
              style={{
                position: 'absolute',
                top: '5%',
                left: '10%',
                width: '30%',
                height: '25%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 100%)',
                borderRadius: '2px',
                filter: 'blur(2px)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Floor */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(to bottom, #c9a876 0%, #b8956b 30%, #a68560 60%, #8b6f47 100%)',
          backgroundImage: `
            radial-gradient(ellipse 1600px 400px at 50% -100px, rgba(255,255,255,0.15) 0%, transparent 50%),
            linear-gradient(90deg, rgba(139,111,71,0.1) 0%, transparent 30%, transparent 70%, rgba(139,111,71,0.1) 100%),
            repeating-linear-gradient(0deg, transparent 0%, transparent 80px, rgba(0,0,0,0.05) 80px, rgba(0,0,0,0.05) 160px),
            repeating-linear-gradient(90deg, transparent 0%, transparent 100px, rgba(0,0,0,0.03) 100px, rgba(0,0,0,0.03) 200px)
          `,
          boxShadow: 'inset 0 0 120px rgba(0,0,0,0.35), inset 0 50px 150px rgba(255,255,255,0.12)',
        }}
      />

      {/* Ceiling lights ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          height: '60%',
          background: 'radial-gradient(ellipse 1200px 600px at center, rgba(255,220,150,0.2) 0%, rgba(255,200,120,0.1) 40%, transparent 80%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Secondary ambient lighting from windows */}
      <div
        style={{
          position: 'absolute',
          top: '-5%',
          right: '-5%',
          width: '40%',
          height: '80%',
          background: 'radial-gradient(ellipse 800px 600px at right, rgba(200,220,255,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Marketing Team sign on back wall */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1a1a1a',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '800',
          letterSpacing: '1px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
          zIndex: 5,
          pointerEvents: 'none',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        MARKETING TEAM
      </div>

      {/* Small "Working together, achieving more" tagline */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: 'rgba(0,0,0,0.5)',
          fontStyle: 'italic',
          pointerEvents: 'none',
        }}
      >
        Working together, achieving more 🚀
      </div>

      {/* Central meeting area - round rug */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '280px',
          height: '180px',
          backgroundColor: 'rgba(180,140,100,0.3)',
          border: '2px solid rgba(140,100,60,0.3)',
          borderRadius: '50%',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.15), 0 20px 60px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Desks container with 3D positioning */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          perspective: '1200px',
        }}
      >
        {children}
      </div>

      {/* Water cooler - left side */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          bottom: '20%',
          width: '60px',
          height: '100px',
          backgroundColor: '#e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '2px solid #d1d5db',
          zIndex: 3,
        }}
      >
        {/* Tank top */}
        <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: '35px', height: '25px', backgroundColor: '#e0f2fe', border: '2px solid #0284c7', borderRadius: '8px', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }} />
      </div>

      {/* Plant - back left */}
      <div
        style={{
          position: 'absolute',
          left: '6%',
          bottom: '18%',
          width: '70px',
          height: '120px',
          zIndex: 2,
        }}
      >
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '45px', height: '35px', backgroundColor: '#8B6F47', borderRadius: '0 0 6px 6px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }} />
        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '80px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', borderRadius: '50% 50% 40% 40%', opacity: 0.85, boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }} />
      </div>

      {/* Team goals whiteboard */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          top: '25%',
          width: '180px',
          height: '140px',
          backgroundColor: '#f5f5f5',
          border: '4px solid #8B5435',
          borderRadius: '4px',
          padding: '12px',
          boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
          zIndex: 5,
          fontSize: '12px',
          fontWeight: '600',
          color: '#333',
        }}
      >
        <div style={{ marginBottom: '8px', textDecoration: 'underline' }}>Team Goals</div>
        <div>✓ Increase Brand Awareness</div>
        <div>✓ Generate Quality Leads</div>
        <div>✓ Improve Conversion Rate</div>
      </div>

      {/* Clock on wall */}
      <div
        style={{
          position: 'absolute',
          right: '22%',
          top: '20%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#f5e6d3',
          border: '4px solid #8B6F47',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          zIndex: 4,
        }}
      >
        🕐
      </div>
    </div>
  );
}
