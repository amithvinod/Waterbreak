import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Zap, Flame, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import PageTransition from '../components/PageTransition';
import { SessionDifficulty, SessionConfig } from '../types';
import { SESSION_CONFIGS, calculateTargetPage } from '../utils/helpers';

const difficultyIcons = {
  easy: Clock,
  normal: Zap,
  push: Flame,
};

const difficultyColors = {
  easy: 'from-emerald-500 to-teal-600',
  normal: 'from-brand-500 to-brand-700',
  push: 'from-orange-500 to-red-600',
};

export default function SessionSetupPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books, startSession, settings } = useApp();
  const [selected, setSelected] = useState<SessionDifficulty>(settings.defaultDifficulty);
  const [starting, setStarting] = useState(false);

  const book = books.find(b => b.id === bookId);

  if (!book) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <p className="text-surface-400">Book not found.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-brand-600 font-medium">
            Go Home
          </button>
        </div>
      </PageTransition>
    );
  }

  const handleStart = async () => {
    setStarting(true);
    try {
      const targetPage = calculateTargetPage(book.currentPage, book.totalPages, selected);
      await startSession(book.id, selected, targetPage);
      navigate(`/reader/${book.id}`);
    } catch (err) {
      console.error('Failed to start session:', err);
      setStarting(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100"
          >
            Start a Reading Session
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-surface-400 mt-2"
          >
            Your stopping point will be chosen for you.
          </motion.p>
        </div>

        {/* Book info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center"
        >
          <p className="text-sm text-surface-400">
            {book.title} · Page {book.currentPage}
          </p>
        </motion.div>

        {/* Difficulty options */}
        <div className="space-y-3">
          {(Object.keys(SESSION_CONFIGS) as SessionDifficulty[]).map((key, index) => {
            const config: SessionConfig = SESSION_CONFIGS[key];
            const Icon = difficultyIcons[key];
            const isSelected = selected === key;

            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
                onClick={() => setSelected(key)}
                className={`w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-glow'
                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600'
                }`}
                aria-label={`${config.label}: ${config.description}`}
                aria-pressed={isSelected}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${difficultyColors[key]} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                    {config.label}
                  </h3>
                  <p className="text-sm text-surface-400">
                    {config.description}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 transition-colors ${
                  isSelected ? 'text-brand-500' : 'text-surface-300 dark:text-surface-600'
                }`} />
              </motion.button>
            );
          })}
        </div>

        {/* Start button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStart}
            disabled={starting}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl transition-colors text-lg shadow-soft disabled:opacity-50"
          >
            {starting ? 'Starting...' : 'Begin Session'}
          </motion.button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
