import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface-50 dark:bg-surface-900 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow"
        >
          <BookOpen className="w-8 h-8 text-white" />
        </motion.div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">WaterBreak</h1>
          <p className="text-sm text-surface-400 mt-1">Loading...</p>
        </div>
      </motion.div>
    </div>
  );
}
