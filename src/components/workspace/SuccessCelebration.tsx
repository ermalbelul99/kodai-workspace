import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';

const PARTICLE_COUNT = 40;
const COLORS = ['#10b981', '#4f46e5', '#FF3B2F', '#facc15', '#ffffff', '#a855f7'];

const SuccessCelebration = () => {
  const isCelebrating = useAppStore((s) => s.isCelebrating);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 1200,
        y: Math.random() * -900 - 100,
        rotate: Math.random() * 1080 - 540,
        scale: Math.random() * 1.2 + 0.6,
        color: COLORS[i % COLORS.length],
        size: Math.random() * 12 + 6,
        duration: Math.random() * 1.5 + 1.5,
        delay: Math.random() * 0.4,
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
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 0.6, times: [0, 0.15, 1] }}
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
                  scale: [0, p.scale, p.scale * 0.5],
                  rotate: p.rotate,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeOut',
                  opacity: { times: [0, 0.6, 1] },
                  scale: { times: [0, 0.3, 1] },
                }}
                style={{
                  position: 'absolute',
                  width: p.shape > 0.6 ? p.size : p.size * 0.4,
                  height: p.shape > 0.3 ? p.size : p.size * 2,
                  borderRadius: p.shape > 0.7 ? '50%' : '2px',
                  backgroundColor: p.color,
                  boxShadow: `0 0 6px ${p.color}`,
                }}
              />
            ))}
          </div>

          {/* Success text */}
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 0.8] }}
            transition={{ duration: 2, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
          >
            <span className="text-4xl font-bold font-mono text-terminal-green drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]">
              🎉 Challenge Passed!
            </span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SuccessCelebration;
