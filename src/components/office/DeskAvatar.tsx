import { motion } from 'framer-motion';
import type { IdleAnimation } from '@/types/employee';

interface DeskAvatarProps {
  emoji: string;
  idleAnimation: IdleAnimation;
  accentColor: string;
}

function ThinkingBubble({ color }: { color: string }) {
  return (
    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-0.5">
      {[0, 0.3, 0.6].map((delay) => (
        <motion.span
          key={delay}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
          transition={{ duration: 1.5, delay, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function TypingIndicator({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs"
      style={{ color }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.2, repeat: Infinity }}
    >
      ⌨️
    </motion.div>
  );
}

function CoffeeSteam({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute -top-5 right-0 text-xs"
      animate={{ opacity: [0, 0.7, 0], y: [0, -8, -16] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{ color }}
    >
      ☕
    </motion.div>
  );
}

export function DeskAvatar({ emoji, idleAnimation, accentColor }: DeskAvatarProps) {
  return (
    <div className="relative flex items-center justify-center">
      {idleAnimation === 'thinking' && <ThinkingBubble color={accentColor} />}

      <motion.div
        className="text-4xl select-none"
        animate={{ rotate: [-1.5, 1.5, -1.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {emoji}
      </motion.div>

      {idleAnimation === 'typing' && <TypingIndicator color={accentColor} />}
      {idleAnimation === 'coffee' && <CoffeeSteam color={accentColor} />}
    </div>
  );
}
