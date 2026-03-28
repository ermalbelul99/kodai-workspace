import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';

const PARTICLE_COUNT = 20;
const COLORS = ['#10b981', '#4f46e5', '#FF3B2F', '#facc15'];

const SuccessCelebration = () => {
  const isCelebrating = useAppStore((s) => s.isCelebrating);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 600 - 200,
        rotate: Math.random() * 720 - 360,
        scale: Math.random() * 0.6 + 0.4,
        color: COLORS[i % COLORS.length],
        size: Math.random() * 8 + 4,
        duration: Math.random() * 1 + 2,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCelebrating]
  );

  return (
    <AnimatePresence>
      {isCelebrating && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: 0,
                scale: p.scale,
                rotate: p.rotate,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: p.duration, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                backgroundColor: p.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuccessCelebration;
