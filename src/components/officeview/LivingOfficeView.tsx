import { useOfficeStore } from '@/store/officeStore';
import type { Employee } from '@/types/employee';
import { OfficeDesk } from './OfficeDesk';
import { SandyDock } from './SandyDock';
import { ROLE_DISPLAY_NAMES } from './OfficeProps';

interface LivingOfficeViewProps {
  sandyThinking: boolean;
  sandyMessage?: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  onAskSandy?: () => void;
}

// Desk positions optimized for reference layout
const DESK_POSITIONS: Record<string, { x: number; y: number }> = {
  'marketing-director': { x: 8, y: 22 },
  'seo-ppc-manager': { x: 32, y: 28 },
  'website-auditor': { x: 52, y: 24 },
  'social-media-manager': { x: 12, y: 65 },
  'email-marketing-manager': { x: 42, y: 72 },
  'case-study-writer': { x: 72, y: 68 },
  'proposal-writer': { x: 75, y: 28 },
  'funding-rewards-manager': { x: 85, y: 50 },
};

// Speech bubbles data
const SPEECH_BUBBLES = [
  { text: 'Great work on the social campaign!', x: 22, y: 12, color: '#C4E5FF', position: 'top' },
  { text: 'Working on keyword research', x: 40, y: 18, color: '#E3F2FF', position: 'top' },
  { text: 'Found 15 issues checking now', x: 65, y: 14, color: '#FFF3CD', position: 'top' },
  { text: 'Shall we align on the new campaign?', x: 48, y: 50, color: '#FFE8E8', position: 'center' },
  { text: 'Interview with client at 2pm', x: 78, y: 45, color: '#E3F2FF', position: 'top' },
  { text: 'Building our new nurture sequence', x: 38, y: 48, color: '#E8F5E9', position: 'center' },
];

