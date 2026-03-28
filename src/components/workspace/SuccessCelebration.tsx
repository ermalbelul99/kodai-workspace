import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';

const PARTICLE_COUNT = 120;
const COLORS = ['#10b981', '#4f46e5', '#FF3B2F', '#facc15', '#ffffff', '#a855f7', '#06b6d4', '#f97316'];

const SuccessCelebration = () => {
  const isCelebrating = useAppStore((s) => s.isCelebrating);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 2000,
        y: Math.random() * -1200 - 50,
        rotate: Math.random() * 1440 - 720,
        scale: Math.random() * 2 + 0.8,
        color: COLORS[i % COLORS.length],
        size: Math.random() * 18 + 8,
        duration: Math.random() * 1.5 + 1.8,
        delay: Math.random() * 0.6,
        shape: Math.random(),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCelebrating]
  );

  return (
    <AnimatePresence>
      {isCelebrating && (
        <>
          {/* Flash overlay */}
          <motion.div
            className="fixed inset-0 z-[9998] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.8, times: [0, 0.12, 1] }}
            style={{ backgroundColor: '#10b981' }}
          />

          {/* Confetti particles */}
          <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: [1, 1, 0],
                  scale: [0, p.scale, p.scale * 0.3],
                  rotate: p.rotate,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeOut',
                  opacity: { times: [0, 0.65, 1] },
                  scale: { times: [0, 0.25, 1] },
                }}
                style={{
                  position: 'absolute',
                  width: p.shape > 0.6 ? p.size : p.size * 0.4,
                  height: p.shape > 0.3 ? p.size : p.size * 2.5,
                  borderRadius: p.shape > 0.7 ? '50%' : '2px',
                  backgroundColor: p.color,
                  boxShadow: `0 0 12px ${p.color}, 0 0 24px ${p.color}50`,
                }}
              />
            ))}
          </div>

          {/* Success text */}
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.3, 1, 0.7] }}
            transition={{ duration: 2.5, times: [0, 0.15, 0.65, 1], ease: 'easeOut' }}
          >
            <span className="text-6xl font-bold font-mono text-terminal-green drop-shadow-[0_0_40px_rgba(16,185,129,0.8)]">
              🎉 Challenge Passed!
            </span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SuccessCelebration;
