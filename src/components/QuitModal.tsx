import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getQuitMessage } from '../utils/helpers';

interface QuitModalProps {
  isOpen: boolean;
  currentPage: number;
  targetPage: number;
  bookTitle: string;
  onKeepReading: () => void;
  onEndSession: () => void;
}

export default function QuitModal({
  isOpen,
  currentPage,
  targetPage,
  bookTitle,
  onKeepReading,
  onEndSession,
}: QuitModalProps) {
  const { title, message, subMessage } = getQuitMessage(currentPage, targetPage);
  const targetReached = currentPage >= targetPage;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onKeepReading}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full"
          >
            <div className="bg-white dark:bg-surface-800 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
              {/* Handle bar (mobile) */}
              <div className="md:hidden flex justify-center pt-3">
                <div className="w-10 h-1 bg-surface-300 dark:bg-surface-600 rounded-full" />
              </div>

              {/* Close button (desktop) */}
              <button
                onClick={onKeepReading}
                className="hidden md:flex absolute top-4 right-4 w-8 h-8 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-700 text-surface-400 hover:text-surface-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 sm:p-8">
                {/* Status indicator */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={targetReached ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      targetReached
                        ? 'bg-success-500/10 text-success-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    <span className="text-3xl">{targetReached ? '\u2713' : '\u2022\u2022\u2022'}</span>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                    {title}
                  </h2>
                  <p className="text-lg text-surface-600 dark:text-surface-300 mb-2">
                    {message}
                  </p>
                  <p className="text-sm text-surface-400 dark:text-surface-500 leading-relaxed">
                    {subMessage}
                  </p>
                </div>

                {/* Progress info */}
                {!targetReached && (
                  <div className="mt-6 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-400">Current page</span>
                      <span className="font-semibold text-surface-900 dark:text-surface-100">{currentPage}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-surface-400">Target</span>
                      <span className="font-semibold text-brand-600 dark:text-brand-400">{targetPage}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  {targetReached ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={onEndSession}
                        className="w-full py-4 bg-success-500 hover:bg-success-600 text-white font-semibold rounded-2xl transition-colors text-lg"
                      >
                        Finish Session
                      </motion.button>
                      <button
                        onClick={onKeepReading}
                        className="w-full py-3 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 font-medium transition-colors"
                      >
                        Keep Going
                      </button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={onKeepReading}
                        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl transition-colors text-lg"
                      >
                        Keep Reading
                      </motion.button>
                      <button
                        onClick={onEndSession}
                        className="w-full py-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-400 font-medium transition-colors text-sm"
                      >
                        End Session
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
