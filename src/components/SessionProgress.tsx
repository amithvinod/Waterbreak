import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

interface SessionProgressProps {
  currentPage: number;
  targetPage: number;
  startingPage: number;
  className?: string;
}

export default function SessionProgress({
  currentPage,
  targetPage,
  startingPage,
  className = '',
}: SessionProgressProps) {
  const totalPages = targetPage - startingPage;
  const pagesRead = currentPage - startingPage;
  const progress = totalPages > 0 ? Math.min(100, (pagesRead / totalPages) * 100) : 0;
  const pagesLeft = Math.max(0, targetPage - currentPage);
  const completed = currentPage >= targetPage;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl rounded-2xl p-3 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Target className={`w-3.5 h-3.5 ${completed ? 'text-success-500' : 'text-brand-500'}`} />
        <span className={`text-xs font-semibold ${completed ? 'text-success-500' : 'text-surface-500 dark:text-surface-400'}`}>
          {completed ? 'Target reached!' : `${pagesLeft} page${pagesLeft !== 1 ? 's' : ''} to target`}
        </span>
      </div>
      
      <div className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${completed ? 'bg-success-500' : 'bg-brand-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-surface-400">p.{currentPage}</span>
        <span className={`text-[10px] font-medium ${completed ? 'text-success-500' : 'text-brand-500'}`}>
          Target: p.{targetPage}
        </span>
      </div>
    </motion.div>
  );
}