export function LivingOfficeView({
  sandyThinking,
  sandyMessage,
  selectedRoomId,
  onSelectRoom,
  onAskSandy,
}: LivingOfficeViewProps) {
  const employees = useOfficeStore((state) => state.employees);
  const selectedEmployeeId = useOfficeStore((state) => state.selectedEmployeeId);
  const selectEmployee = useOfficeStore((state) => state.selectEmployee);

  const isSelected = (id: string) => selectedEmployeeId === id;
  const isActive = (id: string) => selectedRoomId === id || employees.find((e) => e.id === id)?.status === 'working';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: `
          linear-gradient(180deg,
            #D4C5B8 0%,
            #C9B8AD 15%,
            #B8A899 40%,
            #A89883 100%)
        `,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top navigation bar */}
      <div
        style={{
          height: '56px',
          backgroundColor: '#2B2B3E',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '20px',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: '700' }}>Office Floor</div>
      </div>

      {/* Main office scene */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: `
            linear-gradient(180deg,
              #C9B8AD 0%,
              #B8A899 30%,
              #A89883 70%,
              #9A8975 100%),
            linear-gradient(90deg,
              rgba(180, 140, 100, 0.1) 0%,
              transparent 50%,
              rgba(150, 120, 90, 0.15) 100%)
          `,
          backgroundSize: '100% 100%, 100% 100%',
          perspective: '1200px',
        }}
      >
        {/* Far back wall with perspective */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '22%',
            background: `linear-gradient(180deg, #D4C5B8 0%, #C9B8AD 100%)`,
            boxShadow: 'inset 0 -20px 40px rgba(0,0,0,0.1)',
          }}
        >
          {/* Wall sign */}
          <div
            style={{
              position: 'absolute',
              left: '8%',
              top: '12%',
              width: '200px',
              padding: '12px 16px',
              backgroundColor: '#F5F1EB',
              border: '3px solid #8B7355',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#2B2B3E', letterSpacing: '2px' }}>
              MARKETING TEAM
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '4px' }}>
              Working together, achieving more 💪
            </div>
          </div>

          {/* Wall clock */}
          <div
            style={{
              position: 'absolute',
              right: '25%',
              top: '15%',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#F5D4A8',
              border: '3px solid #8B6F47',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#8B6F47',
            }}
          >
            ⏰
          </div>

          {/* Team Goals whiteboard */}
          <div
            style={{
              position: 'absolute',
              right: '8%',
              top: '10%',
              width: '200px',
              backgroundColor: '#F5F1EB',
              border: '3px solid #666',
              borderRadius: '4px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#2B2B3E', marginBottom: '8px' }}>
              Team Goals
            </div>
            <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
              <div>✓ Increase Brand Awareness</div>
              <div>✓ Generate Quality Leads</div>
              <div>✓ Improve Conversion Rate</div>
            </div>
          </div>
        </div>

        {/* Right wall with windows and light */}
        <div
          style={{
            position: 'absolute',
            right: '0',
            top: '0',
            width: '18%',
            height: '100%',
            background: `linear-gradient(90deg, transparent 0%, #C4B5A0 50%, #D4C4B4 100%)`,
            boxShadow: 'inset -10px 0 30px rgba(200, 180, 150, 0.3)',
          }}
        >
          {/* Windows with light rays */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`window-${i}`}
              style={{
                position: 'absolute',
                right: '8%',
                top: `${12 + i * 22}%`,
                width: '60px',
                height: '45px',
                backgroundColor: '#A8D8FF',
                border: '2px solid #7AC5FF',
                borderRadius: '3px',
                boxShadow: `inset 0 1px 3px rgba(255,255,255,0.6), 0 4px 12px rgba(100,150,200,0.3)`,
              }}
            />
          ))}
        </div>

        {/* Floor with perspective and gradient */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '50%',
            background: `
              linear-gradient(180deg,
                rgba(168, 136, 104, 0.1) 0%,
                rgba(150, 120, 90, 0.3) 100%),
              linear-gradient(90deg,
                #B5926D 0%,
                #A88663 25%,
                #9B7952 50%,
                #8E6F47 75%,
                #816B3D 100%)
            `,
            boxShadow: 'inset 0 10px 40px rgba(0,0,0,0.15)',
          }}
        />

        {/* Central collaboration area with rug */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '55%',
            transform: 'translate(-50%, -50%)',
            width: '280px',
            height: '180px',
            borderRadius: '50%',
            backgroundColor: '#C9A877',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2), inset 0 -4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
          }}
        >
          {/* Small table in center */}
          <div
            style={{
              width: '80px',
              height: '60px',
              backgroundColor: '#8B6F47',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '2px solid #6B5435',
            }}
          />
        </div>

        {/* Water cooler */}
        <div
          style={{
            position: 'absolute',
            left: '6%',
            bottom: '15%',
            width: '50px',
            height: '80px',
            backgroundColor: '#B3D9FF',
            borderRadius: '8px',
            border: '2px solid #5a9bd4',
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            zIndex: 3,
          }}
        />

        {/* Plants scattered around */}
        {[
          { left: '4%', bottom: '8%', size: 'large' },
          { right: '22%', bottom: '12%', size: 'medium' },
          { left: '90%', bottom: '20%', size: 'medium' },
        ].map((plant, i) => (
          <div
            key={`plant-${i}`}
            style={{
              position: 'absolute',
              left: plant.left,
              right: plant.right,
              bottom: plant.bottom,
              width: plant.size === 'large' ? '60px' : '45px',
              height: plant.size === 'large' ? '80px' : '65px',
              backgroundColor: '#2ba876',
              borderRadius: `${plant.size === 'large' ? '4px 4px 0 0' : '3px 3px 0 0'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 2,
            }}
          />
        ))}

        {/* Desks positioned around the office */}
        {employees.map((employee) => {
          const pos = DESK_POSITIONS[employee.id];
          if (!pos) return null;

          const isEmployeeActive = isActive(employee.id);
          const isEmployeeSelected = isSelected(employee.id);

          return (
            <div
              key={employee.id}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
              <OfficeDesk
                employee={employee}
                isSelected={isEmployeeSelected}
                isActive={isEmployeeActive}
                onSelect={() => {
                  selectEmployee(employee.id);
                  onSelectRoom(employee.id);
                }}
              />
            </div>
          );
        })}

        {/* Speech bubbles */}
        {SPEECH_BUBBLES.map((bubble, idx) => (
          <div
            key={`speech-${idx}`}
            style={{
              position: 'absolute',
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              transform: 'translate(-50%, -50%)',
              maxWidth: '120px',
              zIndex: 15,
            }}
          >
            <div
              style={{
                backgroundColor: bubble.color,
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                position: 'relative',
              }}
            >
              {bubble.text}
              {/* Tail */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '20px',
                  width: '0',
                  height: '0',
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${bubble.color}`,
                }}
              />
            </div>
          </div>
        ))}

        {/* Sandy Dock - bottom center */}
        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <SandyDock onAskSandy={onAskSandy || (() => {})} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
