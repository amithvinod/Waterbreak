import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { formatDuration } from '../utils/helpers';

interface SessionCompleteProps {
  isOpen: boolean;
  bookTitle: string;
  duration: number; // seconds
  pagesRead: number;
  onDone: () => void;
  onKeepReading: () => void;
}

export default function SessionComplete({
  isOpen,
  bookTitle,
  duration,
  pagesRead,
  onDone,
  onKeepReading,
}: SessionCompleteProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-surface-900/95 dark:bg-black/95" />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ delay: 0.1, type: 'spring', damping: 20 }}
            className="relative z-10 w-full max-w-sm text-center"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', damping: 12 }}
              className="mx-auto w-20 h-20 rounded-full bg-success-500 flex items-center justify-center mb-8 shadow-lg"
            >
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-medium text-success-400 uppercase tracking-widest mb-2">
                Target Complete
              </p>
              <h2 className="text-2xl font-bold text-white mb-2">
                You finished today's reading target.
              </h2>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-8 mt-8 mb-8"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-surface-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-2xl font-bold text-white">{formatDuration(duration)}</span>
                </div>
                <p className="text-xs text-surface-500 mt-1">Duration</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-surface-300">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-2xl font-bold text-white">{pagesRead}</span>
                </div>
                <p className="text-xs text-surface-500 mt-1">Pages</p>
              </div>
            </motion.div>

            {/* Book title */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-surface-400 mb-10 italic"
            >
              {bookTitle}
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDone}
                className="w-full py-4 bg-white text-surface-900 font-semibold rounded-2xl text-lg hover:bg-surface-100 transition-colors"
              >
                Done
              </motion.button>
              <button
                onClick={onKeepReading}
                className="w-full py-3 text-surface-400 hover:text-surface-200 font-medium transition-colors flex items-center justify-center gap-2"
              >
                Keep Reading
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
