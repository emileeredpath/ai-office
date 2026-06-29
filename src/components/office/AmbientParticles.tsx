import { motion } from 'framer-motion';

const particles = [
  { x: '8%', y: '15%', size: 180, duration: 18, delay: 0 },
  { x: '75%', y: '10%', size: 220, duration: 22, delay: 3 },
  { x: '45%', y: '60%', size: 160, duration: 20, delay: 6 },
  { x: '90%', y: '70%', size: 200, duration: 25, delay: 2 },
  { x: '20%', y: '80%', size: 140, duration: 19, delay: 8 },
  { x: '60%', y: '30%', size: 120, duration: 16, delay: 4 },
];

export function AmbientParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(46,66,91,0.35) 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
